import { prisma } from "./db";
import { User, Plan } from "@prisma/client";

import { enforceChannelLimits } from "./channelLockLogic";

export async function getSubscriptionState(userId: string) {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: { currentPlan: true }
  });
  if (!user) throw new Error("User not found");

  const now = new Date();
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
