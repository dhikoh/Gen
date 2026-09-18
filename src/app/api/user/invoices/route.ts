import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "PAID", "FAILED"] as const;
type ValidStatus = typeof VALID_STATUSES[number];

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`user_invoices_get_${session.user.id}_${ip}`, 30, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const whereClause: Prisma.InvoiceWhereInput = { userId: session.user.id };
    if (statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)) {
      whereClause.status = statusParam as ValidStatus;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true,
        method: true,
        createdAt: true,
        reviewedAt: true,
        rejectionReason: true,
        plan: { select: { name: true } }
      }
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("User Invoices GET API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
