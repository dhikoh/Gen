import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { applyRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`user_data_export_${session.user.id}_${ip}`, 3, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const userId = session.user.id;

    const [user, channels, drafts, invoices, usedTitles, supportTickets] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          ...SAFE_USER_SELECT,
          registrationStatus: true,
          hasUsedTrial: true,
          preferredLocale: true,
        },
      }),
      prisma.profileChannel.findMany({
        where: { userId },
        include: { products: true },
      }),
      prisma.draft.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.findMany({
        where: { userId },
        select: {
          id: true,
          amount: true,
          currency: true,
          method: true,
          status: true,
          periodDays: true,
          createdAt: true,
          reviewedAt: true,
          plan: {
            select: { name: true, code: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.usedTitle.findMany({
        where: { userId },
        select: { channelId: true, type: true, title: true, createdAt: true },
      }),
      prisma.supportTicket.findMany({
        where: { userId },
        include: { messages: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const exportBundle = {
      exportedAt: new Date().toISOString(),
      user,
      channels,
      drafts,
      invoices,
      usedTitles,
      supportTickets,
    };

    const filename = `promptgen-export-${user?.username || userId}-${Date.now()}.json`;

    return new Response(JSON.stringify(exportBundle, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET user/data-export error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
