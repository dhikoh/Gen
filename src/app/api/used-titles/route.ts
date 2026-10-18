import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const querySchema = z.object({
  channelId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`used_titles_get_${session.user.id}_${ip}`, 60, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const channelIdParam = req.nextUrl.searchParams.get("channelId");
    const parsed = querySchema.safeParse({ channelId: channelIdParam });
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }

    // Ownership check: pastikan channel milik user (atau user SUPERADMIN)
    if (session.user.role !== "SUPERADMIN") {
      const channel = await prisma.profileChannel.findFirst({
        where: { id: parsed.data.channelId, userId: session.user.id },
        select: { id: true },
      });
      if (!channel) {
        return NextResponse.json({ error: t("notFound") }, { status: 404 });
      }
    }

    const titles = await prisma.usedTitle.findMany({
      where: { channelId: parsed.data.channelId },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json(titles);
  } catch (error) {
    console.error("GET /api/used-titles error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
