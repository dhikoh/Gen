import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { applyRateLimit } from "@/lib/rateLimit";
import { mergeWavBuffers } from "@/lib/geminiTts";

const mergeSchema = z.object({
  audioBase64: z
    .array(z.string().min(1))
    .min(1, "Minimal 1 audio")
    .max(50, "Maksimal 50 scene"),
});

// POST /api/tts/merge — Gabungkan array WAV base64 menjadi satu WAV
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 merge per menit per user (operasi ini cukup berat di memori)
  const rl = await applyRateLimit(`tts-merge:${session.user.id}`, 10, 60);
  if (!rl) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan merge. Coba lagi dalam 1 menit." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = mergeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Input tidak valid." },
      { status: 400 }
    );
  }

  const { audioBase64 } = parsed.data;

  try {
    // Decode semua base64 → Buffer WAV
    const wavBuffers = audioBase64.map((b64) => Buffer.from(b64, "base64"));

    // Merge semua WAV menjadi satu
    const merged = mergeWavBuffers(wavBuffers);

    return NextResponse.json({
      success: true,
      audioBase64: merged.toString("base64"),
      mimeType: "audio/wav",
      sceneCount: audioBase64.length,
    });
  } catch (err) {
    console.error("[tts/merge] Error:", err);
    return NextResponse.json(
      { error: "Gagal menggabungkan audio. Pastikan semua scene sudah berhasil di-generate." },
      { status: 500 }
    );
  }
}
