import { describe, it, expect, beforeEach, vi } from "vitest";
import { getClientIp, applyRateLimit, applyDualRateLimit } from "@/lib/rateLimit";

vi.mock("@/lib/db", () => ({
  prisma: {
    appSettings: {
      findUnique: vi.fn().mockResolvedValue({
        id: "singleton",
        rateLimitRequests: 10,
        rateLimitWindowMs: 60000,
      }),
    },
  },
}));

describe("rateLimit", () => {
  describe("getClientIp", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      delete process.env.TRUSTED_PROXY;
    });

    it("returns default 127.0.0.1 when req is null or empty", () => {
      expect(getClientIp(null)).toBe("127.0.0.1");
      expect(getClientIp({})).toBe("127.0.0.1");
    });

    it("extracts remoteAddress from socket when no trusted proxy", () => {
      const req = {
        socket: { remoteAddress: "192.168.1.50" },
      };
      expect(getClientIp(req)).toBe("192.168.1.50");
    });

    it("ignores x-forwarded-for if TRUSTED_PROXY is not 'true'", () => {
      const req = {
        headers: {
          get: (header: string) => (header === "x-forwarded-for" ? "203.0.113.195, 10.0.0.1" : null),
        },
        socket: { remoteAddress: "192.168.1.50" },
      };
      expect(getClientIp(req)).toBe("192.168.1.50");
    });

    it("parses first IP in x-forwarded-for when TRUSTED_PROXY is 'true'", () => {
      process.env.TRUSTED_PROXY = "true";
      const req = {
        headers: {
          get: (header: string) => (header === "x-forwarded-for" ? "203.0.113.195, 10.0.0.1" : null),
        },
      };
      expect(getClientIp(req)).toBe("203.0.113.195");
    });
  });

  describe("applyRateLimit", () => {
    it("allows requests up to the limit and blocks after", async () => {
      const testKey = `test_limit_key_${Date.now()}`;
      const limit = 3;

      expect(await applyRateLimit(testKey, limit, 60)).toBe(true);
      expect(await applyRateLimit(testKey, limit, 60)).toBe(true);
      expect(await applyRateLimit(testKey, limit, 60)).toBe(true);
      // 4th call should be blocked
      expect(await applyRateLimit(testKey, limit, 60)).toBe(false);
    });
  });

  describe("applyDualRateLimit", () => {
    it("blocks request if IP bucket exceeds limit", async () => {
      const action = `dual_test_${Date.now()}`;
      const ip = "10.10.10.1";
      const limit = 2;

      expect(await applyDualRateLimit(action, ip, "userA", limit, 60)).toBe(true);
      expect(await applyDualRateLimit(action, ip, "userB", limit, 60)).toBe(true);
      // 3rd call from same IP should fail even with userC
      expect(await applyDualRateLimit(action, ip, "userC", limit, 60)).toBe(false);
    });

    it("blocks request if user identifier exceeds limit even from different IPs", async () => {
      const action = `dual_id_test_${Date.now()}`;
      const targetUser = "targeted_user";
      const limit = 2;

      expect(await applyDualRateLimit(action, "1.1.1.1", targetUser, limit, 60)).toBe(true);
      expect(await applyDualRateLimit(action, "2.2.2.2", targetUser, limit, 60)).toBe(true);
      // 3rd call for same targetUser should fail even from new IP
      expect(await applyDualRateLimit(action, "3.3.3.3", targetUser, limit, 60)).toBe(false);
    });
  });
});
