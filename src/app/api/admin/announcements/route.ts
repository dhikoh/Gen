import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import { NotificationType, PlanCode } from "@prisma/client";
import { z } from "zod";
import { getApiTranslator } from "@/lib/apiI18n";
import { randomUUID } from "crypto";
import { logAdminAction } from "@/lib/auditLog";
import { escapeHtml } from "@/lib/emailTemplates";

const announcementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  link: z.string().trim().optional().or(z.literal("")),
  target: z.enum(["ALL", "PLAN", "USER", "STATUS"]),
  targetPlanCode: z.nativeEnum(PlanCode).optional(),
  targetUserId: z.string().optional(),
  targetStatus: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }
  if (session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const ip = getClientIp(req);
  const isAllowed = await applyRateLimit(`admin_announcements_post_${session.user.id}_${ip}`, 10, 60);
  if (!isAllowed) {
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
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
    } else if (parsed.target === "STATUS" && parsed.targetStatus) {
      const users = await prisma.user.findMany({
        where: { subscriptionStatus: parsed.targetStatus },
        select: { id: true },
      });
      recipientUserIds = users.map((u) => u.id);
    }

    if (recipientUserIds.length === 0) {
      return NextResponse.json({ error: t("noRecipientsFound") }, { status: 400 });
    }

    // Fix 2.10: One broadcastGroupId per POST — shared by all recipient rows
    const broadcastGroupId = randomUUID();

    // Sanitize title and message
    const sanitizedTitle = escapeHtml(parsed.title);
    const sanitizedMessage = escapeHtml(parsed.message);

    const notificationsData = recipientUserIds.map((userId) => ({
      userId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: sanitizedTitle,
      message: sanitizedMessage,
      link: parsed.link && parsed.link.length > 0 ? parsed.link : null,
      broadcastGroupId,
    }));

    await prisma.notification.createMany({ data: notificationsData });

    await logAdminAction({
      adminId: session.user.id,
      action: "BROADCAST_ANNOUNCEMENT",
      targetType: "NOTIFICATION",
      targetId: broadcastGroupId,
      metadata: {
        title: parsed.title,
        target: parsed.target,
        recipientCount: recipientUserIds.length
      }
    });

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
  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }
  if (session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const ip = getClientIp(req);
  const isAllowed = await applyRateLimit(`admin_announcements_get_${session.user.id}_${ip}`, 60, 60);
  if (!isAllowed) {
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
  }

  try {
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
