import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { Prisma, DraftType } from "@prisma/client";
import { z } from "zod";
import { requireActiveSubscription } from "@/lib/subscription";
import { applyRateLimit } from "@/lib/rateLimit";

const saveDraftSchema = z.object({
  channelId: z.string(),
  type: z.enum(["VIDEO", "IMAGE"]),
  // topic opsional untuk defense-in-depth — fix audit 3.1: ScenePromptStudio tidak punya
  // konsep topic eksplisit; backend membuat fallback agar pemanggil manapun aman
  topic: z.string().optional(),
  rawJson: z.string(),
  speechRate: z.number().optional(),
  title: z.string().optional(),
  targetDurationSec: z.number().optional(),
  targetSceneCount: z.number().optional(),
  narrativeLoopStyle: z.string().optional(),
  visualLoopStyle: z.string().optional(),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`draft_create_${session.user.id}_${ip}`, 10, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    await requireActiveSubscription(session.user.id);

    const body = await req.json();
    const parsedInput = saveDraftSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const {
      channelId,
      type,
      topic,
      rawJson,
      speechRate,
      title: manualTitle,
      targetDurationSec,
      targetSceneCount,
      narrativeLoopStyle,
      visualLoopStyle,
    } = parsedInput.data;

    // Parse the pasted JSON to validate it and extract data
    let parsedData: Record<string, unknown>;
    try {
      parsedData = JSON.parse(rawJson);
    } catch (e) {
      return NextResponse.json({ error: t("invalidJson") }, { status: 400 });
    }

    const channel = await prisma.profileChannel.findUnique({
      where: { id: channelId },
      include: { contentArchetype: true }
    });

    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: t("invalidChannel") }, { status: 400 });
    }

    if (channel.isLocked) {
      return NextResponse.json({ error: t("channelLocked") }, { status: 403 });
    }

    // Helper: parse durasi string/number ke detik (Bagian 23.3 poin 3)
    const parseSec = (val: unknown): number | null => {
      if (typeof val === "number" && !isNaN(val) && val > 0) return Math.round(val);
      if (typeof val === "string") {
        const m = val.match(/(\d+(?:\.\d+)?)/);
        if (m) {
          const n = parseFloat(m[1]);
          if (!isNaN(n) && n > 0) return Math.round(n);
        }
      }
      return null;
    };

    // Calculate word count and estimated duration (Bagian 23.3)
    let wordCount = 0;
    let estimatedDurationSec = 0;
    let durationSource: "SEGMENT_ESTIMATE" | "WORDCOUNT_FALLBACK" = "SEGMENT_ESTIMATE";

    // Fix audit 3.1: topic sekarang optional — fallback ke manualTitle, parsedData, atau default
    const effectiveTopic = topic || manualTitle || (typeof parsedData.judul_konten === "string" ? parsedData.judul_konten : "") || `Draft ${type}`;
    let title = manualTitle || (typeof parsedData.judul_konten === "string" ? parsedData.judul_konten : "") || `Draft ${type}: ${effectiveTopic.substring(0, 30)}`;

    if (type === "VIDEO") {
      let totalWords = 0;
      let totalSegmentDuration = 0;
      let validSegmentDurationCount = 0;

      // Schema lama: segments[].caption
      if (parsedData.segments && Array.isArray(parsedData.segments)) {
        parsedData.segments.forEach((segment: Record<string, unknown>) => {
          if (segment.caption && typeof segment.caption === "string") {
            totalWords += segment.caption.split(/\s+/).filter(Boolean).length;
          }
          const segSec = parseSec(segment.durasi_estimasi || segment.durasi || segment.duration);
          if (segSec !== null) {
            totalSegmentDuration += segSec;
            validSegmentDurationCount++;
          }
        });
      }

      // Schema baru: scenes[].narasi
      if (parsedData.scenes && Array.isArray(parsedData.scenes)) {
        parsedData.scenes.forEach((scene: Record<string, unknown>) => {
          if (scene.narasi && typeof scene.narasi === "string") {
            totalWords += scene.narasi.split(/\s+/).filter(Boolean).length;
          }
          if (scene.caption && typeof scene.caption === "string") {
            totalWords += scene.caption.split(/\s+/).filter(Boolean).length;
          }
          const scnSec = parseSec(scene.durasi_estimasi || scene.durasi || scene.duration);
          if (scnSec !== null) {
            totalSegmentDuration += scnSec;
            validSegmentDurationCount++;
          }
        });
      }

      wordCount = totalWords;
      const isVoiceOverMode = !channel.contentArchetype || channel.contentArchetype.narrationMode === "VOICE_OVER" || channel.contentArchetype.narrationMode === "HYBRID";
      const effectiveRate = speechRate && speechRate > 0 ? speechRate : (channel.speechRate || 0.35);

      // 1. Sumber utama: jumlah estimasi durasi per segmen dari AI eksternal
      if (totalSegmentDuration > 0 && validSegmentDurationCount > 0) {
        estimatedDurationSec = totalSegmentDuration;
        durationSource = "SEGMENT_ESTIMATE";
      } else if (isVoiceOverMode && totalWords > 0) {
        // 2. Fallback: kalkulasi durasi naskah berbasis wordCount dan rate
        // Jika effectiveRate <= 2: satuannya adalah detik per kata (misal 0.35 s/kata)
        // Jika effectiveRate > 2: satuannya adalah Words Per Minute (WPM, misal 130 atau 150 WPM)
        if (effectiveRate <= 2) {
          estimatedDurationSec = Math.round(totalWords * effectiveRate);
        } else {
          const wordsPerSecond = effectiveRate / 60;
          estimatedDurationSec = Math.round(totalWords / wordsPerSecond);
        }
        durationSource = "WORDCOUNT_FALLBACK";
      } else if (targetDurationSec && targetDurationSec > 0) {
        // 3. Fallback untuk diegetic/faceless tanpa durasi eksplisit per segmen
        estimatedDurationSec = targetDurationSec;
        durationSource = "SEGMENT_ESTIMATE";
      } else {
        estimatedDurationSec = 0;
        durationSource = "SEGMENT_ESTIMATE";
      }
    } else if (type === "IMAGE" && parsedData.variations && Array.isArray(parsedData.variations)) {
      let totalWords = 0;
      parsedData.variations.forEach((v: Record<string, unknown>) => {
         if (v.prompt_text && typeof v.prompt_text === "string") {
           totalWords += v.prompt_text.split(/\s+/).filter(Boolean).length;
         }
      });
      wordCount = totalWords;
    }


    const draft = await prisma.$transaction(async (tx) => {
      await tx.profileChannel.update({
        where: { id: channel.id },
        data: { usageCount: { increment: 1 }, lastUsedAt: new Date() }
      });

      const existingStub = await tx.draft.findFirst({
        where: {
          userId: session.user.id,
          channelId: channel.id,
          type: type,
          title: { equals: String(title), mode: "insensitive" },
        },
        orderBy: { createdAt: "desc" }
      });

      if (existingStub) {
        return tx.draft.update({
          where: { id: existingStub.id },
          data: {
            rawJson: rawJson,
            parsedData: parsedData as Prisma.InputJsonValue,
            wordCount: wordCount,
            estimatedDurationSec: estimatedDurationSec,
            durationSource: durationSource,
            targetDurationSec: targetDurationSec || 0,
            targetSceneCount: targetSceneCount || null,
            narrativeLoopStyle: narrativeLoopStyle || null,
            visualLoopStyle: visualLoopStyle || null,
            isTemplate: false
          }
        });
      }

      return tx.draft.create({
        data: {
          userId: session.user.id,
          channelId: channel.id,
          type: type,
          title: String(title),
          rawJson: rawJson,
          parsedData: parsedData as Prisma.InputJsonValue,
          wordCount: wordCount,
          estimatedDurationSec: estimatedDurationSec,
          durationSource: durationSource,
          targetDurationSec: targetDurationSec || 0,
          targetSceneCount: targetSceneCount || null,
          narrativeLoopStyle: narrativeLoopStyle || null,
          visualLoopStyle: visualLoopStyle || null,
          isTemplate: false
        }
      });
    });

    return NextResponse.json({ success: true, draftId: draft.id }, { status: 201 });

  } catch (error) {
    console.error("Save Draft API error:", error);
    return NextResponse.json({ error: t("draftSaveError") }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    const type = searchParams.get('type');

    const whereClause: Prisma.DraftWhereInput = { userId: session.user.id };
    if (channelId) whereClause.channelId = channelId;
    if (type) whereClause.type = type as DraftType;

    const drafts = await prisma.draft.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ drafts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
