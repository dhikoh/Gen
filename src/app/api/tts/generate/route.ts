import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import { decryptSecret } from "@/lib/crypto";
import { callGeminiTts, type TtsErrorCode } from "@/lib/geminiTts";
import { hasFeature } from "@/lib/planFeatures";

// Tidak efektif di self-hosted (VPS Coolify), timeout dikontrol Traefik/Nginx.
// Dipertahankan untuk kompatibilitas jika suatu saat di-deploy ke Vercel.
export const maxDuration = 60;

const generateSchema = z.object({
  text: z.string().min(1, "Teks tidak boleh kosong").max(5000, "Teks maksimal 5000 karakter"),
  voice: z.string().min(1).max(50),
  model: z.string().min(1).max(80),
  styleInstruction: z.string().max(500).optional(),
  speakingRate: z.number().min(0.25).max(4.0).optional(),
  pitchInstruction: z.string().max(200).optional(), // teks pitch (preset → string)
  keyId: z.string().optional(),                      // ID key spesifik untuk pengujian dari Settings
});

interface AttemptLog {
  keyId: string;
  keyFingerprint: string;
  errorCode?: TtsErrorCode;
  errorMessage?: string;
  success: boolean;
}

export async function POST(req: Request) {
  // ── Auth ──
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Rate limit: 40 generate per menit per user ──
  const rl = await applyRateLimit(`tts-gen:${session.user.id}`, 40, 60);
  if (!rl) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan TTS. Coba lagi dalam 1 menit." },
      { status: 429 }
    );
  }

  // ── Feature gate ──
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      currentPlan: {
        select: { features: true },
      },
    },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  const isSuperadmin = dbUser.role === "SUPERADMIN";
  const rawFeatures = (dbUser.currentPlan?.features as Record<string, boolean>) ?? {};
  if (!hasFeature(rawFeatures, "textToSpeechStudio", isSuperadmin)) {
    return NextResponse.json(
      { error: "Fitur Voice Studio tidak tersedia di plan Anda. Upgrade untuk mengakses." },
      { status: 403 }
    );
  }

  // ── Parse body ──
  const body = await req.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Input tidak valid." },
      { status: 400 }
    );
  }

  const { text, voice, model, styleInstruction, speakingRate = 1.0, pitchInstruction, keyId } = parsed.data;

  // Gabungkan pitch instruction + style instruction + tempo instruction ke teks (Gemini prompt steering)
  const prefixes: string[] = [];
  if (pitchInstruction) prefixes.push(pitchInstruction);
  if (styleInstruction) prefixes.push(`Style: ${styleInstruction}`);

  if (speakingRate && speakingRate !== 1.0) {
    if (speakingRate <= 0.6) {
      prefixes.push("Tempo bicara: sangat lambat dan tenang");
    } else if (speakingRate <= 0.85) {
      prefixes.push("Tempo bicara: agak lambat dan santai");
    } else if (speakingRate >= 1.4) {
      prefixes.push("Tempo bicara: sangat cepat dan antusias");
    } else if (speakingRate >= 1.15) {
      prefixes.push("Tempo bicara: agak cepat dan dinamis");
    }
  }

  const finalText = prefixes.length > 0
    ? `[${prefixes.join(". ")}]\n\n${text}`
    : text;

  // ── Ambil API keys user ──
  let apiKeys;
  if (keyId) {
    // Pengujian key tertentu (misal Test Key di Settings)
    const specificKey = await prisma.userApiKey.findFirst({
      where: {
        id: keyId,
        userId: session.user.id,
        provider: "GEMINI",
      },
    });
    apiKeys = specificKey ? [specificKey] : [];
  } else {
    // Alur reguler: cari key yang aktif, urutkan prioritas
    apiKeys = await prisma.userApiKey.findMany({
      where: {
        userId: session.user.id,
        provider: "GEMINI",
        isActive: true,
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });
  }

  if (apiKeys.length === 0) {
    return NextResponse.json(
      {
        error: "Belum ada API key Gemini aktif. Tambahkan di menu Settings → Voice Studio API Key.",
        errorCode: "NO_KEYS",
      },
      { status: 400 }
    );
  }

  // ── Loop failover sekuensial ──
  const attemptsLog: AttemptLog[] = [];
  let usedKeyId: string | null = null;
  let fallbackOccurred = false;

  for (let i = 0; i < apiKeys.length; i++) {
    const keyRecord = apiKeys[i];
    if (!keyRecord) continue;

    let rawKey: string;
    try {
      rawKey = decryptSecret(keyRecord.encryptedKey);
    } catch {
      // Key corrupt / secret berubah — skip dan log
      attemptsLog.push({
        keyId: keyRecord.id,
        keyFingerprint: keyRecord.keyFingerprint,
        errorCode: "UNKNOWN",
        errorMessage: "Gagal mendekripsi key. Key mungkin rusak.",
        success: false,
      });
      continue;
    }

    const result = await callGeminiTts(rawKey, finalText, voice, model);

    if (result.success && result.audioBuffer) {
      usedKeyId = keyRecord.id;
      if (i > 0) fallbackOccurred = true;

      attemptsLog.push({
        keyId: keyRecord.id,
        keyFingerprint: keyRecord.keyFingerprint,
        success: true,
      });

      // Update stats: success & pulihkan isActive jika sebelumnya mati karena false positive
      await prisma.userApiKey.update({
        where: { id: keyRecord.id },
        data: {
          isActive: true,
          lastUsedAt: new Date(),
          totalSuccessCount: { increment: 1 },
          lastErrorAt: null,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      }).catch(() => {}); // Non-blocking update

      const audioBase64 = result.audioBuffer.toString("base64");
      return NextResponse.json({
        success: true,
        audioBase64,
        mimeType: "audio/wav",
        usedKeyId,
        fallbackOccurred,
        attemptsLog,
      });
    }

    // Gagal — log dan lanjut ke key berikutnya
    attemptsLog.push({
      keyId: keyRecord.id,
      keyFingerprint: keyRecord.keyFingerprint,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      success: false,
    });

    // Update stats: failure
    await prisma.userApiKey.update({
      where: { id: keyRecord.id },
      data: {
        lastErrorAt: new Date(),
        lastErrorCode: result.errorCode || "UNKNOWN",
        lastErrorMessage: result.errorMessage?.slice(0, 500) || null,
        totalFailureCount: { increment: 1 },
      },
    }).catch(() => {});

    // Jika INVALID_KEY, auto-nonaktifkan agar tidak dicoba terus
    if (result.errorCode === "INVALID_KEY") {
      await prisma.userApiKey.update({
        where: { id: keyRecord.id },
        data: { isActive: false },
      }).catch(() => {});
    }
  }

  // ── Semua key gagal ──
  return NextResponse.json(
    {
      error: "Semua API key gagal. Periksa key Anda di Settings atau coba lagi nanti.",
      errorCode: "ALL_KEYS_FAILED",
      attemptsLog,
    },
    { status: 502 }
  );
}
