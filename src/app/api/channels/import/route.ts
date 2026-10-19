import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getApiTranslator } from "@/lib/apiI18n";
import { applyRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireActiveSubscription } from "@/lib/subscription";
import { channelBundleSchema } from "@/lib/channelBundle";
import { isRecord } from "@/lib/typeGuards";

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    try {
      await requireActiveSubscription(session.user.id);
    } catch (e: unknown) {
      const err = e as Error;
      if (err && err.message === "User not found") {
        return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
      }
      return NextResponse.json({ error: t("inactiveSub") }, { status: 403 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(
      `import_channel_${session.user.id}_${ip}`,
      10,
      60 * 15
    );
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyChannels") }, { status: 429 });
    }

    // Enforce 5MB max payload size
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
      return NextResponse.json({ error: t("payloadTooLarge") }, { status: 413 });
    }

    const body = await req.json();
    const parsed = channelBundleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: t("invalidData"),
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const bundle = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verifikasi Kuota Channel Paket
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        include: { currentPlan: true },
      });

      const maxChannels = user?.currentPlan?.maxChannels || 1;
      const currentChannelsCount = await tx.profileChannel.count({
        where: { userId: session.user.id },
      });

      if (currentChannelsCount >= maxChannels) {
        throw new Error("MAX_CHANNELS_LIMIT");
      }

      // 2. Hubungkan atau cari ContentArchetype
      let effectiveArchetypeId: string | null = null;
      if (bundle.channel.contentArchetype?.name) {
        const matchingArch = await tx.contentArchetype.findFirst({
          where: { name: bundle.channel.contentArchetype.name },
          select: { id: true },
        });
        if (matchingArch) {
          effectiveArchetypeId = matchingArch.id;
        }
      }

      if (!effectiveArchetypeId) {
        const defaultArch = await tx.contentArchetype.findFirst({
          where: { isSystem: true },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        if (defaultArch) {
          effectiveArchetypeId = defaultArch.id;
        }
      }

      // 3. Buat ProfileChannel
      const createdChannel = await tx.profileChannel.create({
        data: {
          userId: session.user.id,
          channelName: bundle.channel.channelName,
          niche: bundle.channel.niche,
          description: bundle.channel.description,
          targetPlatform: bundle.channel.targetPlatform,
          personaPov: bundle.channel.personaPov,
          speechRate: bundle.channel.speechRate ?? 0.35,
          visualAesthetic: bundle.channel.visualAesthetic,
          cta1: bundle.channel.cta1,
          cta2: bundle.channel.cta2,
          audioBGM: bundle.channel.audioBGM ?? true,
          audioSFX: bundle.channel.audioSFX ?? true,
          audioVO: bundle.channel.audioVO ?? true,
          socialLinks: bundle.channel.socialLinks ?? undefined,
          contentArchetypeId: effectiveArchetypeId,
        },
      });

      // 4. Buat Produk-produk jika ada
      let productsCount = 0;
      if (bundle.products && bundle.products.length > 0) {
        await tx.product.createMany({
          data: bundle.products.map((p) => ({
            channelId: createdChannel.id,
            name: p.name,
            description: p.description || null,
            price: Math.round(p.price) || 0,
            link: p.link || null,
          })),
        });
        productsCount = bundle.products.length;
      }

      // 5. Buat UsedTitles jika ada
      let usedTitlesCount = 0;
      if (bundle.usedTitles && bundle.usedTitles.length > 0) {
        const records = bundle.usedTitles
          .map((item) => {
            const titleStr = typeof item === "string" ? item : item.title;
            const itemType = typeof item === "object" && item.type === "IMAGE" ? "IMAGE" : "VIDEO";
            return {
              userId: session.user.id,
              channelId: createdChannel.id,
              type: itemType as "VIDEO" | "IMAGE",
              title: titleStr.trim(),
            };
          })
          .filter((rec) => rec.title.length > 0);

        if (records.length > 0) {
          await tx.usedTitle.createMany({
            data: records,
          });
          usedTitlesCount = records.length;
        }
      }

      // 6. Sinkronkan Generator Studio Form State (channelFormStates)
      let generatorSettingsApplied = false;
      if (bundle.generatorSettings && isRecord(bundle.generatorSettings)) {
        const currentPrefs = isRecord(user?.generatorPreferences)
          ? (user.generatorPreferences as Record<string, unknown>)
          : {};
        const currentChannelStates = isRecord(currentPrefs.channelFormStates)
          ? (currentPrefs.channelFormStates as Record<string, unknown>)
          : {};

        const updatedChannelStates = {
          ...currentChannelStates,
          [createdChannel.id]: {
            ...bundle.generatorSettings,
            channelId: createdChannel.id,
          },
        };

        await tx.user.update({
          where: { id: session.user.id },
          data: {
            generatorPreferences: {
              ...currentPrefs,
              channelFormStates: updatedChannelStates,
            } as Prisma.InputJsonObject,
          },
        });
        generatorSettingsApplied = true;
      }

      return {
        channel: createdChannel,
        productsCount,
        usedTitlesCount,
        generatorSettingsApplied,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Channel bundle berhasil diimpor lengkap",
        ...result,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "MAX_CHANNELS_LIMIT") {
      return NextResponse.json(
        {
          error: t("maxChannelsReached"),
        },
        { status: 403 }
      );
    }
    console.error("Gagal import channel bundle:", err);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
