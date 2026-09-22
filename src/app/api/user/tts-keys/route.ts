import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import { encryptSecret, maskApiKey, getKeyFingerprint } from "@/lib/crypto";
import { validateGeminiApiKey } from "@/lib/geminiTts";
import { MAX_TTS_API_KEYS } from "@/lib/ttsVoices";

// ─── GET: Daftar API key milik user (tanpa pernah expose encryptedKey) ─────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.userApiKey.findMany({
    where: { userId: session.user.id, provider: "GEMINI" },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      label: true,
      keyFingerprint: true,
      isActive: true,
      priority: true,
      lastUsedAt: true,
      lastErrorAt: true,
      lastErrorCode: true,
      lastErrorMessage: true,
      totalSuccessCount: true,
      totalFailureCount: true,
      createdAt: true,
    },
  });

  // Tambah maskedKey untuk display
  const result = keys.map((k: typeof keys[0]) => ({
    ...k,
    maskedKey: `\u2022\u2022\u2022\u2022 ${k.keyFingerprint}`,
  }));

  return NextResponse.json({ success: true, keys: result });
}

// ─── POST: Tambah API key baru ─────────────────────────────────────────────────
const addKeySchema = z.object({
  apiKey: z.string().min(10, "API key terlalu pendek").max(200, "API key terlalu panjang"),
  label: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 10 penambahan key per 5 menit per user
  const rl = await applyRateLimit(`tts-key-add:${session.user.id}`, 10, 300);
  if (!rl) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = addKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Input tidak valid." }, { status: 400 });
  }

  const { apiKey, label } = parsed.data;

  // Cek batas maksimum key
  const existingCount = await prisma.userApiKey.count({
    where: { userId: session.user.id, provider: "GEMINI" },
  });
  if (existingCount >= MAX_TTS_API_KEYS) {
    return NextResponse.json(
      { error: `Maksimum ${MAX_TTS_API_KEYS} API key Gemini.` },
      { status: 400 }
    );
  }

  // Validasi key ke Gemini sebelum disimpan
  const validation = await validateGeminiApiKey(apiKey);
  if (!validation.valid) {
    return NextResponse.json(
      { error: `API key tidak valid: ${validation.message || "Periksa kembali key Anda."}` },
      { status: 400 }
    );
  }

  // Enkripsi dan simpan
  const encryptedKey = encryptSecret(apiKey);
  const keyFingerprint = getKeyFingerprint(apiKey);
  const maskedKey = maskApiKey(apiKey);

  // Priority default = setelah key yang ada
  const nextPriority = existingCount;

  const created = await prisma.userApiKey.create({
    data: {
      userId: session.user.id,
      provider: "GEMINI",
      label: label || null,
      encryptedKey,
      keyFingerprint,
      priority: nextPriority,
    },
    select: {
      id: true,
      label: true,
      keyFingerprint: true,
      isActive: true,
      priority: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, key: { ...created, maskedKey } }, { status: 201 });
}
