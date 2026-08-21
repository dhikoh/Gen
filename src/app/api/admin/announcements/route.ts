import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import { NotificationType, PlanCode } from "@prisma/client";
import { z } from "zod";
import { getApiTranslator } from "@/lib/apiI18n";
import { randomUUID } from "crypto";

const announcementSchema = z.object({
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
  link: z.string().trim().optional().or(z.literal("")),
  target: z.enum(["ALL", "PLAN", "USER"]),
  targetPlanCode: z.nativeEnum(PlanCode).optional(),
  targetUserId: z.string().optional(),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const limitRes = await applyRateLimit(ip, 10, 60);
  if (!limitRes) {
    return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = announcementSchema.parse(body);

    let recipientUserIds: string[] = [];

    if (parsed.target === "ALL") {
      const users = await prisma.user.findMany({ select: { id: true } });
      recipientUserIds = users.map((u) => u.id);
    } else if (parsed.target === "PLAN" && parsed.targetPlanCode) {
      const users = await prisma.user.findMany({
        where: { currentPlan: { code: parsed.targetPlanCode } },
        select: { id: true },
      });
      recipientUserIds = users.map((u) => u.id);
    } else if (parsed.target === "USER" && parsed.targetUserId) {
      const user = await prisma.user.findUnique({
        where: { id: parsed.targetUserId },
        select: { id: true },
      });
      if (user) recipientUserIds = [user.id];
    }

    if (recipientUserIds.length === 0) {
      return NextResponse.json({ error: t("noRecipientsFound") }, { status: 400 });
    }

    // Fix 2.10: One broadcastGroupId per POST — shared by all recipient rows
    // This lets the GET handler deduplicate: show 1 entry per broadcast, not 1 per recipient
    const broadcastGroupId = randomUUID();

    const notificationsData = recipientUserIds.map((userId) => ({
      userId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: parsed.title,
      message: parsed.message,
      link: parsed.link && parsed.link.length > 0 ? parsed.link : null,
      broadcastGroupId,
    }));

    await prisma.notification.createMany({ data: notificationsData });

    return NextResponse.json({ success: true, recipientCount: recipientUserIds.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }
    console.error("POST /api/admin/announcements error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  try {
    // Fix 2.10: Group by broadcastGroupId — take ONE representative row per broadcast.
    // Uses groupBy to get distinct broadcastGroupIds, then fetches the metadata row.
    // Notifications without a broadcastGroupId (legacy rows) are shown individually.
    const grouped = await prisma.notification.groupBy({
      by: ["broadcastGroupId", "title", "message", "link", "createdAt"],
      where: { type: NotificationType.SYSTEM_ANNOUNCEMENT },
      orderBy: { createdAt: "desc" },
      take: 50,
      _count: { userId: true },
    });

    const announcements = grouped.map((g) => ({
      broadcastGroupId: g.broadcastGroupId,
      title: g.title,
      message: g.message,
      link: g.link,
      createdAt: g.createdAt,
      recipientCount: g._count.userId,
    }));

    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error("GET /api/admin/announcements error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
