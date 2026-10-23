import { prisma } from "@/lib/db";
import { decryptSecret, encryptSecret, channelConnectionAad } from "@/lib/crypto";

export interface ChannelGoogleStatus {
  connected: boolean;
  email?: string | null;
  driveFolderId?: string | null;
  driveFolderName?: string | null;
  youtubeChannelId?: string | null;
  youtubeChannelTitle?: string | null;
}

export interface ChannelMetaStatus {
  connected: boolean;
  fbPageId?: string | null;
  fbPageName?: string | null;
  igUserId?: string | null;
  igUsername?: string | null;
}

export interface ChannelConnectionsSummary {
  channelId: string;
  channelName: string;
  google: ChannelGoogleStatus;
  meta: ChannelMetaStatus;
}

/**
 * Mengambil token akses Google yang valid khusus untuk suatu ProfileChannel.
 * Melakukan auto-refresh jika token mendekati kedaluwarsa (< 5 menit).
 */
export async function getValidChannelGoogleAccessToken(channelId: string): Promise<string | null> {
  const conn = await prisma.channelSocialConnection.findUnique({
    where: { channelId },
  });

  if (!conn || !conn.encryptedGoogleAccess) {
    return null;
  }

  const aad = channelConnectionAad(channelId, "google");
  const fiveMinutesMs = 5 * 60 * 1000;
  const isExpiringSoon = conn.googleExpiresAt
    ? conn.googleExpiresAt.getTime() - Date.now() < fiveMinutesMs
    : true;

  if (!isExpiringSoon) {
    try {
      return decryptSecret(conn.encryptedGoogleAccess, aad);
    } catch (err) {
      console.error(`[ChannelSocial] Decrypt Google access token error for channel ${channelId}:`, err);
      return null;
    }
  }

  if (!conn.encryptedGoogleRefresh) {
    if (conn.googleExpiresAt && conn.googleExpiresAt.getTime() > Date.now()) {
      try {
        return decryptSecret(conn.encryptedGoogleAccess, aad);
      } catch {
        return null;
      }
    }
    return null;
  }

  let refreshToken: string;
  try {
    refreshToken = decryptSecret(conn.encryptedGoogleRefresh, aad);
  } catch (err) {
    console.error(`[ChannelSocial] Decrypt Google refresh token error for channel ${channelId}:`, err);
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("[ChannelSocial] Google OAuth credentials not configured in environment");
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
      console.error(`[ChannelSocial] Google refresh failed (${res.status}) for channel ${channelId}:`, errText);
      if (res.status === 400 || res.status === 401) {
        // Token dicabut di sisi Google
        await prisma.channelSocialConnection.update({
          where: { channelId },
          data: {
            encryptedGoogleAccess: null,
            encryptedGoogleRefresh: null,
            googleExpiresAt: null,
          },
        }).catch(() => null);
      }
      return null;
    }

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    };

    if (!data.access_token) return null;

    const newEncryptedAccess = encryptSecret(data.access_token, aad);
    const newEncryptedRefresh = data.refresh_token ? encryptSecret(data.refresh_token, aad) : undefined;
    const newExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

    await prisma.channelSocialConnection.update({
      where: { channelId },
      data: {
        encryptedGoogleAccess: newEncryptedAccess,
        ...(newEncryptedRefresh ? { encryptedGoogleRefresh: newEncryptedRefresh } : {}),
        googleExpiresAt: newExpiresAt,
      },
    });

    return data.access_token;
  } catch (error) {
    console.error(`[ChannelSocial] Google refresh exception for channel ${channelId}:`, error);
    return null;
  }
}

/**
 * Mendapatkan atau membuat folder khusus untuk channel di Google Drive user.
 * Contoh: "Prompt Gen - [Nama Channel]"
 */
export async function getOrCreateChannelDriveFolder(
  channelId: string,
  channelName: string
): Promise<string | null> {
  const conn = await prisma.channelSocialConnection.findUnique({
    where: { channelId },
  });

  const accessToken = await getValidChannelGoogleAccessToken(channelId);
  if (!accessToken) return null;

  const targetFolderName = `Prompt Gen - ${channelName.trim() || "Channel"}`;

  // Jika folderId sudah tersimpan, verifikasi keberadaannya di Drive
  if (conn?.googleDriveFolderId) {
    try {
      const checkRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${conn.googleDriveFolderId}?fields=id,name,trashed`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (checkRes.ok) {
        const fileInfo = (await checkRes.json()) as { id?: string; trashed?: boolean };
        if (fileInfo.id && !fileInfo.trashed) {
          return fileInfo.id;
        }
      }
    } catch {
      // Abaikan dan lanjutkan ke pencarian/pembuatan
    }
  }

  // Cari folder dengan nama targetFolderName di root Drive yang belum dihapus
  try {
    const query = `name = '${targetFolderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (searchRes.ok) {
      const searchData = (await searchRes.json()) as { files?: Array<{ id: string; name: string }> };
      if (searchData.files && searchData.files.length > 0) {
        const existingId = searchData.files[0].id;
        await prisma.channelSocialConnection.update({
          where: { channelId },
          data: {
            googleDriveFolderId: existingId,
            googleDriveFolderName: targetFolderName,
          },
        });
        return existingId;
      }
    }

    // Jika belum ada, buat folder baru
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: targetFolderName,
        mimeType: "application/vnd.google-apps.folder",
      }),
    });

    if (!createRes.ok) {
      console.error(`[ChannelSocial] Failed to create folder for channel ${channelId}:`, await createRes.text());
      return null;
    }

    const createdData = (await createRes.json()) as { id?: string };
    if (createdData.id) {
      await prisma.channelSocialConnection.update({
        where: { channelId },
        data: {
          googleDriveFolderId: createdData.id,
          googleDriveFolderName: targetFolderName,
        },
      });
      return createdData.id;
    }
    return null;
  } catch (err) {
    console.error(`[ChannelSocial] Exception creating Drive folder for channel ${channelId}:`, err);
    return null;
  }
}

/**
 * Mengambil ringkasan status koneksi untuk suatu channel.
 */
export async function getChannelConnectionSummary(
  channelId: string,
  userId: string
): Promise<ChannelConnectionsSummary | null> {
  const channel = await prisma.profileChannel.findFirst({
    where: { id: channelId, userId },
    include: { socialConnection: true },
  });

  if (!channel) return null;

  const sc = channel.socialConnection;
  const isGoogleConnected = Boolean(sc?.encryptedGoogleAccess);
  const isMetaConnected = Boolean(sc?.encryptedMetaToken);

  return {
    channelId: channel.id,
    channelName: channel.channelName,
    google: {
      connected: isGoogleConnected,
      email: sc?.googleEmail || null,
      driveFolderId: sc?.googleDriveFolderId || null,
      driveFolderName: sc?.googleDriveFolderName || null,
      youtubeChannelId: sc?.youtubeChannelId || null,
      youtubeChannelTitle: sc?.youtubeChannelTitle || null,
    },
    meta: {
      connected: isMetaConnected,
      fbPageId: sc?.fbPageId || null,
      fbPageName: sc?.fbPageName || null,
      igUserId: sc?.igUserId || null,
      igUsername: sc?.igUsername || null,
    },
  };
}

/**
 * Memutuskan koneksi Google dari channel.
 */
export async function disconnectChannelGoogle(
  channelId: string,
  userId: string
): Promise<boolean> {
  const channel = await prisma.profileChannel.findFirst({
    where: { id: channelId, userId },
    include: { socialConnection: true },
  });

  if (!channel || !channel.socialConnection) return false;

  await prisma.channelSocialConnection.update({
    where: { channelId },
    data: {
      googleEmail: null,
      encryptedGoogleAccess: null,
      encryptedGoogleRefresh: null,
      googleExpiresAt: null,
      googleDriveFolderId: null,
      googleDriveFolderName: null,
      youtubeChannelId: null,
      youtubeChannelTitle: null,
    },
  });

  return true;
}

/**
 * Memutuskan koneksi Meta dari channel.
 */
export async function disconnectChannelMeta(
  channelId: string,
  userId: string
): Promise<boolean> {
  const channel = await prisma.profileChannel.findFirst({
    where: { id: channelId, userId },
    include: { socialConnection: true },
  });

  if (!channel || !channel.socialConnection) return false;

  await prisma.channelSocialConnection.update({
    where: { channelId },
    data: {
      encryptedMetaToken: null,
      metaExpiresAt: null,
      metaScopes: null,
      fbPageId: null,
      fbPageName: null,
      igUserId: null,
      igUsername: null,
    },
  });

  return true;
}
