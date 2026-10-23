import { getValidChannelGoogleAccessToken } from "@/lib/channelSocial";
import type { AdaptedYouTubeMetadata } from "@/lib/publishMetadataAdapter";

export interface YouTubeUploadResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  error?: string;
}

export interface DirectUploadParams {
  channelId: string;
  metadata: AdaptedYouTubeMetadata;
  videoBuffer: Buffer;
  mimeType?: string;
}

export interface DriveUploadParams {
  channelId: string;
  metadata: AdaptedYouTubeMetadata;
  driveFileId: string;
}

/**
 * Upload video langsung dari Buffer ke YouTube Data API v3 menggunakan resumable upload.
 */
export async function uploadBufferToYouTube(params: DirectUploadParams): Promise<YouTubeUploadResult> {
  const { channelId, metadata, videoBuffer, mimeType = "video/mp4" } = params;

  const accessToken = await getValidChannelGoogleAccessToken(channelId);
  if (!accessToken) {
    return {
      success: false,
      error: "Akun Google/YouTube channel belum terhubung atau token kedaluwarsa.",
    };
  }

  try {
    // 1. Inisialisasi Resumable Upload Session
    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": String(videoBuffer.length),
        },
        body: JSON.stringify({
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            categoryId: "22", // People & Blogs
          },
          status: {
            privacyStatus: metadata.privacyStatus || "public",
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    );

    if (!initRes.ok) {
      const errText = await initRes.text();
      console.error("[YouTube Upload] Session init failed:", initRes.status, errText);
      return {
        success: false,
        error: `Inisialisasi upload YouTube gagal (${initRes.status}): ${errText}`,
      };
    }

    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) {
      return {
        success: false,
        error: "Gagal mendapatkan URL upload resumable dari YouTube.",
      };
    }

    // 2. Upload Video Binary Chunks
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(videoBuffer.length),
      },
      body: new Uint8Array(videoBuffer),
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("[YouTube Upload] Upload binary failed:", uploadRes.status, errText);
      return {
        success: false,
        error: `Pengunggahan video ke YouTube gagal (${uploadRes.status}): ${errText}`,
      };
    }

    const videoData = (await uploadRes.json()) as { id?: string };
    if (!videoData.id) {
      return {
        success: false,
        error: "Respons upload YouTube tidak menyertakan ID video.",
      };
    }

    const videoId = videoData.id;
    const videoUrl = metadata.isShorts
      ? `https://youtube.com/shorts/${videoId}`
      : `https://www.youtube.com/watch?v=${videoId}`;

    return {
      success: true,
      videoId,
      videoUrl,
    };
  } catch (err) {
    console.error("[YouTube Upload] Unexpected exception:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Terjadi kesalahan jaringan saat upload ke YouTube: ${msg}`,
    };
  }
}

/**
 * Mengambil video dari Google Drive channel dan mengalirkannya langsung ke YouTube API.
 */
export async function uploadDriveFileToYouTube(params: DriveUploadParams): Promise<YouTubeUploadResult> {
  const { channelId, metadata, driveFileId } = params;

  const accessToken = await getValidChannelGoogleAccessToken(channelId);
  if (!accessToken) {
    return {
      success: false,
      error: "Akun Google/YouTube channel belum terhubung atau token kedaluwarsa.",
    };
  }

  try {
    // 1. Unduh file dari Google Drive sebagai Buffer / Stream
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!driveRes.ok) {
      const errText = await driveRes.text();
      console.error("[YouTube Upload] Fetch from Drive failed:", driveRes.status, errText);
      return {
        success: false,
        error: `Gagal membaca video dari Google Drive (${driveRes.status}): ${errText}`,
      };
    }

    const arrayBuffer = await driveRes.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);
    const mimeType = driveRes.headers.get("content-type") || "video/mp4";

    // 2. Unggah ke YouTube
    return await uploadBufferToYouTube({
      channelId,
      metadata,
      videoBuffer,
      mimeType,
    });
  } catch (err) {
    console.error("[YouTube Upload from Drive] Exception:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Gagal transfer video dari Drive ke YouTube: ${msg}`,
    };
  }
}
