import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import { notifyAllSuperadmins } from "@/lib/notifications";

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

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`upload_invoice_${session.user.id}_${ip}`, 5, 60 * 15); // 5 uploads per 15 mins
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyUploads") }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = uploadSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { invoiceId, proofBase64 } = parsedData.data;

    // Validate overall string size (max 2.8MB base64 string ~ 2MB binary)
    if (proofBase64.length > 2800000) {
      return NextResponse.json({ error: t("fileTooLarge") }, { status: 400 });
    }

    // Must have data URI scheme
    if (!proofBase64.startsWith("data:image/jpeg;base64,") && !proofBase64.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: t("invalidImageFormat") }, { status: 400 });
    }

    const base64Data = proofBase64.split(",")[1];
    if (!base64Data) {
      return NextResponse.json({ error: t("invalidImageFormat") }, { status: 400 });
    }

    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length < 8 || buffer.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: buffer.length > 2 * 1024 * 1024 ? t("fileTooLarge") : t("invalidImageFormat") }, { status: 400 });
    }

    // P0-10: Strict magic byte verification server-side
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    if (!isJpeg && !isPng) {
      return NextResponse.json({ error: t("invalidImageFormat") }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice || invoice.status !== "PENDING") {
      return NextResponse.json({ error: t("invalidInvoice") }, { status: 400 });
    }

    if (invoice.userId !== session.user.id && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { 
        proofUrl: proofBase64,
        proofUploadedAt: new Date()
      }
    });

    await notifyAllSuperadmins(
      "NEW_PENDING_PAYMENT",
      "newPendingPaymentTitle",
      "newPendingPaymentMsg",
      "/admin/payments",
      { amount: invoice.amount ? invoice.amount.toLocaleString("id-ID") : 0 }
    );

    return NextResponse.json({ success: true, invoice: updated }, { status: 200 });
  } catch (error) {
    console.error("Upload Proof API error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
