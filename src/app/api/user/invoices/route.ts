import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "PAID", "FAILED"] as const;
type ValidStatus = typeof VALID_STATUSES[number];

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
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
      include: {
        plan: { select: { name: true } }
      }
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("User Invoices GET API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
