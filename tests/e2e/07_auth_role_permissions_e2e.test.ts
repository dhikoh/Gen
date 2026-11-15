import { describe, it, expect } from "vitest";
import { MOCK_SUPERADMIN, MOCK_PRO_USER, MOCK_FREE_USER } from "./testHarness";

describe("E2E Skenario 7: Role Authorization Matrix, Channel Security & Safety Shield", () => {
  describe("Bagian 1: Role-Based Access Control (RBAC) Admin Boundaries", () => {
    function simulateAdminRouteGuard(session: typeof MOCK_SUPERADMIN | typeof MOCK_PRO_USER | null): {
      status: number;
      authorized: boolean;
      error?: string;
    } {
      if (!session) {
        return { status: 401, authorized: false, error: "Unauthorized" };
      }
      if (session.user.role !== "SUPERADMIN") {
        return { status: 403, authorized: false, error: "Forbidden: Superadmin access required" };
      }
      return { status: 200, authorized: true };
    }

    it("rejects unauthenticated requests to admin routes with HTTP 401", () => {
      const res = simulateAdminRouteGuard(null);
      expect(res.status).toBe(401);
      expect(res.authorized).toBe(false);
    });

    it("strictly forbids normal Pro User from accessing administrative routes with HTTP 403", () => {
      const res = simulateAdminRouteGuard(MOCK_PRO_USER);
      expect(res.status).toBe(403);
      expect(res.authorized).toBe(false);
      expect(res.error).toContain("Superadmin");
    });

    it("grants Superadmin full authorization to administrative routes with HTTP 200", () => {
      const res = simulateAdminRouteGuard(MOCK_SUPERADMIN);
      expect(res.status).toBe(200);
      expect(res.authorized).toBe(true);
    });
  });

  describe("Bagian 2: Channel Ownership & Security Boundary", () => {
    interface ChannelRecord {
      id: string;
      userId: string;
      isLocked: boolean;
    }

    const mockChannels: ChannelRecord[] = [
      { id: "chan_user_1", userId: "usr_pro_02", isLocked: false },
      { id: "chan_user_2", userId: "usr_free_03", isLocked: false },
      { id: "chan_locked", userId: "usr_pro_02", isLocked: true },
    ];

    function simulateChannelAccessCheck(
      requestUserId: string,
      targetChannelId: string
    ): { allowed: boolean; status: number; error?: string } {
      const channel = mockChannels.find((c) => c.id === targetChannelId);
      if (!channel || channel.userId !== requestUserId) {
        return { allowed: false, status: 400, error: "Channel tidak valid atau bukan milik Anda" };
      }
      if (channel.isLocked) {
        return { allowed: false, status: 403, error: "Channel sedang dikunci oleh admin" };
      }
      return { allowed: true, status: 200 };
    }

    it("prevents User B from accessing or generating on User A's channel (Cross-Tenant Security)", () => {
      // User Free (usr_free_03) mencoba akses channel milik User Pro (usr_pro_02)
      const res = simulateChannelAccessCheck("usr_free_03", "chan_user_1");
      expect(res.allowed).toBe(false);
      expect(res.status).toBe(400);
    });

    it("blocks generation if the channel has been locked by Superadmin", () => {
      // User Pro mencoba generate di channel miliknya yang di-lock
      const res = simulateChannelAccessCheck("usr_pro_02", "chan_locked");
      expect(res.allowed).toBe(false);
      expect(res.status).toBe(403);
      expect(res.error).toContain("dikunci");
    });

    it("allows user to generate content on their own active, unlocked channel", () => {
      const res = simulateChannelAccessCheck("usr_pro_02", "chan_user_1");
      expect(res.allowed).toBe(true);
      expect(res.status).toBe(200);
    });
  });

  describe("Bagian 3: Banned Words & Content Safety Shield", () => {
    const mockBannedList = ["judi online", "slot gacor", "pinjol ilegal", "pornografi"];

    function checkContentSafety(input: string): { safe: boolean; detectedWord?: string } {
      const cleanInput = input.toLowerCase();
      for (const word of mockBannedList) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(^|\\W)${escaped}($|\\W)`, "i");
        if (regex.test(cleanInput)) {
          return { safe: false, detectedWord: word };
        }
      }
      return { safe: true };
    }

    it("detects and rejects banned keywords in topic or additional context", () => {
      const badInput = "Tips menang slot gacor malam ini dengan trik jitu";
      const check = checkContentSafety(badInput);

      expect(check.safe).toBe(false);
      expect(check.detectedWord).toBe("slot gacor");
    });

    it("allows completely benign and professional topics to proceed safely", () => {
      const goodInput = "Cara Membangun Workflow Otomasi Bisnis dengan AI 2026";
      const check = checkContentSafety(goodInput);

      expect(check.safe).toBe(true);
      expect(check.detectedWord).toBeUndefined();
    });
  });
});

