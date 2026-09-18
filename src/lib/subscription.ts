import { prisma } from "./db";
import { enforceChannelLimits } from "./channelLockLogic";
import { notifyUser } from "./notifications";

export class SubscriptionInactiveError extends Error {
  constructor(message = "Subscription inactive or expired.") {
    super(message);
    this.name = "SubscriptionInactiveError";
  }
}

export async function getSubscriptionState(userId: string) {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: { currentPlan: true }
  });
  if (!user) throw new Error("User not found");

  const now = new Date();

  // P1-11: Terapkan downgrade jika tanggal efektif pending plan sudah tiba
  if (user.pendingPlanId && user.pendingPlanEffectiveAt && user.pendingPlanEffectiveAt <= now) {
    user = await prisma.user.update({
      where: { id: userId },
      data: {
        currentPlanId: user.pendingPlanId,
        pendingPlanId: null,
        pendingPlanEffectiveAt: null
      },
      include: { currentPlan: true }
    });
    await enforceChannelLimits(userId);
  }

  let isActive = user.subscriptionStatus === "ACTIVE" && 
                   user.subscriptionExpiresAt !== null && 
                   user.subscriptionExpiresAt > now;

  // Enforce side effects (Spec 3.4)
  if (!isActive && user.subscriptionStatus === "ACTIVE") {
    user = await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: "EXPIRED" },
      include: { currentPlan: true }
    });
    isActive = false;
    await enforceChannelLimits(userId);
    await notifyUser(
      userId,
      "SUBSCRIPTION_EXPIRED",
      "subscriptionExpiredTitle",
      "subscriptionExpiredMsg",
      "/dashboard/billing"
    );
  } else if (isActive && user.subscriptionExpiresAt) {
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const timeLeft = user.subscriptionExpiresAt.getTime() - now.getTime();
    if (timeLeft > 0 && timeLeft <= threeDaysMs) {
      // Avoid duplicate notification if issued within the last 24h
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentNotif = await prisma.notification.findFirst({
        where: {
          userId,
          type: "SUBSCRIPTION_EXPIRING_SOON",
          createdAt: { gte: oneDayAgo }
        }
      });

      if (!recentNotif) {
        const daysLeft = Math.max(1, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)));
        await notifyUser(
          userId,
          "SUBSCRIPTION_EXPIRING_SOON",
          "subscriptionExpiringTitle",
          "subscriptionExpiringMsg",
          "/dashboard/billing",
          { daysLeft }
        );
      }
    }
  }

  return {
    isActive,
    user,
    plan: user.currentPlan
  };
}

export async function requireActiveSubscription(userId: string) {
  const { isActive, user, plan } = await getSubscriptionState(userId);
  if (user.role === "SUPERADMIN") return { user, plan };

  if (!isActive) {
    throw new Error("Subscription inactive or expired.");
  }
  return { user, plan };
}
