import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import { getApiTranslator } from "@/lib/apiI18n";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const isAllowed = await applyRateLimit(`admin_proof_view_${session.user.id}_${ip}`, 60, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: t("invalidId") }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { proofUrl: true }
    });

    if (!invoice || !invoice.proofUrl) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    let mimeType = "image/png";
    let base64Data = invoice.proofUrl;

    const dataUriMatch = invoice.proofUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUriMatch) {
      mimeType = dataUriMatch[1];
      base64Data = dataUriMatch[2];
    }

    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length < 8) {
      return NextResponse.json({ error: t("invalidImageFormat") }, { status: 400 });
    }

    // Double check magic bytes for security
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

    if (isJpeg) {
      mimeType = "image/jpeg";
    } else if (isPng) {
      mimeType = "image/png";
    } else {
      return NextResponse.json({ error: t("invalidImageFormat") }, { status: 400 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
        "Cache-Control": "private, no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    console.error("Admin Payment Proof GET error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
