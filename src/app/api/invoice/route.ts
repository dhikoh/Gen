import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";

const invoiceSchema = z.object({
  planId: z.string().min(1, "Plan ID harus diisi"),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`create_invoice_${session.user.id}_${ip}`, 5, 60 * 15); // 5 request / 15 menit
    if (!isAllowed) {
      return NextResponse.json({ error: t("invoiceRateLimit") }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = invoiceSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { planId } = parsedData.data;

    // Pastikan plan valid dan aktif
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: t("planNotAvailable") }, { status: 400 });
    }

    // Pastikan user tidak memiliki invoice PENDING untuk paket ini
    const existingPending = await prisma.invoice.findFirst({
      where: { 
        userId: session.user.id,
        planId: planId,
        status: "PENDING"
      }
    });

    if (existingPending) {
      return NextResponse.json({ error: t("pendingInvoiceExists") }, { status: 400 });
    }

    // Buat invoice baru via Provider
    const { ManualTransferProvider } = await import("@/lib/payments/manualTransferProvider");
    const provider = new ManualTransferProvider();
    const { invoiceId } = await provider.createInvoice({
      userId: session.user.id, 
      planId, 
      amount: plan.priceMonthly
    });

    return NextResponse.json({ success: true, invoiceId }, { status: 200 });

  } catch (error) {
    console.error("Create Invoice API error:", error);
    return NextResponse.json({ error: t("invoiceError") }, { status: 500 });
  }
}
