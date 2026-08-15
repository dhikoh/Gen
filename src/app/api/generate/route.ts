import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";

const generateSchema = z.object({
  type: z.enum(["VIDEO", "IMAGE"]),
  channelId: z.string(),
  topic: z.string().min(1, "Topik tidak boleh kosong"),
  additionalContext: z.string().optional(),
  videoConfig: z.any().optional(),
  imageConfig: z.any().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`generate_${session.user.id}_${ip}`, 10, 60); 
    if (!isAllowed) {
      return NextResponse.json({ error: "Terlalu banyak request. Harap tunggu sebentar." }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = generateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { type, channelId, topic, additionalContext, videoConfig, imageConfig } = parsedData.data;

    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!dbUser) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

    if (dbUser.role !== "SUPERADMIN") {
      const now = new Date();
      if (dbUser.subscriptionStatus !== "ACTIVE" || (dbUser.subscriptionExpiresAt && dbUser.subscriptionExpiresAt < now)) {
        if (dbUser.subscriptionStatus === "ACTIVE" && dbUser.subscriptionExpiresAt && dbUser.subscriptionExpiresAt < now) {
          await prisma.user.update({ where: { id: dbUser.id }, data: { subscriptionStatus: "EXPIRED" } });
        }
        return NextResponse.json({ error: "Langganan Anda tidak aktif. Silakan beli paket PRO di menu Tagihan." }, { status: 403 });
      }
    }

    const channel = await prisma.profileChannel.findUnique({
      where: { id: channelId },
      include: { products: true }
    });

    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: "Profile Channel tidak valid." }, { status: 400 });
    }

    if (channel.isLocked) {
      return NextResponse.json({ error: "Channel terkunci. Silakan upgrade paket." }, { status: 403 });
    }

    // Build context strings
    const channelContext = `
Nama Channel/Akun: ${channel.channelName}
Niche: ${channel.niche || "-"}
Deskripsi/Ciri Khas: ${channel.description || "-"}
Gaya Visual: ${channel.visualAesthetic || "-"}
`.trim();

    let productContext = "";
    if (channel.products && channel.products.length > 0) {
      productContext = "Produk/Layanan yang ditawarkan (selipkan secara soft-selling jika memungkinkan):\n";
      channel.products.forEach(p => {
        productContext += `- ${p.name} (Rp ${p.price}): ${p.description || ""} [Link: ${p.link || "-"}]\n`;
      });
    }

    let masterPrompt = "";
    let systemInstruction = "";

    if (type === "VIDEO" && videoConfig) {
      systemInstruction = `Kamu adalah asisten ahli kreator konten dan scriptwriter profesional. Bertindaklah sebagai ${videoConfig.pov || "Ahli di bidang ini"}.`;
      
      let jsonFields = [
        `"judul_konten": "string (Judul menarik untuk video)"`
      ];
      if (videoConfig.includeCaption) jsonFields.push(`"caption_medsos": "string (Caption lengkap dengan hashtag)"`);
      if (videoConfig.includeThumbnail) jsonFields.push(`"ide_thumbnail": "string (Ide visual thumbnail yang clickbait namun relevan)"`);
      if (videoConfig.includeHtmlBlog) jsonFields.push(`"html_blog": "string (Artikel blog format HTML SEO-friendly berdasarkan skrip video)"`);
      
      jsonFields.push(`"segments": [\n    {\n      "order": number,\n      "visual": "string (Instruksi visual/kamera/B-roll)",\n      "audio": "string (Musik/Sound Effect)",\n      "caption": "string (Teks yang diucapkan/Voice Over)",\n      "duration_estimation": number (Estimasi detik)\n    }\n  ]`);

      masterPrompt = `Buatkan skrip video secara mendetail berdasarkan parameter berikut:

Topik: "${topic}"
Konteks Tambahan: ${additionalContext || "-"}

[PROFIL CHANNEL KREATOR]
${channelContext}
${productContext}

[PARAMETER VIDEO]
Target Platform: ${videoConfig.targetPlatform}
Aspect Ratio: ${videoConfig.aspectRatio}
Target Durasi: ${videoConfig.duration}
Laju Bicara: ${videoConfig.speechRate}

[STRUKTUR & GAYA KONTEN]
Komposisi: Edukasi ${videoConfig.compEdukasi}%, Hiburan ${videoConfig.compHiburan}%, Marketing ${videoConfig.compMarketing}%
Hook Style: ${videoConfig.hookStyle} ${videoConfig.includeHook ? "(WAJIB ada di detik awal)" : ""}
Ending Style: ${videoConfig.endingStyle} ${videoConfig.includeCTA ? "(Sertakan Call to Action yang kuat)" : ""}

[INSTRUKSI OUTPUT]
Berikan output HANYA dalam format JSON yang valid tanpa markdown block (\`\`\`). Struktur JSON wajib mengikuti skema berikut:
{
  ${jsonFields.join(",\n  ")}
}`;

    } else if (type === "IMAGE" && imageConfig) {
      systemInstruction = `Kamu adalah asisten ahli pembuat prompt untuk AI Image Generator (seperti Midjourney, DALL-E, Stable Diffusion).`;
      
      masterPrompt = `Buatkan ${imageConfig.variations} variasi prompt gambar berkualitas tinggi berbahasa Inggris (Master Prompt) berdasarkan parameter berikut:

Topik: "${topic}"
Konteks Tambahan: ${additionalContext || "-"}

[PROFIL KREATOR]
${channelContext}

[PARAMETER VISUAL GAMBAR]
Camera & Lens: ${imageConfig.cameraType}
Shot Type: ${imageConfig.shotType}
Lighting: ${imageConfig.lighting}
Mood/Atmosphere: ${imageConfig.mood}
Color Grading: ${imageConfig.colorGrading}
Visual Style: ${imageConfig.visualStyle}

[NEGATIVE PROMPT (HINDARI)]
${imageConfig.negativePrompt}

[INSTRUKSI OUTPUT]
Berikan output HANYA dalam format JSON yang valid. Struktur JSON wajib mengikuti skema berikut:
{
  "variations": [
    {
      "id": number,
      "prompt_text": "string (Prompt lengkap dalam bahasa Inggris, menggabungkan topik dan semua parameter visual secara natural)",
      "negative_prompt": "string (Berdasarkan referensi di atas)",
      "aspect_ratio": "string (Rekomendasi rasio seperti --ar 16:9)"
    }
  ]
}`;
    }

    const outputData = {
      master_prompt: masterPrompt,
      system_instruction: systemInstruction,
    };

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
          rawJson: JSON.stringify(outputData),
          parsedData: outputData as any,
          targetDurationSec: type === "VIDEO" ? (videoConfig?.duration === "Short (< 30s)" ? 30 : 60) : 0,
          wordCount: masterPrompt.split(" ").length,
          estimatedDurationSec: 0
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      data: outputData,
      draftId: draft.id
    }, { status: 200 });

  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server saat memproses prompt." }, { status: 500 });
  }
}
