import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { Prisma, Role, SubscriptionStatus } from "@prisma/client";
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
    const isAllowed = await applyRateLimit(`admin_users_get_${session.user.id}_${ip}`, 60, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const planId = searchParams.get("planId") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));

    const whereClause: Prisma.UserWhereInput = {
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
          { emailLower: { contains: search.toLowerCase() } },
          { usernameLower: { contains: search.toLowerCase() } }
        ]
      } : {}),
      ...(role ? { role: role as Role } : {}),
      ...(status ? { subscriptionStatus: status as SubscriptionStatus } : {}),
      ...(planId ? { currentPlanId: planId } : {})
    };

    const total = await prisma.user.count({ where: whereClause });
    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        ...SAFE_USER_SELECT,
        currentPlan: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({ users, total, page, pageSize }, { status: 200 });
  } catch (error) {
    console.error("Admin Users GET API error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
