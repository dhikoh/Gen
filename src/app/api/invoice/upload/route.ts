import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const uploadSchema = z.object({
  invoiceId: z.string().min(1),
  proofBase64: z.string().min(1),
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = uploadSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { invoiceId, proofBase64 } = parsedData.data;

    // Validate size (e.g. max 5MB ~ approx 6.6MB base64)
    if (proofBase64.length > 7000000) {
      return NextResponse.json({ error: "Ukuran file terlalu besar. Maksimal 5MB." }, { status: 400 });
    }
    
    // Simple MIME validation
    if (!proofBase64.startsWith("data:image/")) {
       return NextResponse.json({ error: "Hanya format gambar yang diperbolehkan." }, { status: 400 });
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
