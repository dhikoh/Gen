import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const actionSchema = z.object({
  invoiceId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = actionSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { invoiceId, action } = parsedData.data;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { plan: true }
    });

    if (!invoice || invoice.status !== "PENDING") {
      return NextResponse.json({ error: "Tagihan tidak valid atau sudah diproses." }, { status: 400 });
    }

    if (action === "REJECT") {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "REJECTED" }
      });
      return NextResponse.json({ success: true });
    }

    // APPROVE logic
    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: "PAID" }
      });

      // Update user subscription
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + invoice.periodDays);

      await tx.user.update({
        where: { id: invoice.userId },
        data: {
          subscriptionStatus: "ACTIVE",
          currentPlanId: invoice.planId,
          subscriptionExpiresAt: expiresAt
        }
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Admin Payments API error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
