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

/** Batas upload dalam byte. Base64 memuai ~33%, jadi batas karakter dihitung dari sini. */
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_BASE64_CHARS = Math.floor(MAX_UPLOAD_BYTES * 1.34);

const ALLOWED_MIME_TYPES = new Set([
  "video/webm",
  "video/mp4",
  "video/quicktime",
  "audio/wav",
  "audio/mpeg",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const uploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100).default("video/mp4"),
  base64Data: z.string().min(1).max(MAX_BASE64_CHARS),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();

  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES * 1.4) {
    return NextResponse.json({ error: t("driveFileTooLarge") }, { status: 413 });
  }

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
      { error: t("googleDriveLocked") },
      { status: 403 }
    );
  }

  // Cek koneksi Google Drive
  const accessToken = await getValidAccessToken(session.user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: t("googleDriveNotConnected") },
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

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json({ error: t("invalidData") }, { status: 400 });
  }

  const buffer = Buffer.from(base64Data, "base64");

  // Validasi ukuran buffer riil (maks 100 MB)
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: t("driveFileTooLarge") },
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
