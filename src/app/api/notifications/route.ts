import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getApiTranslator } from "@/lib/apiI18n";
import { z } from "zod";

const querySchema = z.object({
  unreadOnly: z.string().optional().transform((val) => val === "true"),
  page: z.string().optional().transform((val) => Math.max(1, parseInt(val || "1", 10))),
  pageSize: z.string().optional().transform((val) => Math.min(50, Math.max(1, parseInt(val || "10", 10)))),
});

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parseResult = querySchema.safeParse(Object.fromEntries(searchParams));
    
    if (!parseResult.success) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }

    const { unreadOnly, page, pageSize } = parseResult.data;

    const where: Prisma.NotificationWhereInput = { userId: session.user.id };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
