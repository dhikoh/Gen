import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { Prisma, DraftType } from "@prisma/client";
import { z } from "zod";
import { requireActiveSubscription, SubscriptionInactiveError } from "@/lib/subscription";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import sanitizeHtml from "sanitize-html";

const saveDraftSchema = z.object({
  channelId: z.string(),
  type: z.enum(["VIDEO", "IMAGE"]),
  topic: z.string().max(500).optional(),
  rawJson: z.string().max(500_000),
  speechRate: z.number().optional(),
  title: z.string().max(500).optional(),
  targetDurationSec: z.number().optional(),
  targetSceneCount: z.number().optional(),
  narrativeLoopStyle: z.string().max(100).optional(),
  visualLoopStyle: z.string().max(100).optional(),
  narrationMode: z.enum(["VOICE_OVER", "DIEGETIC_ONLY", "SILENT_TEXT_ONLY", "HYBRID"]).optional(),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`draft_create_${session.user.id}_${ip}`, 10, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    // P1-4: Protected by active subscription guard
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
      narrationMode,
    } = parsedInput.data;

    // Parse the pasted JSON to validate it and extract data
    let parsedData: Record<string, unknown>;
    try {
      parsedData = JSON.parse(rawJson);
    } catch {
      return NextResponse.json({ error: t("invalidJson") }, { status: 400 });
    }

    // P1-15: Server-side sanitization of html_blog before saving to DB
    if (parsedData && typeof parsedData.html_blog === "string") {
      parsedData.html_blog = sanitizeHtml(parsedData.html_blog, {
        allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a', 'br', 'hr', 'blockquote'],
        allowedAttributes: { a: ['href', 'target', 'rel'] },
        allowedSchemes: ['http', 'https', 'mailto']
      });
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

    let wordCount = 0;
    let estimatedDurationSec = 0;
    let durationSource: "SEGMENT_ESTIMATE" | "WORDCOUNT_FALLBACK" = "SEGMENT_ESTIMATE";

    const effectiveTopic = topic || manualTitle || (typeof parsedData.judul_konten === "string" ? parsedData.judul_konten : "") || `Draft ${type}`;
    const title = manualTitle || (typeof parsedData.judul_konten === "string" ? parsedData.judul_konten : "") || `Draft ${type}: ${effectiveTopic.substring(0, 30)}`;

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

      // P1-5: Respect explicit narrationMode if passed, or channel archetype fallback
      const effectiveNarrationMode = narrationMode || channel.contentArchetype?.narrationMode || "VOICE_OVER";
      const isVoiceOverMode = effectiveNarrationMode === "VOICE_OVER" || effectiveNarrationMode === "HYBRID";
      const effectiveRate = speechRate && speechRate > 0 ? speechRate : (channel.speechRate || 0.35);

      if (totalSegmentDuration > 0 && validSegmentDurationCount > 0) {
        estimatedDurationSec = totalSegmentDuration;
        durationSource = "SEGMENT_ESTIMATE";
      } else if (isVoiceOverMode && totalWords > 0) {
        if (effectiveRate <= 2) {
          estimatedDurationSec = Math.round(totalWords * effectiveRate);
        } else {
          const wordsPerSecond = effectiveRate / 60;
          estimatedDurationSec = Math.round(totalWords / wordsPerSecond);
        }
        durationSource = "WORDCOUNT_FALLBACK";
      } else if (targetDurationSec && targetDurationSec > 0) {
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

      // P1-3: ONLY match existing stub drafts with isStub: true. Never overwrite real finished drafts!
      const existingStub = await tx.draft.findFirst({
        where: {
          userId: session.user.id,
          channelId: channel.id,
          type: type,
          title: { equals: String(title), mode: "insensitive" },
          isStub: true,
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
            isStub: false,
            // Preserve isTemplate state from existing draft
            isTemplate: existingStub.isTemplate
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
          isStub: false,
          isTemplate: false
        }
      });
    });

    return NextResponse.json({ success: true, draftId: draft.id }, { status: 201 });

  } catch (error) {
    // P1-4: Map SubscriptionInactiveError to HTTP 403
    if (error instanceof SubscriptionInactiveError) {
      return NextResponse.json({ error: t("subscriptionInactive") }, { status: 403 });
    }
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

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`drafts_get_${session.user.id}_${ip}`, 60, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    const typeParam = searchParams.get('type')?.toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const skip = (page - 1) * limit;

    const whereClause: Prisma.DraftWhereInput = { userId: session.user.id };
    if (channelId) whereClause.channelId = channelId;

    // P1-13: Strict enum validation for type query parameter
    if (typeParam && (typeParam === "VIDEO" || typeParam === "IMAGE")) {
      whereClause.type = typeParam as DraftType;
    }

    const [total, drafts] = await Promise.all([
      prisma.draft.count({ where: whereClause }),
      prisma.draft.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      })
    ]);

    return NextResponse.json({
      drafts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error("GET drafts API error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
