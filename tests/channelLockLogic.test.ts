import { describe, it, expect, vi, beforeEach } from "vitest";
import { enforceChannelLimits } from "@/lib/channelLockLogic";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    plan: {
      findFirst: vi.fn(),
    },
    profileChannel: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/notifications", () => ({
  notifyUser: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

describe("channelLockLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing if user is not found", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    await enforceChannelLimits("nonexistent");
    expect(prisma.profileChannel.findMany).not.toHaveBeenCalled();
  });

  it("locks channels beyond active plan maxChannels", async () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user-active",
      subscriptionStatus: "ACTIVE",
      subscriptionExpiresAt: futureDate,
      currentPlan: { maxChannels: 2 },
    });

    const channels = [
      { id: "ch-1", channelName: "Channel 1", isLocked: false },
      { id: "ch-2", channelName: "Channel 2", isLocked: false },
      { id: "ch-3", channelName: "Channel 3", isLocked: false }, // should be locked
    ];
    (prisma.profileChannel.findMany as any).mockResolvedValue(channels);

    await enforceChannelLimits("user-active");

    // ch-1 and ch-2 shouldn't be touched because they are already unlocked
    expect(prisma.profileChannel.update).toHaveBeenCalledTimes(1);
    expect(prisma.profileChannel.update).toHaveBeenCalledWith({
      where: { id: "ch-3" },
      data: { isLocked: true },
    });
    expect(notifyUser).toHaveBeenCalledWith(
      "user-active",
      "CHANNEL_LOCKED",
      "channelLockedTitle",
      "channelLockedMsg",
      "/dashboard/channels",
      { channelName: "Channel 3" }
    );
  });

  it("locks excess channels to freePlan limit (1) when subscription is expired", async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user-expired",
      subscriptionStatus: "EXPIRED",
      subscriptionExpiresAt: pastDate,
      currentPlan: { maxChannels: 5 },
    });

    (prisma.plan.findFirst as any).mockResolvedValue({
      code: "DEMO",
      maxChannels: 1,
    });

    const channels = [
      { id: "ch-1", channelName: "Channel 1", isLocked: false },
      { id: "ch-2", channelName: "Channel 2", isLocked: false }, // should be locked
      { id: "ch-3", channelName: "Channel 3", isLocked: true },  // already locked
    ];
    (prisma.profileChannel.findMany as any).mockResolvedValue(channels);

    await enforceChannelLimits("user-expired");

    // Only ch-2 needs to be updated to isLocked: true
    expect(prisma.profileChannel.update).toHaveBeenCalledTimes(1);
    expect(prisma.profileChannel.update).toHaveBeenCalledWith({
      where: { id: "ch-2" },
      data: { isLocked: true },
    });
  });

  it("unlocks previously locked channel when quota increases", async () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user-upgraded",
      subscriptionStatus: "ACTIVE",
      subscriptionExpiresAt: futureDate,
      currentPlan: { maxChannels: 3 },
    });

    const channels = [
      { id: "ch-1", channelName: "Channel 1", isLocked: false },
      { id: "ch-2", channelName: "Channel 2", isLocked: true }, // should be unlocked
    ];
    (prisma.profileChannel.findMany as any).mockResolvedValue(channels);

    await enforceChannelLimits("user-upgraded");

    expect(prisma.profileChannel.update).toHaveBeenCalledWith({
      where: { id: "ch-2" },
      data: { isLocked: false },
    });
    expect(notifyUser).toHaveBeenCalledWith(
      "user-upgraded",
      "CHANNEL_UNLOCKED",
      "channelUnlockedTitle",
      "channelUnlockedMsg",
      "/dashboard/channels",
      { channelName: "Channel 2" }
    );
  });
});
