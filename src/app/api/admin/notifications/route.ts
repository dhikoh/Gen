import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`admin_notifications_get_${session.user.id}_${ip}`, 60, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Admin Notifications API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
