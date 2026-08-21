import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { getBaseEmailTemplate } from "@/lib/emailTemplates";
import { notifyUser } from "@/lib/notifications";

const actionSchema = z.object({
  invoiceId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        plan: { select: { name: true } },
        user: { select: { name: true, email: true } },
      }
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Admin Payments GET API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}

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

    const { invoiceId, action, rejectionReason } = parsedData.data;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { plan: true, user: true }
    });

    if (!invoice || invoice.status !== "PENDING") {
      return NextResponse.json({ error: t("invoiceInvalid") }, { status: 400 });
    }

    const { getTranslations } = await import("next-intl/server");
    const locale = invoice.user.preferredLocale || 'id';
    const tEmail = await getTranslations({ locale, namespace: 'Emails' });

    if (action === "REJECT") {
      const updateResult = await prisma.invoice.updateMany({
        where: { id: invoiceId, status: "PENDING" },
        data: { 
          status: "REJECTED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          rejectionReason: rejectionReason || null
        }
      });
      
      if (updateResult.count === 0) {
        return NextResponse.json({ error: t("invalidInvoice") }, { status: 400 });
      }

      await notifyUser(
        invoice.userId,
        "PAYMENT_REJECTED",
        "paymentRejectedTitle",
        "paymentRejectedMsg",
        "/dashboard/billing",
        { reason: rejectionReason || `Paket ${invoice.plan.name}` }
      );
      
      const reasonHtml = rejectionReason
        ? `<p style="color: #dc2626;"><strong>Alasan Penolakan:</strong> ${rejectionReason}</p>`
        : "";

      await sendEmail({
        to: invoice.user.email,
        subject: tEmail('rejectSubject'),
        html: getBaseEmailTemplate(`
          <h2>${tEmail('rejectSubject')}</h2>
          <p>${tEmail('rejectGreeting', { name: invoice.user.name })}</p>
          <p>${tEmail.raw('rejectBody').replace('{plan}', invoice.plan.name).replace('{amount}', invoice.amount.toLocaleString('id-ID'))}</p>
          ${reasonHtml}
          <p>${tEmail('rejectInstruction')}</p>
        `, tEmail('rejectSubject'))
      });

      return NextResponse.json({ success: true });
    }

    if (action === "APPROVE") {
      const { activateSubscription } = await import("@/lib/payments/manualTransferProvider");
      await activateSubscription(invoiceId, session.user.id);

      await sendEmail({
        to: invoice.user.email,
        subject: tEmail('approveSubject'),
        html: getBaseEmailTemplate(`
          <h2>${tEmail('approveSubject')}</h2>
          <p>${tEmail('approveGreeting', { name: invoice.user.name })}</p>
          <p>${tEmail.raw('approveBody').replace('{plan}', invoice.plan.name)}</p>
          <p>${tEmail('approveInstruction')}</p>
          <p>${tEmail('thankYou')}</p>
        `, tEmail('approveSubject'))
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

  } catch (error) {
    console.error("Admin Payments API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
