import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const saveDraftSchema = z.object({
  channelId: z.string(),
  type: z.enum(["VIDEO", "IMAGE"]),
  topic: z.string(),
  rawJson: z.string(),
  speechRate: z.number().default(130),
  title: z.string().optional(),
  targetDurationSec: z.number().optional(),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const body = await req.json();
    const parsedInput = saveDraftSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { channelId, type, topic, rawJson, speechRate, title: manualTitle, targetDurationSec } = parsedInput.data;

    // Parse the pasted JSON to validate it and extract data
    let parsedData: any;
    try {
      parsedData = JSON.parse(rawJson);
    } catch (e) {
      return NextResponse.json({ error: t("invalidJson") }, { status: 400 });
    }

    const channel = await prisma.profileChannel.findUnique({
      where: { id: channelId }
    });

    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: t("invalidChannel") }, { status: 400 });
    }

    // Calculate word count and estimated duration
    let wordCount = 0;
    let estimatedDurationSec = 0;
    let title = manualTitle || parsedData.judul_konten || `Draft ${type}: ${topic.substring(0, 30)}`;

    if (type === "VIDEO" && parsedData.segments && Array.isArray(parsedData.segments)) {
      let totalWords = 0;
      parsedData.segments.forEach((segment: any) => {
        if (segment.caption && typeof segment.caption === "string") {
          totalWords += segment.caption.split(/\s+/).filter(Boolean).length;
        }
      });
      wordCount = totalWords;
      // Calculate duration using exact words per second derived from speechRate (words per minute)
      const wordsPerSecond = speechRate / 60;
      estimatedDurationSec = Math.round(totalWords / wordsPerSecond);
    } else if (type === "IMAGE" && parsedData.variations && Array.isArray(parsedData.variations)) {
      let totalWords = 0;
      parsedData.variations.forEach((v: any) => {
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

      return tx.draft.create({
        data: {
          userId: session.user.id,
          channelId: channel.id,
          type: type,
          title: title,
          rawJson: rawJson,
          parsedData: parsedData,
          wordCount: wordCount,
          estimatedDurationSec: estimatedDurationSec,
          targetDurationSec: targetDurationSec || 0,
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

    const whereClause: any = { userId: session.user.id };
    if (channelId) whereClause.channelId = channelId;
    if (type) whereClause.type = type;

    const drafts = await prisma.draft.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ drafts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
