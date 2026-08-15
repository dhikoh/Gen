import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const invoiceSchema = z.object({
  planId: z.string().min(1, "Plan ID harus diisi"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = invoiceSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { planId } = parsedData.data;

    // Pastikan plan valid dan aktif
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Paket langganan tidak tersedia" }, { status: 400 });
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
      return NextResponse.json({ error: "Anda sudah memiliki tagihan pending untuk paket ini. Silakan lunasi terlebih dahulu." }, { status: 400 });
    }

    // Buat invoice baru
    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        planId: planId,
        amount: plan.priceMonthly,
        currency: plan.currency,
        method: "MANUAL_TRANSFER",
        status: "PENDING",
        periodDays: 30
      }
    });

    return NextResponse.json({ success: true, invoiceId: invoice.id }, { status: 200 });

  } catch (error) {
    console.error("Create Invoice API error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server saat membuat tagihan." }, { status: 500 });
  }
}
