import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import {
  getValidChannelGoogleAccessToken,
  getChannelConnectionSummary,
  disconnectChannelGoogle,
  disconnectChannelMeta,
} from "@/lib/channelSocial";
import { prisma } from "@/lib/db";
import { encryptSecret, channelConnectionAad } from "@/lib/crypto";

vi.mock("@/lib/db", () => ({
  prisma: {
    channelSocialConnection: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    profileChannel: {
      findFirst: vi.fn(),
    },
  },
}));

describe("channelSocial service", () => {
  const channelId = "chan_test_123";
  const userId = "user_test_456";
  const googleAad = channelConnectionAad(channelId, "google");

  beforeAll(() => {
    process.env.API_KEY_ENCRYPTION_SECRET = "x".repeat(40);
    process.env.GOOGLE_CLIENT_ID = "mock-google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "mock-google-client-secret";
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getValidChannelGoogleAccessToken", () => {
    it("1. Mengembalikan null jika rekaman koneksi channel tidak ditemukan", async () => {
      vi.mocked(prisma.channelSocialConnection.findUnique).mockResolvedValueOnce(null);

      const token = await getValidChannelGoogleAccessToken(channelId);
      expect(token).toBeNull();
      expect(prisma.channelSocialConnection.findUnique).toHaveBeenCalledWith({
        where: { channelId },
      });
    });

    it("2. Mengembalikan access token terdekripsi jika token masih berlaku > 5 menit", async () => {
      const plainAccess = "ya29.channel_access_token_ok";
      const encryptedAccess = encryptSecret(plainAccess, googleAad);
      const futureExpiry = new Date(Date.now() + 30 * 60 * 1000);

      vi.mocked(prisma.channelSocialConnection.findUnique).mockResolvedValueOnce({
        id: "csc_1",
        channelId,
        encryptedGoogleAccess: encryptedAccess,
        encryptedGoogleRefresh: "dummy_refresh",
        googleExpiresAt: futureExpiry,
        googleEmail: "test@channel.com",
        googleScopes: "scopes",
        googleDriveFolderId: null,
        googleDriveFolderName: null,
        youtubeChannelId: null,
        youtubeChannelTitle: null,
        encryptedMetaToken: null,
        metaExpiresAt: null,
        metaScopes: null,
        fbPageId: null,
        fbPageName: null,
        igUserId: null,
        igUsername: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const token = await getValidChannelGoogleAccessToken(channelId);
      expect(token).toBe(plainAccess);
    });

    it("3. Melakukan refresh token jika access token mendekati kedaluwarsa (< 5 menit)", async () => {
      const oldAccess = encryptSecret("ya29.old_access", googleAad);
      const plainRefresh = "1//mock_refresh_token";
      const encryptedRefresh = encryptSecret(plainRefresh, googleAad);
      const expiringSoon = new Date(Date.now() + 2 * 60 * 1000); // 2 menit lagi

      vi.mocked(prisma.channelSocialConnection.findUnique).mockResolvedValueOnce({
        id: "csc_1",
        channelId,
        encryptedGoogleAccess: oldAccess,
        encryptedGoogleRefresh: encryptedRefresh,
        googleExpiresAt: expiringSoon,
        googleEmail: "test@channel.com",
        googleScopes: "scopes",
        googleDriveFolderId: null,
        googleDriveFolderName: null,
        youtubeChannelId: null,
        youtubeChannelTitle: null,
        encryptedMetaToken: null,
        metaExpiresAt: null,
        metaScopes: null,
        fbPageId: null,
        fbPageName: null,
        igUserId: null,
        igUsername: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newAccessToken = "ya29.brand_new_token_refreshed";
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: newAccessToken,
            expires_in: 3600,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const token = await getValidChannelGoogleAccessToken(channelId);
      expect(token).toBe(newAccessToken);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://oauth2.googleapis.com/token",
        expect.any(Object)
      );
      expect(prisma.channelSocialConnection.update).toHaveBeenCalled();
    });

    it("4. Mengosongkan token jika Google mengembalikan 400 invalid_grant", async () => {
      const oldAccess = encryptSecret("ya29.old_access", googleAad);
      const encryptedRefresh = encryptSecret("1//revoked_refresh_token", googleAad);
      const expiringSoon = new Date(Date.now() - 1000);

      vi.mocked(prisma.channelSocialConnection.findUnique).mockResolvedValueOnce({
        id: "csc_1",
        channelId,
        encryptedGoogleAccess: oldAccess,
        encryptedGoogleRefresh: encryptedRefresh,
        googleExpiresAt: expiringSoon,
        googleEmail: "test@channel.com",
        googleScopes: "scopes",
        googleDriveFolderId: null,
        googleDriveFolderName: null,
        youtubeChannelId: null,
        youtubeChannelTitle: null,
        encryptedMetaToken: null,
        metaExpiresAt: null,
        metaScopes: null,
        fbPageId: null,
        fbPageName: null,
        igUserId: null,
        igUsername: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "invalid_grant" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      );

      const token = await getValidChannelGoogleAccessToken(channelId);
      expect(token).toBeNull();
      expect(prisma.channelSocialConnection.update).toHaveBeenCalledWith({
        where: { channelId },
        data: {
          encryptedGoogleAccess: null,
          encryptedGoogleRefresh: null,
          googleExpiresAt: null,
        },
      });
    });
  });

  describe("getChannelConnectionSummary", () => {
    it("5. Mengembalikan null jika channel tidak ditemukan atau bukan milik user", async () => {
      vi.mocked(prisma.profileChannel.findFirst).mockResolvedValueOnce(null);

      const summary = await getChannelConnectionSummary(channelId, userId);
      expect(summary).toBeNull();
    });

    it("6. Mengembalikan status koneksi lengkap jika channel memiliki koneksi", async () => {
      vi.mocked(prisma.profileChannel.findFirst).mockResolvedValueOnce({
        id: channelId,
        channelName: "Misteri Malam",
        userId,
        socialConnection: {
          id: "csc_1",
          channelId,
          googleEmail: "misteri@gmail.com",
          encryptedGoogleAccess: "enc_access",
          encryptedGoogleRefresh: "enc_refresh",
          googleExpiresAt: new Date(),
          googleDriveFolderId: "folder_123",
          googleDriveFolderName: "Prompt Gen - Misteri Malam",
          youtubeChannelId: "UC_yt_123",
          youtubeChannelTitle: "Misteri Malam Official",
          encryptedMetaToken: "enc_meta",
          metaExpiresAt: new Date(),
          fbPageId: "page_123",
          fbPageName: "Misteri Malam Fanpage",
          igUserId: "ig_123",
          igUsername: "misterimalam.id",
          googleScopes: null,
          metaScopes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as any);

      const summary = await getChannelConnectionSummary(channelId, userId);
      expect(summary).not.toBeNull();
      expect(summary?.channelName).toBe("Misteri Malam");
      expect(summary?.google.connected).toBe(true);
      expect(summary?.google.email).toBe("misteri@gmail.com");
      expect(summary?.google.driveFolderName).toBe("Prompt Gen - Misteri Malam");
      expect(summary?.google.youtubeChannelTitle).toBe("Misteri Malam Official");
      expect(summary?.meta.connected).toBe(true);
      expect(summary?.meta.fbPageName).toBe("Misteri Malam Fanpage");
      expect(summary?.meta.igUsername).toBe("misterimalam.id");
    });
  });

  describe("disconnectChannelGoogle & disconnectChannelMeta", () => {
    it("7. disconnectChannelGoogle menghapus kredensial Google pada channel", async () => {
      vi.mocked(prisma.profileChannel.findFirst).mockResolvedValueOnce({
        id: channelId,
        userId,
        socialConnection: { id: "csc_1" },
      } as any);

      const success = await disconnectChannelGoogle(channelId, userId);
      expect(success).toBe(true);
      expect(prisma.channelSocialConnection.update).toHaveBeenCalledWith({
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
    });

    it("8. disconnectChannelMeta menghapus kredensial Meta pada channel", async () => {
      vi.mocked(prisma.profileChannel.findFirst).mockResolvedValueOnce({
        id: channelId,
        userId,
        socialConnection: { id: "csc_1" },
      } as any);

      const success = await disconnectChannelMeta(channelId, userId);
      expect(success).toBe(true);
      expect(prisma.channelSocialConnection.update).toHaveBeenCalledWith({
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
    });
  });
});
