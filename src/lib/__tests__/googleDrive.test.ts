import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import {
  getValidAccessToken,
  getOrCreateAppFolder,
  uploadToDrive,
  uploadToSpecificFolder,
  revokeGoogleDriveToken,
} from "@/lib/googleDrive";
import { prisma } from "@/lib/db";
import { encryptSecret, googleDriveAad } from "@/lib/crypto";
import type { UserGoogleDriveToken } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    userGoogleDriveToken: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));

describe("googleDrive service", () => {
  const userId = "usr_drive_test_123";
  const aad = googleDriveAad(userId);

  function createMockToken(overrides: Partial<UserGoogleDriveToken> = {}): UserGoogleDriveToken {
    return {
      id: "tok_1",
      userId,
      encryptedAccess: "enc_access",
      encryptedRefresh: "enc_refresh",
      expiresAt: new Date(Date.now() + 3600 * 1000),
      scopes: "https://www.googleapis.com/auth/drive.file",
      folderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeAll(() => {
    process.env.API_KEY_ENCRYPTION_SECRET = "x".repeat(40);
    process.env.GOOGLE_CLIENT_ID = "mock-google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "mock-google-client-secret";
    process.env.GOOGLE_DRIVE_REDIRECT_URI = "http://localhost:3000/api/auth/google-drive/callback";
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.userGoogleDriveToken.update).mockResolvedValue(createMockToken());
    vi.mocked(prisma.userGoogleDriveToken.deleteMany).mockResolvedValue({ count: 1 });
  });

  describe("getValidAccessToken", () => {
    it("1. Mengembalikan null jika rekaman token tidak ditemukan di DB", async () => {
      vi.mocked(prisma.userGoogleDriveToken.findUnique).mockResolvedValueOnce(null);

      const token = await getValidAccessToken(userId);
      expect(token).toBeNull();
      expect(prisma.userGoogleDriveToken.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it("2. Mengembalikan access token yang didekripsi jika token masih berlaku > 5 menit", async () => {
      const plainAccess = "ya29.valid_access_token_abc";
      const encryptedAccess = encryptSecret(plainAccess, aad);
      const encryptedRefresh = encryptSecret("1//refresh_token_xyz", aad);
      const futureExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 menit ke depan

      vi.mocked(prisma.userGoogleDriveToken.findUnique).mockResolvedValueOnce(
        createMockToken({
          encryptedAccess,
          encryptedRefresh,
          expiresAt: futureExpiry,
        })
      );

      const token = await getValidAccessToken(userId);
      expect(token).toBe(plainAccess);
    });

    it("3. Melakukan auto-refresh token ke Google jika masa berlaku < 5 menit dan update DB", async () => {
      const oldAccess = "ya29.old_expiring_access";
      const newAccess = "ya29.new_refreshed_access";
      const plainRefresh = "1//valid_refresh_token_123";
      const encryptedAccess = encryptSecret(oldAccess, aad);
      const encryptedRefresh = encryptSecret(plainRefresh, aad);
      const expiringSoon = new Date(Date.now() + 2 * 60 * 1000); // 2 menit lagi (expiring soon)

      vi.mocked(prisma.userGoogleDriveToken.findUnique).mockResolvedValueOnce(
        createMockToken({
          encryptedAccess,
          encryptedRefresh,
          expiresAt: expiringSoon,
          folderId: "folder_123",
        })
      );

      // Mock fetch Google OAuth2 token endpoint
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: newAccess,
          expires_in: 3600,
        }),
      });
      globalThis.fetch = mockFetch;

      const token = await getValidAccessToken(userId);
      expect(token).toBe(newAccess);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(prisma.userGoogleDriveToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        })
      );
    });

    it("4. Menghapus rekaman DB jika Google OAuth refresh mengembalikan 400 invalid_grant", async () => {
      const plainRefresh = "1//revoked_refresh_token";
      const encryptedAccess = encryptSecret("ya29.expired", aad);
      const encryptedRefresh = encryptSecret(plainRefresh, aad);
      const expiredDate = new Date(Date.now() - 60 * 1000); // sudah lewat

      vi.mocked(prisma.userGoogleDriveToken.findUnique).mockResolvedValueOnce(
        createMockToken({
          encryptedAccess,
          encryptedRefresh,
          expiresAt: expiredDate,
        })
      );

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: "invalid_grant" }),
      });

      const token = await getValidAccessToken(userId);
      expect(token).toBeNull();
      expect(prisma.userGoogleDriveToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe("getOrCreateAppFolder", () => {
    it("5. Mengembalikan folderId dari cache DB jika folder valid dan tidak trashed", async () => {
      vi.mocked(prisma.userGoogleDriveToken.findUnique).mockResolvedValueOnce(
        createMockToken({ folderId: "folder_cached_999" })
      );

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "folder_cached_999", trashed: false }),
      });

      const folderId = await getOrCreateAppFolder(userId, "mock_access_token");
      expect(folderId).toBe("folder_cached_999");
    });

    it("6. Mencari folder di Google Drive jika belum ada cache, mengupdate DB dan mengembalikan ID", async () => {
      vi.mocked(prisma.userGoogleDriveToken.findUnique).mockResolvedValueOnce(
        createMockToken({ folderId: null })
      );

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [{ id: "found_drive_folder_888", name: "Prompt Gen Videos" }],
        }),
      });

      const folderId = await getOrCreateAppFolder(userId, "mock_access_token");
      expect(folderId).toBe("found_drive_folder_888");
      expect(prisma.userGoogleDriveToken.update).toHaveBeenCalledWith({
        where: { userId },
        data: { folderId: "found_drive_folder_888" },
      });
    });

    it("7. Membuat folder baru di Google Drive jika tidak ditemukan dalam pencarian", async () => {
      vi.mocked(prisma.userGoogleDriveToken.findUnique).mockResolvedValueOnce(
        createMockToken({ folderId: null })
      );

      globalThis.fetch = vi
        .fn()
        // Panggilan 1: Search query -> files empty
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ files: [] }),
        })
        // Panggilan 2: Create folder POST -> created
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "newly_created_folder_777" }),
        });

      const folderId = await getOrCreateAppFolder(userId, "mock_access_token");
      expect(folderId).toBe("newly_created_folder_777");
      expect(prisma.userGoogleDriveToken.update).toHaveBeenCalledWith({
        where: { userId },
        data: { folderId: "newly_created_folder_777" },
      });
    });
  });

  describe("uploadToDrive", () => {
    it("8. Berhasil melakukan resumable upload dan mengembalikan fileId dan webViewLink", async () => {
      vi.mocked(prisma.userGoogleDriveToken.findUnique).mockResolvedValueOnce(
        createMockToken({ folderId: "folder_target_123" })
      );

      const fakeUploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=session_456";

      globalThis.fetch = vi
        .fn()
        // 1. Verify cached folder
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "folder_target_123", trashed: false }),
        })
        // 2. Search existing file in target folder (tidak ada)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ files: [] }),
        })
        // 3. Initiate resumable upload session
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ Location: fakeUploadUrl }),
        })
        // 4. PUT payload data
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "file_drive_abc",
            webViewLink: "https://drive.google.com/file/d/file_drive_abc/view",
          }),
        });

      const buffer = Buffer.from("dummy video content for upload");
      const result = await uploadToDrive(userId, "mock_access_token", {
        filename: "test-video.webm",
        mimeType: "video/webm",
        buffer,
      });

      expect(result.fileId).toBe("file_drive_abc");
      expect(result.webViewLink).toBe("https://drive.google.com/file/d/file_drive_abc/view");
    });

    it("9. Melempar error jika inisiasi sesi resumable gagal", async () => {
      vi.mocked(prisma.userGoogleDriveToken.findUnique).mockResolvedValueOnce(
        createMockToken({ folderId: "folder_target_123" })
      );

      globalThis.fetch = vi
        .fn()
        // 1. Verify cached folder
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "folder_target_123", trashed: false }),
        })
        // 2. Search existing file in target folder
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ files: [] }),
        })
        // 3. Initiate resumable upload session fails
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => "Internal Server Error in Google API",
        });

      const buffer = Buffer.from("test");
      await expect(
        uploadToDrive(userId, "mock_access_token", {
          filename: "test.webm",
          mimeType: "video/webm",
          buffer,
        })
      ).rejects.toThrow("Google Drive resumable upload session failed");
    });
  });

  describe("uploadToSpecificFolder (Deduplikasi In-Place Overwrite)", () => {
    it("10. Melakukan POST baru jika berkas belum ada di targetFolderId", async () => {
      const fakeUploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=session_new";

      globalThis.fetch = vi
        .fn()
        // 1. Search existing file (kosong)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ files: [] }),
        })
        // 2. POST create resumable session
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ Location: fakeUploadUrl }),
        })
        // 3. PUT binary payload
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "file_new_123",
            webViewLink: "https://drive.google.com/file/d/file_new_123/view",
          }),
        });

      const buffer = Buffer.from("new text content");
      const result = await uploadToSpecificFolder(
        userId,
        "mock_access_token",
        {
          filename: "youtube_metadata.txt",
          mimeType: "text/plain",
          buffer,
        },
        "target_subfolder_456"
      );

      expect(result.fileId).toBe("file_new_123");
      expect(result.webViewLink).toBe("https://drive.google.com/file/d/file_new_123/view");
      // Memastikan pemanggilan ke-2 adalah POST
      expect(vi.mocked(globalThis.fetch).mock.calls[1][1]?.method).toBe("POST");
    });

    it("11. Melakukan PATCH in-place update jika berkas dengan nama yang sama sudah ada di targetFolderId", async () => {
      const fakeUploadUrl = "https://www.googleapis.com/upload/drive/v3/files/file_existing_789?uploadType=resumable&upload_id=session_patch";

      globalThis.fetch = vi
        .fn()
        // 1. Search existing file (ditemukan file_existing_789)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            files: [{ id: "file_existing_789", name: "youtube_metadata.txt" }],
          }),
        })
        // 2. PATCH update resumable session
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ Location: fakeUploadUrl }),
        })
        // 3. PUT binary payload
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "file_existing_789",
            webViewLink: "https://drive.google.com/file/d/file_existing_789/view",
          }),
        });

      const buffer = Buffer.from("updated text content");
      const result = await uploadToSpecificFolder(
        userId,
        "mock_access_token",
        {
          filename: "youtube_metadata.txt",
          mimeType: "text/plain",
          buffer,
        },
        "target_subfolder_456"
      );

      expect(result.fileId).toBe("file_existing_789");
      expect(result.webViewLink).toBe("https://drive.google.com/file/d/file_existing_789/view");
      // Memastikan pemanggilan ke-2 adalah PATCH (In-Place Overwrite)
      expect(vi.mocked(globalThis.fetch).mock.calls[1][1]?.method).toBe("PATCH");
      expect(vi.mocked(globalThis.fetch).mock.calls[1][0]).toContain("/files/file_existing_789?");
    });
  });

  describe("revokeGoogleDriveToken", () => {
    it("12. Melakukan revoke token ke Google OAuth dan menghapus data dari DB", async () => {
      const encryptedRefresh = encryptSecret("1//revoke_me", aad);

      vi.mocked(prisma.userGoogleDriveToken.findUnique).mockResolvedValueOnce(
        createMockToken({
          encryptedAccess: encryptSecret("ya29.access", aad),
          encryptedRefresh,
        })
      );

      globalThis.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

      const result = await revokeGoogleDriveToken(userId);
      expect(result).toBe(true);
      expect(prisma.userGoogleDriveToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it("13. Idempoten: mengembalikan true meskipun user tidak memiliki data token di DB", async () => {
      vi.mocked(prisma.userGoogleDriveToken.findUnique).mockResolvedValueOnce(null);

      const result = await revokeGoogleDriveToken(userId);
      expect(result).toBe(true);
      expect(prisma.userGoogleDriveToken.deleteMany).not.toHaveBeenCalled();
    });
  });
});
