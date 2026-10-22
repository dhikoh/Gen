import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";
import { hasFeature } from "@/lib/planFeatures";
import { requireActiveSubscription } from "@/lib/subscription";
import {
  getValidAccessToken,
  ensureProjectFolderHierarchy,
  uploadToSpecificFolder,
} from "@/lib/googleDrive";
import { logAdminAction } from "@/lib/auditLog";
import { getApiTranslator } from "@/lib/apiI18n";

/** Batas upload total payload dalam byte. Base64 memuai ~33%. */
const MAX_FILE_BYTES = 250 * 1024 * 1024; // 250 MB per file video
const MAX_BASE64_CHARS = Math.floor(MAX_FILE_BYTES * 1.34);

const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/html",
  "text/csv",
  "application/json",
  "video/webm",
  "video/mp4",
  "video/quicktime",
  "audio/wav",
  "audio/mpeg",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const packageSchema = z.object({
  channelName: z.string().min(1).max(120),
  projectFolderName: z.string().min(1).max(120),
  segmentFolderName: z.string().max(120).optional().nullable(),
  files: z
    .array(
      z.object({
        filename: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(100),
        base64Data: z.string().min(1).max(MAX_BASE64_CHARS),
      })
    )
    .min(1)
    .max(20),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  // Rate limit: 10 package uploads per 60 seconds per user
  const allowed = await applyRateLimit(`gdrive_pkg_${session.user.id}`, 10, 60);
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
  const parsed = packageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || t("invalidData") },
      { status: 400 }
    );
  }

  const { channelName, projectFolderName, segmentFolderName, files } = parsed.data;

  // Validasi tipe mime
  for (const f of files) {
    if (!ALLOWED_MIME_TYPES.has(f.mimeType)) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung: ${f.filename} (${f.mimeType})` },
        { status: 400 }
      );
    }
  }

  try {
    // 1. Pastikan struktur folder idempoten (Root -> Channel -> Project [-> Segment])
    const hierarchy = await ensureProjectFolderHierarchy(
      session.user.id,
      accessToken,
      channelName,
      projectFolderName,
      segmentFolderName || undefined
    );

    const uploadedFiles: Array<{ filename: string; fileId: string; webViewLink?: string }> = [];

    // 2. Unggah file satu per satu ke target folder
    for (const f of files) {
      const buffer = Buffer.from(f.base64Data, "base64");
      const uploadRes = await uploadToSpecificFolder(
        session.user.id,
        accessToken,
        {
          filename: f.filename,
          mimeType: f.mimeType,
          buffer,
        },
        hierarchy.targetFolderId
      );

      uploadedFiles.push({
        filename: f.filename,
        fileId: uploadRes.fileId,
        webViewLink: uploadRes.webViewLink,
      });
    }

    // 3. Catat audit log
    await logAdminAction({
      actorId: session.user.id,
      action: "GOOGLE_DRIVE_PACKAGE_UPLOAD_SUCCESS",
      targetType: "GoogleDriveFolder",
      targetId: hierarchy.targetFolderId,
      metadata: {
        channelName,
        projectFolderName,
        segmentFolderName: segmentFolderName || null,
        fileCount: uploadedFiles.length,
      },
    });

    return NextResponse.json({
      success: true,
      targetFolderId: hierarchy.targetFolderId,
      projectFolderId: hierarchy.projectFolderId,
      folderWebViewLink: hierarchy.folderWebViewLink,
      uploadedFiles,
    });
  } catch (error) {
    console.error("[GoogleDrive Package Upload] Execution failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : t("systemError") },
      { status: 500 }
    );
  }
}
