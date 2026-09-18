import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { applyRateLimit, getClientIp } from "@/lib/rateLimit";
import { Prisma } from "@prisma/client";

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
    const isAllowed = await applyRateLimit(`admin_audit_logs_${session.user.id}_${ip}`, 60, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const action = searchParams.get("action")?.trim();
    const targetType = searchParams.get("targetType")?.trim();

    const where: Prisma.AdminAuditLogWhereInput = {};
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (targetType) where.targetType = { contains: targetType, mode: "insensitive" };

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/audit-logs error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
