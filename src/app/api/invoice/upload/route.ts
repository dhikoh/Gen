import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";

const uploadSchema = z.object({
  invoiceId: z.string().min(1),
  proofBase64: z.string().min(1),
});

export async function PUT(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`upload_invoice_${session.user.id}_${ip}`, 5, 60 * 15); // 5 uploads per 15 mins
    if (!isAllowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan upload. Coba lagi nanti." }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = uploadSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { invoiceId, proofBase64 } = parsedData.data;

    // Validate size (max 2MB ~ approx 2.8MB base64)
    if (proofBase64.length > 2800000) {
      return NextResponse.json({ error: "Ukuran file terlalu besar. Maksimal 2MB." }, { status: 400 });
    }
    
    // Exact MIME validation (only JPEG/PNG)
    if (!proofBase64.startsWith("data:image/jpeg;base64,") && !proofBase64.startsWith("data:image/png;base64,")) {
       return NextResponse.json({ error: "Hanya format gambar JPG/PNG yang diperbolehkan." }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice || invoice.userId !== session.user.id || invoice.status !== "PENDING") {
      return NextResponse.json({ error: "Tagihan tidak valid atau sudah diproses." }, { status: 400 });
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { proofUrl: proofBase64 }
    });

    return NextResponse.json({ success: true, invoice: updated }, { status: 200 });
  } catch (error) {
    console.error("Upload Proof API error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
