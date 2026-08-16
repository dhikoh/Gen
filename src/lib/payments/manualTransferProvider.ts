import { prisma } from "../db";
import { enforceChannelLimits } from "../channelLockLogic";

export async function activateSubscription(invoiceId: string, reviewedById: string) {
  return await prisma.$transaction(async (tx) => {
    // We use findFirst to get the invoice, but the actual status check 
    // happens inside an updateMany to prevent TOCTOU race conditions.
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { plan: true }
    });

    if (!invoice) throw new Error("Invoice not found");

    const updateResult = await tx.invoice.updateMany({
      where: { id: invoiceId, status: "PENDING" },
      data: { 
        status: "APPROVED",
        reviewedById,
        reviewedAt: new Date()
      }
    });

    if (updateResult.count === 0) {
      throw new Error("Invoice is no longer PENDING or already processed.");
    }

    const user = await tx.user.findUnique({ where: { id: invoice.userId } });
    if (!user) throw new Error("User not found");

    const now = new Date();
    let newExpiresAt = new Date();
    
    // Cumulative expiry logic
    if (user.subscriptionStatus === "ACTIVE" && user.subscriptionExpiresAt && user.subscriptionExpiresAt > now) {
      newExpiresAt = new Date(user.subscriptionExpiresAt);
    }
    newExpiresAt.setDate(newExpiresAt.getDate() + invoice.periodDays);

    await tx.user.update({
      where: { id: invoice.userId },
      data: {
        subscriptionStatus: "ACTIVE",
        currentPlanId: invoice.planId,
        subscriptionExpiresAt: newExpiresAt
      }
    });

    return invoice;
  });
}
