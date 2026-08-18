import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
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
          { phoneNumber: { contains: search, mode: 'insensitive' } }
        ]
      } : {}),
      ...(role ? { role: role as any } : {}),
      ...(status ? { subscriptionStatus: status as any } : {}),
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
