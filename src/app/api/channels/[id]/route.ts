import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";
import { enforceChannelLimits } from "@/lib/channelLockLogic";

const channelSchema = z.object({
  channelName: z.string().min(1, "Nama channel harus diisi"),
  niche: z.string().optional(),
  description: z.string().optional(),
  visualAesthetic: z.string().optional(),
  cta1: z.string().optional(),
  cta2: z.string().optional(),
  audioBGM: z.boolean().optional(),
  audioSFX: z.boolean().optional(),
  audioVO: z.boolean().optional(),
  socialLinks: z.any().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`put_channel_${session.user.id}_${ip}`, 20, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = channelSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const channel = await prisma.profileChannel.findUnique({ where: { id } });
    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: t("channelNotFound") }, { status: 404 });
    }

    if (channel.isLocked) {
      return NextResponse.json({ error: t("channelLocked") }, { status: 403 });
    }

    const updated = await prisma.profileChannel.update({
      where: { id },
      data: {
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

    return NextResponse.json({ success: true, channel: updated }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`del_channel_${session.user.id}_${ip}`, 10, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const channel = await prisma.profileChannel.findUnique({ where: { id } });
    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: t("channelNotFound") }, { status: 404 });
    }

    // We can't delete the only channel if we want to enforce at least 1 channel, 
    // but typically a user can delete their channels. Let's allow deletion.
    await prisma.profileChannel.delete({ where: { id } });

    await enforceChannelLimits(session.user.id);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
