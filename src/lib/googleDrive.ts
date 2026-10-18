import { prisma } from "@/lib/db";
import { decryptSecret, encryptSecret, googleDriveAad } from "@/lib/crypto";

export interface DriveUploadInput {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink?: string;
}

/**
 * Mengambil token akses Google Drive yang valid untuk user.
 * Melakukan auto-refresh jika token mendekati kedaluwarsa (< 5 menit).
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const tokenRecord = await prisma.userGoogleDriveToken.findUnique({
    where: { userId },
  });

  if (!tokenRecord) {
    return null;
  }

  const aad = googleDriveAad(userId);

  // Jika token masih berlaku > 5 menit ke depan, kembalikan access token yang ada
  const fiveMinutesMs = 5 * 60 * 1000;
  const isExpiringSoon = tokenRecord.expiresAt.getTime() - Date.now() < fiveMinutesMs;

  if (!isExpiringSoon) {
    try {
      return decryptSecret(tokenRecord.encryptedAccess, aad);
    } catch (err) {
      console.error("[GoogleDrive] Decrypt access token error:", err);
      return null;
    }
  }

  // Jika mendekati kedaluwarsa atau sudah kedaluwarsa, lakukan refresh token
  if (!tokenRecord.encryptedRefresh) {
    try {
      // Jika tidak ada refresh token tetapi token masih belum benar-benar lewat
      if (tokenRecord.expiresAt.getTime() > Date.now()) {
        return decryptSecret(tokenRecord.encryptedAccess, aad);
      }
    } catch {
      // ignore
    }
    return null;
  }

  let refreshToken: string;
  try {
    refreshToken = decryptSecret(tokenRecord.encryptedRefresh, aad);
  } catch (err) {
    console.error("[GoogleDrive] Decrypt refresh token error:", err);
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[GoogleDrive] Google OAuth credentials not configured");
    return null;
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[GoogleDrive] Refresh token failed:", res.status, errText);
      // Jika token ditolak oleh Google (misal: user mencabut akses)
      if (res.status === 400 || res.status === 401) {
        await prisma.userGoogleDriveToken.deleteMany({ where: { userId } }).catch(() => null);
      }
      return null;
    }

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    };

    if (!data.access_token) {
      return null;
    }

    const newEncryptedAccess = encryptSecret(data.access_token, aad);
    const newEncryptedRefresh = data.refresh_token
      ? encryptSecret(data.refresh_token, aad)
      : undefined;
    const newExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

    await prisma.userGoogleDriveToken.update({
      where: { userId },
      data: {
        encryptedAccess: newEncryptedAccess,
        ...(newEncryptedRefresh ? { encryptedRefresh: newEncryptedRefresh } : {}),
        expiresAt: newExpiresAt,
      },
    });

    return data.access_token;
  } catch (error) {
    console.error("[GoogleDrive] Refresh token exception:", error);
    return null;
  }
}

/**
 * Mendapatkan atau membuat folder khusus "Prompt Gen Videos" di Google Drive user.
 * ID folder di-cache di DB untuk memangkas panggilan API berulang.
 */
export async function getOrCreateAppFolder(
  userId: string,
  accessToken: string
): Promise<string> {
  const tokenRecord = await prisma.userGoogleDriveToken.findUnique({
    where: { userId },
    select: { folderId: true },
  });

  // 1. Cek folderId di cache DB
  if (tokenRecord?.folderId) {
    try {
      const checkRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${tokenRecord.folderId}?fields=id,trashed`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (checkRes.ok) {
        const folderData = (await checkRes.json()) as { id: string; trashed?: boolean };
        if (!folderData.trashed) {
          return folderData.id;
        }
      }
    } catch {
      // Fallback ke pencarian jika gagal
    }
  }

  const folderName = "Prompt Gen Videos";

  // 2. Cari folder di Google Drive jika belum ada atau cache invalid
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (searchRes.ok) {
      const searchData = (await searchRes.json()) as { files?: Array<{ id: string; name: string }> };
      if (searchData.files && searchData.files.length > 0) {
        const foundId = searchData.files[0].id;
        await prisma.userGoogleDriveToken.update({
          where: { userId },
          data: { folderId: foundId },
        }).catch(() => null);
        return foundId;
      }
    }
  } catch (err) {
    console.warn("[GoogleDrive] Search folder failed, attempting creation:", err);
  }

  // 3. Buat folder baru jika tidak ditemukan
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Drive folder: ${errText}`);
  }

  const createdData = (await createRes.json()) as { id: string };
  await prisma.userGoogleDriveToken.update({
    where: { userId },
    data: { folderId: createdData.id },
  }).catch(() => null);

  return createdData.id;
}

/**
 * Mengunggah berkas ke Google Drive menggunakan Resumable Upload protocol.
 */
export async function uploadToDrive(
  userId: string,
  accessToken: string,
  file: DriveUploadInput
): Promise<DriveUploadResult> {
  const folderId = await getOrCreateAppFolder(userId, accessToken);

  // Langkah 1: Inisiasi Resumable Upload Session
  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": file.mimeType,
        "X-Upload-Content-Length": file.buffer.length.toString(),
      },
      body: JSON.stringify({
        name: file.filename,
        parents: [folderId],
      }),
    }
  );

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Google Drive resumable upload session failed: ${errText}`);
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("Google Drive did not return upload Location header");
  }

  // Langkah 2: Unggah byte data ke URL Resumable
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": file.buffer.length.toString(),
      "Content-Type": file.mimeType,
    },
    body: new Uint8Array(file.buffer),
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Google Drive payload upload failed: ${errText}`);
  }

  const result = (await uploadRes.json()) as {
    id: string;
    webViewLink?: string;
  };

  return {
    fileId: result.id,
    webViewLink: result.webViewLink,
  };
}

/**
 * Mencabut token Google Drive dari Google dan menghapus data kredensial dari database.
 */
export async function revokeGoogleDriveToken(userId: string): Promise<boolean> {
  const record = await prisma.userGoogleDriveToken.findUnique({
    where: { userId },
  });

  if (!record) {
    return true;
  }

  const aad = googleDriveAad(userId);
  let tokenToRevoke: string | null = null;

  try {
    if (record.encryptedRefresh) {
      tokenToRevoke = decryptSecret(record.encryptedRefresh, aad);
    } else if (record.encryptedAccess) {
      tokenToRevoke = decryptSecret(record.encryptedAccess, aad);
    }
  } catch {
    // Abaikan kegagalan dekripsi saat revokasi
  }

  if (tokenToRevoke) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    } catch (err) {
      console.warn("[GoogleDrive] Token revocation request failed:", err);
    }
  }

  await prisma.userGoogleDriveToken.deleteMany({
    where: { userId },
  });

  return true;
}
