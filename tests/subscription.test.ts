import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSubscriptionState, requireActiveSubscription, SubscriptionInactiveError } from "@/lib/subscription";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/channelLockLogic", () => ({
  enforceChannelLimits: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notifications", () => ({
  notifyUser: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";
import { enforceChannelLimits } from "@/lib/channelLockLogic";
import { notifyUser } from "@/lib/notifications";

describe("subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SubscriptionInactiveError", () => {
    it("instantiates correctly with default message", () => {
      const err = new SubscriptionInactiveError();
      expect(err.message).toBe("Subscription inactive or expired.");
      expect(err.name).toBe("SubscriptionInactiveError");
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe("getSubscriptionState", () => {
    it("throws error when user is not found", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      await expect(getSubscriptionState("invalid-user")).rejects.toThrow("User not found");
    });

    it("identifies active subscription when expiresAt is in future", async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: futureDate,
        pendingPlanId: null,
        currentPlan: { id: "plan-pro", name: "Pro Plan", maxChannels: 5 },
      });

      const result = await getSubscriptionState("user-1");
      expect(result.isActive).toBe(true);
      expect(result.plan?.id).toBe("plan-pro");
    });

    it("expires subscription and triggers lock logic when expiresAt has passed", async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const mockUser = {
        id: "user-expired",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: pastDate,
        pendingPlanId: null,
        currentPlan: { id: "plan-pro", name: "Pro Plan", maxChannels: 5 },
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.user.update as any).mockResolvedValue({
        ...mockUser,
        subscriptionStatus: "EXPIRED",
      });

      const result = await getSubscriptionState("user-expired");
      expect(result.isActive).toBe(false);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-expired" },
        data: { subscriptionStatus: "EXPIRED" },
        include: { currentPlan: true },
      });
      expect(enforceChannelLimits).toHaveBeenCalledWith("user-expired");
      expect(notifyUser).toHaveBeenCalledWith(
        "user-expired",
        "SUBSCRIPTION_EXPIRED",
        expect.any(String),
        expect.any(String),
        "/dashboard/billing"
      );
    });

    it("applies pending downgraded plan when effectiveAt date has arrived", async () => {
      const pastDate = new Date(Date.now() - 1000);
      const futureExpiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const userWithPending = {
        id: "user-pending",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: futureExpiry,
        pendingPlanId: "plan-standard",
        pendingPlanEffectiveAt: pastDate,
        currentPlan: { id: "plan-pro", name: "Pro Plan" },
      };

      (prisma.user.findUnique as any).mockResolvedValue(userWithPending);
      (prisma.user.update as any).mockResolvedValue({
        ...userWithPending,
        currentPlanId: "plan-standard",
        pendingPlanId: null,
        pendingPlanEffectiveAt: null,
        currentPlan: { id: "plan-standard", name: "Standard Plan" },
      });

      const result = await getSubscriptionState("user-pending");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-pending" },
        data: {
          currentPlanId: "plan-standard",
          pendingPlanId: null,
          pendingPlanEffectiveAt: null,
        },
        include: { currentPlan: true },
      });
      expect(enforceChannelLimits).toHaveBeenCalledWith("user-pending");
      expect(result.plan?.id).toBe("plan-standard");
    });
  });

  describe("requireActiveSubscription", () => {
    it("allows SUPERADMIN even if subscription is inactive", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "admin-1",
        role: "SUPERADMIN",
        subscriptionStatus: "INACTIVE",
        subscriptionExpiresAt: null,
        pendingPlanId: null,
        currentPlan: null,
      });

      const result = await requireActiveSubscription("admin-1");
      expect(result.user.role).toBe("SUPERADMIN");
    });

    it("throws error for normal USER if subscription is inactive", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-inactive",
        role: "USER",
        subscriptionStatus: "INACTIVE",
        subscriptionExpiresAt: null,
        pendingPlanId: null,
        currentPlan: null,
      });

      await expect(requireActiveSubscription("user-inactive")).rejects.toThrow("Subscription inactive or expired.");
    });
  });
});
