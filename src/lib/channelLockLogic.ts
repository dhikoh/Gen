import { prisma } from "./db";
import { Prisma } from "@prisma/client";
import { notifyUser } from "./notifications";

export async function enforceChannelLimits(userId: string, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { currentPlan: true }
  });

  if (!user) return;

  const now = new Date();
  const isSubscriptionActive =
    user.subscriptionStatus === "ACTIVE" &&
    user.subscriptionExpiresAt !== null &&
    user.subscriptionExpiresAt > now;

  let maxChannels = 1;

  if (isSubscriptionActive && user.currentPlan) {
    maxChannels = user.currentPlan.maxChannels ?? 1;
  } else {
    // P0-7: Saat langganan kadaluarsa atau inaktif, kunci channel sesuai batas paket gratis
    const freePlan = await db.plan.findFirst({
      where: {
        OR: [
          { code: "DEMO" },
          { priceMonthly: 0 }
        ]
      }
    });
    maxChannels = freePlan?.maxChannels ?? 1;
  }

  const channels = await db.profileChannel.findMany({
    where: { userId },
    orderBy: [
      { lastUsedAt: "desc" },
      { createdAt: "desc" }
    ]
  });

  for (let i = 0; i < channels.length; i++) {
    const shouldBeLocked = i >= maxChannels;
    if (channels[i].isLocked !== shouldBeLocked) {
      await db.profileChannel.update({
        where: { id: channels[i].id },
        data: { isLocked: shouldBeLocked }
      });

      // Send notification asynchronously
      notifyUser(
        userId,
        shouldBeLocked ? "CHANNEL_LOCKED" : "CHANNEL_UNLOCKED",
        shouldBeLocked ? "channelLockedTitle" : "channelUnlockedTitle",
        shouldBeLocked ? "channelLockedMsg" : "channelUnlockedMsg",
        "/dashboard/channels",
        { channelName: channels[i].channelName }
      ).catch((err) => console.error("Error sending channel lock notification:", err));
    }
  }
}
