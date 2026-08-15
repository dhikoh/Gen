import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";

const generateSchema = z.object({
  type: z.enum(["VIDEO", "IMAGE"]),
  topic: z.string().min(1, "Topik tidak boleh kosong"),
  additionalContext: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`generate_${session.user.id}_${ip}`, 10, 60); // 10 per minute max
    if (!isAllowed) {
      return NextResponse.json({ error: "Terlalu banyak request. Harap tunggu sebentar." }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = generateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: parsedData.error.issues[0].message }, { status: 400 });
    }

    const { type, topic, additionalContext } = parsedData.data;

    // Simulate LLM Processing Delay (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get user's primary channel
    const channel = await prisma.profileChannel.findFirst({
      where: { userId: session.user.id }
    });

    if (!channel) {
      return NextResponse.json({ error: "Profile Channel tidak ditemukan. Harap lengkapi profil Anda." }, { status: 400 });
    }

    // Mock output based on 11.1 specifications
    const mockOutput = {
      master_prompt: `Buatkan konten ${type} tentang "${topic}". ${additionalContext ? `Konteks tambahan: ${additionalContext}` : ''}`,
      system_instruction: "Kamu adalah asisten ahli kreator konten.",
      segments: [
        {
          order: 1,
          visual: "Kamera menyorot wajah pembicara dengan efek zoom-in.",
          audio: "Suara BGM upbeat yang menggugah semangat.",
          caption: `Pernahkah kalian memikirkan tentang ${topic}?`,
          duration_estimation: 3
        },
        {
          order: 2,
          visual: "Tampilkan teks beranimasi di tengah layar yang menekankan poin utama.",
          audio: "Efek suara swoosh saat teks muncul.",
          caption: "Ini adalah tiga hal penting yang harus kalian tahu!",
          duration_estimation: 5
        }
      ]
    };

    // Increment usage counter (MVP soft-limit) and create Draft in transaction
    const draft = await prisma.$transaction(async (tx) => {
      await tx.profileChannel.update({
        where: { id: channel.id },
        data: { usageCount: { increment: 1 }, lastUsedAt: new Date() }
      });

      return tx.draft.create({
        data: {
          userId: session.user.id,
          channelId: channel.id,
          type: type,
          title: `Prompt ${type}: ${topic.substring(0, 30)}`,
          rawJson: JSON.stringify(mockOutput),
          parsedData: mockOutput,
          targetDurationSec: 60,
          wordCount: 25,
          estimatedDurationSec: 8
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      data: mockOutput,
      draftId: draft.id
    }, { status: 200 });

  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server saat memproses prompt." }, { status: 500 });
  }
}
