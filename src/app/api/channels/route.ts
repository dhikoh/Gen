import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { enforceChannelLimits } from "@/lib/channelLockLogic";
import { applyRateLimit } from "@/lib/rateLimit";
import { requireActiveSubscription } from "@/lib/subscription";

const channelSchema = z.object({
  channelName: z.string().min(1),
  niche: z.string().optional(),
  description: z.string().optional(),
  visualAesthetic: z.string().optional(),
  cta1: z.string().optional(),
  cta2: z.string().optional(),
  audioBGM: z.boolean().optional(),
  audioSFX: z.boolean().optional(),
  audioVO: z.boolean().optional(),
  socialLinks: z.union([z.string(), z.array(z.string())]).optional(),
});

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const channels = await prisma.profileChannel.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" }
    });
    
    // Also return maxChannels from the user's plan to help UI
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { currentPlan: true }
    });

    const maxChannels = user?.currentPlan?.maxChannels || 1;

    return NextResponse.json({ channels, maxChannels }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    // Require active subscription
    try {
      await requireActiveSubscription(session.user.id);
    } catch (e: unknown) {
      const err = e as Error;
      if (err && err.message === "User not found") {
        return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
      }
      return NextResponse.json({ error: t("inactiveSub") }, { status: 403 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`create_channel_${session.user.id}_${ip}`, 10, 60 * 15); // 10 per 15 minutes
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyChannels") }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = channelSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    let channel;
    let limitErrMax: number | null = null;
    try {
      channel = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: session.user.id },
          include: { currentPlan: true }
        });
        const maxChannels = user?.currentPlan?.maxChannels || 1;
        const currentChannelsCount = await tx.profileChannel.count({
          where: { userId: session.user.id }
        });

        if (currentChannelsCount >= maxChannels) {
          limitErrMax = maxChannels;
          throw new Error("MAX_CHANNELS_LIMIT");
        }

        return await tx.profileChannel.create({
          data: {
            userId: session.user.id,
            channelName: parsedData.data.channelName,
            niche: parsedData.data.niche,
            description: parsedData.data.description,
            visualAesthetic: parsedData.data.visualAesthetic,
            cta1: parsedData.data.cta1,
            cta2: parsedData.data.cta2,
            audioBGM: parsedData.data.audioBGM ?? true,
            audioSFX: parsedData.data.audioSFX ?? true,
            audioVO: parsedData.data.audioVO ?? true,
            socialLinks: parsedData.data.socialLinks ? parsedData.data.socialLinks : undefined,
          }
        });
      }, { isolationLevel: 'Serializable' });
    } catch (e: unknown) {
      const err = e as Error;
      if (err && err.message === "MAX_CHANNELS_LIMIT") {
        return NextResponse.json({ error: t("maxChannelsReached", { max: limitErrMax || 1 }) }, { status: 403 });
      }
      throw e;
    }

    await enforceChannelLimits(session.user.id);

    return NextResponse.json({ success: true, channel }, { status: 201 });

  } catch (error) {
    console.error("Channel Create API error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
