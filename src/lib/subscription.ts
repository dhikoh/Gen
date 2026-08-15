import { prisma } from "./db";
import { User, Plan } from "@prisma/client";

export async function getSubscriptionState(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { currentPlan: true }
  });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const isActive = user.subscriptionStatus === "ACTIVE" && 
                   user.subscriptionExpiresAt && 
                   user.subscriptionExpiresAt > now;

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
    if (user.subscriptionStatus === "ACTIVE") {
      // Sync DB state if it expired naturally
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: "EXPIRED" }
      });
    }
    throw new Error("Subscription inactive or expired.");
  }
  return { user, plan };
}
