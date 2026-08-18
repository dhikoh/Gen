import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const actionSchema = z.object({
  invoiceId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = actionSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { invoiceId, action } = parsedData.data;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { plan: true, user: true }
    });

    if (!invoice || invoice.status !== "PENDING") {
      return NextResponse.json({ error: t("invoiceInvalid") }, { status: 400 });
    }

    if (action === "REJECT") {
      const updateResult = await prisma.invoice.updateMany({
        where: { id: invoiceId, status: "PENDING" },
        data: { 
          status: "REJECTED",
          reviewedById: session.user.id,
          reviewedAt: new Date()
        }
      });
      
      if (updateResult.count === 0) {
        return NextResponse.json({ error: t("invalidInvoice") }, { status: 400 });
      }
      
      await sendEmail({
        to: invoice.user.email,
        subject: "Tagihan Ditolak - Prompt Gen",
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
            <h2>Tagihan Ditolak</h2>
            <p>Halo ${invoice.user.name},</p>
            <p>Tagihan Anda untuk paket <strong>${invoice.plan.name}</strong> dengan jumlah Rp ${invoice.amount.toLocaleString('id-ID')} telah ditolak.</p>
            <p>Silakan periksa kembali bukti pembayaran yang Anda unggah dan buat tagihan baru.</p>
          </div>
        `
      });

      return NextResponse.json({ success: true });
    }

    if (action === "APPROVE") {
      const { activateSubscription } = await import("@/lib/payments/manualTransferProvider");
      await activateSubscription(invoiceId, session.user.id);
      
      const { enforceChannelLimits } = await import("@/lib/channelLockLogic");
      await enforceChannelLimits(invoice.userId);

      await sendEmail({
        to: invoice.user.email,
        subject: "Pembayaran Berhasil - Prompt Gen",
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
            <h2>Pembayaran Berhasil</h2>
            <p>Halo ${invoice.user.name},</p>
            <p>Tagihan Anda untuk paket <strong>${invoice.plan.name}</strong> telah berhasil diverifikasi.</p>
            <p>Akun Anda kini telah aktif dan batas channel Anda telah disesuaikan.</p>
            <p>Terima kasih telah menggunakan Prompt Gen!</p>
          </div>
        `
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

  } catch (error) {
    console.error("Admin Payments API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
