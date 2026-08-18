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

    const { getTranslations } = await import("next-intl/server");
    const locale = 'id'; // Or add a field to User model later if needed
    const tEmail = await getTranslations({ locale, namespace: 'Emails' });

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
        subject: tEmail('rejectSubject'),
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
            <h2>${tEmail('rejectSubject')}</h2>
            <p>${tEmail('rejectGreeting', { name: invoice.user.name })}</p>
            <p>${tEmail.raw('rejectBody').replace('{plan}', invoice.plan.name).replace('{amount}', invoice.amount.toLocaleString('id-ID'))}</p>
            <p>${tEmail('rejectInstruction')}</p>
          </div>
        `
      });

      return NextResponse.json({ success: true });
    }

    if (action === "APPROVE") {
      const { activateSubscription } = await import("@/lib/payments/manualTransferProvider");
      await activateSubscription(invoiceId, session.user.id);

      await sendEmail({
        to: invoice.user.email,
        subject: tEmail('approveSubject'),
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
            <h2>${tEmail('approveSubject')}</h2>
            <p>${tEmail('approveGreeting', { name: invoice.user.name })}</p>
            <p>${tEmail.raw('approveBody').replace('{plan}', invoice.plan.name)}</p>
            <p>${tEmail('approveInstruction')}</p>
            <p>${tEmail('thankYou')}</p>
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
