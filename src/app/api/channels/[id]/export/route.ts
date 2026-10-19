import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { applyRateLimit, getClientIp } from "@/lib/rateLimit";
import { buildChannelBundle } from "@/lib/channelBundle";
import { isRecord } from "@/lib/typeGuards";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "_")
    .replace(/^-+|-+$/g, "") || "channel";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getApiTranslator();
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`export_channel_${session.user.id}_${ip}`, 20, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const channel = await prisma.profileChannel.findUnique({
      where: { id },
      include: {
        products: {
          orderBy: { createdAt: "asc" },
        },
        usedTitles: {
          orderBy: { createdAt: "desc" },
        },
        contentArchetype: {
          select: { name: true, narrationMode: true },
        },
      },
    });

    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: t("channelNotFound") }, { status: 404 });
    }

    // Ambil generator settings untuk channel ini dari User.generatorPreferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { generatorPreferences: true },
    });

    let channelGeneratorSettings: Record<string, unknown> | null = null;
    if (user?.generatorPreferences && isRecord(user.generatorPreferences)) {
      const prefs = user.generatorPreferences;
      if (isRecord(prefs.channelFormStates) && isRecord(prefs.channelFormStates[id])) {
        channelGeneratorSettings = prefs.channelFormStates[id] as Record<string, unknown>;
      } else if (isRecord(prefs.generatorFormState) && prefs.generatorFormState.channelId === id) {
        channelGeneratorSettings = prefs.generatorFormState as Record<string, unknown>;
      }
    }

    const bundle = buildChannelBundle({
      channel: {
        channelName: channel.channelName,
        niche: channel.niche,
        description: channel.description,
        targetPlatform: channel.targetPlatform,
        personaPov: channel.personaPov,
        speechRate: channel.speechRate,
        visualAesthetic: channel.visualAesthetic,
        cta1: channel.cta1,
        cta2: channel.cta2,
        audioBGM: channel.audioBGM,
        audioSFX: channel.audioSFX,
        audioVO: channel.audioVO,
        socialLinks: channel.socialLinks,
        contentArchetype: channel.contentArchetype,
      },
      products: channel.products.map((p) => ({
        name: p.name,
        description: p.description,
        price: p.price,
        link: p.link,
      })),
      usedTitles: channel.usedTitles.map((u) => ({
        title: u.title,
        type: u.type,
      })),
      generatorSettings: channelGeneratorSettings,
      exportedAt: new Date().toISOString(),
    });

    const filename = `${slugify(channel.channelName)}_channel_bundle.json`;

    return new NextResponse(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Gagal export channel bundle:", err);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
