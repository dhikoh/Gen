import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { getBaseEmailTemplate, escapeHtml } from "@/lib/emailTemplates";
import { notifyUser } from "@/lib/notifications";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import { logAdminAction } from "@/lib/auditLog";
import { logEmailDelivery } from "@/lib/emailLog";

const actionSchema = z.object({
  invoiceId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

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
    const isAllowed = await applyRateLimit(`admin_payments_get_${session.user.id}_${ip}`, 60, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const statusParam = searchParams.get("status")?.toUpperCase();
    const skip = (page - 1) * limit;

    const validStatuses: PaymentStatus[] = ["PENDING", "APPROVED", "REJECTED", "PAID", "FAILED"];
    const where: { status?: PaymentStatus } = {};
    if (statusParam && validStatuses.includes(statusParam as PaymentStatus)) {
      where.status = statusParam as PaymentStatus;
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          proofUrl: true,
          createdAt: true,
          reviewedAt: true,
          rejectionReason: true,
          plan: { select: { name: true } },
          user: { select: { id: true, name: true, email: true } },
        }
      })
    ]);

    // Omit raw proofUrl data in list to avoid memory bloat
    const sanitizedInvoices = invoices.map(({ proofUrl, ...inv }) => ({
      ...inv,
      hasProof: Boolean(proofUrl)
    }));

    return NextResponse.json({
      invoices: sanitizedInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Admin Payments GET API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const isAllowed = await applyRateLimit(`admin_payments_post_${session.user.id}_${ip}`, 30, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
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
    const locale = invoice.user.preferredLocale || "id";
    const tEmail = await getTranslations({ locale, namespace: "Emails" });

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
      
      const escapedReason = rejectionReason ? escapeHtml(rejectionReason) : "";
      const reasonHtml = escapedReason
        ? `<p style="color: #dc2626;"><strong>Alasan Penolakan:</strong> ${escapedReason}</p>`
        : "";

      const emailHtml = getBaseEmailTemplate(`
        <h2>${tEmail('rejectSubject')}</h2>
        <p>${tEmail('rejectGreeting', { name: escapeHtml(invoice.user.name || '') })}</p>
        <p>${tEmail.raw('rejectBody').replace('{plan}', escapeHtml(invoice.plan.name)).replace('{amount}', invoice.amount.toLocaleString('id-ID'))}</p>
        ${reasonHtml}
        <p>${tEmail('rejectInstruction')}</p>
      `, tEmail('rejectSubject'));

      const emailResult = await sendEmail({
        to: invoice.user.email,
        subject: tEmail('rejectSubject'),
        html: emailHtml
      });

      await logEmailDelivery({
        recipient: invoice.user.email,
        templateName: "PAYMENT_REJECTED",
        status: emailResult.success ? "DELIVERED" : "FAILED",
        errorDetails: emailResult.error
      });

      await logAdminAction({
        adminId: session.user.id,
        action: "REJECT_PAYMENT",
        targetType: "INVOICE",
        targetId: invoiceId,
        metadata: { reason: rejectionReason, amount: invoice.amount, planName: invoice.plan.name }
      });

      return NextResponse.json({ success: true });
    }

    if (action === "APPROVE") {
      const { activateSubscription } = await import("@/lib/payments/manualTransferProvider");
      await activateSubscription(invoiceId, session.user.id);

      const emailHtml = getBaseEmailTemplate(`
        <h2>${tEmail('approveSubject')}</h2>
        <p>${tEmail('approveGreeting', { name: escapeHtml(invoice.user.name || '') })}</p>
        <p>${tEmail.raw('approveBody').replace('{plan}', escapeHtml(invoice.plan.name))}</p>
        <p>${tEmail('approveInstruction')}</p>
        <p>${tEmail('thankYou')}</p>
      `, tEmail('approveSubject'));

      const emailResult = await sendEmail({
        to: invoice.user.email,
        subject: tEmail('approveSubject'),
        html: emailHtml
      });

      await logEmailDelivery({
        recipient: invoice.user.email,
        templateName: "PAYMENT_APPROVED",
        status: emailResult.success ? "DELIVERED" : "FAILED",
        errorDetails: emailResult.error
      });

      await logAdminAction({
        adminId: session.user.id,
        action: "APPROVE_PAYMENT",
        targetType: "INVOICE",
        targetId: invoiceId,
        metadata: { amount: invoice.amount, planName: invoice.plan.name }
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: t("invalidAction") }, { status: 400 });
  } catch (error) {
    console.error("Admin Payments API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
