import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";
import { hasFeature } from "@/lib/planFeatures";
import { requireActiveSubscription } from "@/lib/subscription";
import { getValidAccessToken, uploadToDrive } from "@/lib/googleDrive";
import { logAdminAction } from "@/lib/auditLog";
import { getApiTranslator } from "@/lib/apiI18n";

const uploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100).default("video/mp4"),
  base64Data: z.string().min(1).max(140 * 1024 * 1024), // Max ~100MB file as base64
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  // Rate limit: 5 uploads per 60 seconds per user
  const allowed = await applyRateLimit(`gdrive_upload_${session.user.id}`, 5, 60);
  if (!allowed) {
    return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
  }

  // Cek langganan aktif
  try {
    await requireActiveSubscription(session.user.id);
  } catch {
    return NextResponse.json({ error: t("inactiveSub") }, { status: 403 });
  }

  // Cek fitur plan: googleDriveUpload (superadmin bypass)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, currentPlan: { select: { features: true } } },
  });
  if (!dbUser) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const isSuperadmin = dbUser.role === "SUPERADMIN";
  const rawFeatures = (dbUser.currentPlan?.features as Record<string, boolean>) ?? {};
  if (!hasFeature(rawFeatures, "googleDriveUpload", isSuperadmin)) {
    return NextResponse.json(
      { error: "Fitur Google Drive Backup tidak tersedia pada paket Anda." },
      { status: 403 }
    );
  }

  // Cek koneksi Google Drive
  const accessToken = await getValidAccessToken(session.user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Google Drive belum terhubung atau sesi telah kedaluwarsa. Silakan hubungkan kembali." },
      { status: 400 }
    );
  }

  // Parse body
  const body = await req.json().catch(() => null);
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || t("invalidData") },
      { status: 400 }
    );
  }

  const { filename, mimeType, base64Data } = parsed.data;
  const buffer = Buffer.from(base64Data, "base64");

  // Validasi ukuran buffer riil (maks 100 MB)
  if (buffer.length > 100 * 1024 * 1024) {
    return NextResponse.json(
      { error: t("fileTooLarge") },
      { status: 413 }
    );
  }

  try {
    const result = await uploadToDrive(session.user.id, accessToken, {
      filename,
      mimeType,
      buffer,
    });

    await logAdminAction({
      actorId: session.user.id,
      action: "GOOGLE_DRIVE_UPLOAD_SUCCESS",
      targetType: "GoogleDriveFile",
      targetId: result.fileId,
      metadata: { filename, bytes: buffer.length },
    });

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      webViewLink: result.webViewLink,
    });
  } catch (error) {
    console.error("[GoogleDrive Upload Route] Upload failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : t("systemError") },
      { status: 500 }
    );
  }
}
