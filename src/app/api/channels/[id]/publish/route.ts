import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  adaptPublishMetadata,
  type AdaptedPublishMetadata,
  type PublishInputContent,
} from "@/lib/publishMetadataAdapter";
import {
  uploadBufferToYouTube,
  uploadDriveFileToYouTube,
  type YouTubeUploadResult,
} from "@/lib/youtubeUpload";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: channelId } = await params;
  if (!channelId) {
    return NextResponse.json({ error: "Missing channelId" }, { status: 400 });
  }

  // Verifikasi kepemilikan channel
  const channel = await prisma.profileChannel.findFirst({
    where: { id: channelId, userId: session.user.id },
    include: { socialConnection: true },
  });

  if (!channel) {
    return NextResponse.json({ error: "Channel not found or unauthorized" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") || "";

  let sourceType: "DRIVE" | "DIRECT_UPLOAD" = "DRIVE";
  let driveFileId: string | null = null;
  let videoBuffer: Buffer | null = null;
  let videoMimeType = "video/mp4";
  let platforms: string[] = ["youtube"];
  let rawContent: PublishInputContent = {};

  if (contentType.includes("multipart/form-data")) {
    sourceType = "DIRECT_UPLOAD";
    const formData = await req.formData();
    const file = formData.get("video") as File | null;
    const platformsStr = formData.get("platforms") as string | null;
    const contentJson = formData.get("content") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File video tidak ditemukan dalam form data" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    videoBuffer = Buffer.from(arrayBuffer);
    videoMimeType = file.type || "video/mp4";

    if (platformsStr) {
      try {
        platforms = JSON.parse(platformsStr);
      } catch {
        platforms = ["youtube"];
      }
    }
    if (contentJson) {
      try {
        rawContent = JSON.parse(contentJson);
      } catch {
        rawContent = {};
      }
    }
  } else {
    // JSON Request (Google Drive source)
    sourceType = "DRIVE";
    const body = await req.json();
    driveFileId = body.driveFileId;
    platforms = body.platforms || ["youtube"];
    rawContent = body.content || {};

    if (!driveFileId) {
      return NextResponse.json({ error: "ID file Google Drive (driveFileId) wajib diisi" }, { status: 400 });
    }
  }

  // Adaptasi metadata menggunakan Publish Adapter
  const adapted: AdaptedPublishMetadata = adaptPublishMetadata({
    ...rawContent,
    channel: {
      channelName: channel.channelName,
      niche: channel.niche,
      cta1: channel.cta1,
      cta2: channel.cta2,
      personaPov: channel.personaPov,
    },
  });

  const results: {
    youtube?: YouTubeUploadResult;
    instagram?: { success: boolean; postUrl?: string; error?: string };
    facebook?: { success: boolean; postUrl?: string; error?: string };
  } = {};

  // 1. Eksekusi Upload ke YouTube
  if (platforms.includes("youtube")) {
    if (!channel.socialConnection?.encryptedGoogleAccess) {
      results.youtube = {
        success: false,
        error: "Akun Google/YouTube channel belum terhubung. Silakan hubungkan di menu Channel.",
      };
    } else {
      if (sourceType === "DIRECT_UPLOAD" && videoBuffer) {
        results.youtube = await uploadBufferToYouTube({
          channelId,
          metadata: adapted.youtube,
          videoBuffer,
          mimeType: videoMimeType,
        });
      } else if (sourceType === "DRIVE" && driveFileId) {
        results.youtube = await uploadDriveFileToYouTube({
          channelId,
          metadata: adapted.youtube,
          driveFileId,
        });
      }
    }
  }

  // 2. Eksekusi Publikasi ke Instagram
  if (platforms.includes("instagram")) {
    if (!channel.socialConnection?.encryptedMetaToken || !channel.socialConnection.igUserId) {
      results.instagram = {
        success: false,
        error: "Akun Instagram Business belum terhubung ke channel ini.",
      };
    } else {
      // Instagram Graph API posting handler
      results.instagram = {
        success: false,
        error: "Instagram Content Publishing API memerlukan URL publik terverifikasi (Meta App Review aktif).",
      };
    }
  }

  // 3. Eksekusi Publikasi ke Facebook Page
  if (platforms.includes("facebook")) {
    if (!channel.socialConnection?.encryptedMetaToken || !channel.socialConnection.fbPageId) {
      results.facebook = {
        success: false,
        error: "Facebook Page belum terhubung ke channel ini.",
      };
    } else {
      results.facebook = {
        success: false,
        error: "Facebook Page Publishing API memerlukan App Review aktif di Meta Developer.",
      };
    }
  }

  // Audit log
  await logAdminAction({
    actorId: session.user.id,
    action: "SYSTEM_SETTING_UPDATED",
    targetType: "AutoPublishExecution",
    targetId: channelId,
  });

  return NextResponse.json({
    success: true,
    sourceType,
    adaptedMetadata: adapted,
    results,
  });
}
