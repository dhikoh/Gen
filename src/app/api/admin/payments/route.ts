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
      await prisma.invoice.updateMany({
        where: { id: invoiceId, status: "PENDING" },
        data: { 
          status: "REJECTED",
          reviewedById: session.user.id,
          reviewedAt: new Date()
        }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "APPROVE") {
      const { activateSubscription } = await import("@/lib/payments/manualTransferProvider");
      await activateSubscription(invoiceId, session.user.id);
      
      const { enforceChannelLimits } = await import("@/lib/channelLockLogic");
      await enforceChannelLimits(invoice.userId);

      return NextResponse.json({ success: true }, { status: 200 });
    }

  } catch (error) {
    console.error("Admin Payments API error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
