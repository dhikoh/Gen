import { prisma } from "../db";
import { enforceChannelLimits } from "../channelLockLogic";
import { CreateInvoiceInput, PaymentProvider } from "./types";
import { notifyUser } from "../notifications";

export class ManualTransferProvider implements PaymentProvider {
  name = "Manual Transfer";
  method = "MANUAL_TRANSFER" as const;

  async createInvoice(input: CreateInvoiceInput): Promise<{ invoiceId: string; paymentUrl?: string }> {
    const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
    if (!plan) throw new Error("Plan not found");

    const invoice = await prisma.invoice.create({
      data: {
        userId: input.userId,
        planId: input.planId,
        amount: input.amount,
        method: "MANUAL_TRANSFER",
        status: "PENDING",
        periodDays: plan.periodDays || 30 // P0-3: Baca dari plan.periodDays
      }
    });
    
    return { invoiceId: invoice.id };
  }

  async verifyPayment(invoiceId: string): Promise<boolean> {
    // Manual transfer relies on admin approval, so verifyPayment just checks if proof exists
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    return !!(invoice && invoice.proofUrl);
  }

  getPaymentInstructions(): string {
    return "Silakan transfer ke rekening bank kami dan unggah bukti transfer pembayaran Anda.";
  }
}

export async function activateSubscription(invoiceId: string, reviewedById: string) {
  const result = await prisma.$transaction(async (tx) => {
    // We use findFirst to get the invoice, but the actual status check 
    // happens inside an updateMany to prevent TOCTOU race conditions.
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { plan: true }
    });

    if (!invoice) throw new Error("Invoice not found");

    const updateResult = await tx.invoice.updateMany({
      where: {
        id: invoiceId,
        status: "PENDING"
      },
      data: {
        status: "APPROVED",
        reviewedById,
        reviewedAt: new Date()
      }
    });

    if (updateResult.count === 0) {
      throw new Error("Invoice is no longer PENDING or already processed.");
    }

    const user = await tx.user.findUnique({
      where: { id: invoice.userId },
      include: { currentPlan: true }
    });
    if (!user) throw new Error("User not found");

    const now = new Date();
    let newExpiresAt = new Date();
    const isCurrentlyActive = user.subscriptionStatus === "ACTIVE" && user.subscriptionExpiresAt && user.subscriptionExpiresAt > now;

    if (isCurrentlyActive && user.subscriptionExpiresAt) {
      newExpiresAt = new Date(user.subscriptionExpiresAt);
    }
    newExpiresAt.setDate(newExpiresAt.getDate() + invoice.periodDays);

    // P1-11: Kebijakan Upgrade / Downgrade Eksplisit
    const isDowngrade = isCurrentlyActive && user.currentPlan && (invoice.plan.priceMonthly < user.currentPlan.priceMonthly);

    if (isDowngrade) {
      // Downgrade: jadwalkan setelah masa paket aktif yang lebih tinggi habis
      await tx.user.update({
        where: { id: invoice.userId },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionExpiresAt: newExpiresAt,
          pendingPlanId: invoice.planId,
          pendingPlanEffectiveAt: new Date(user.subscriptionExpiresAt!)
        }
      });
    } else {
      // Upgrade atau perpanjangan setara: langsung naik tier dan kumulatif
      await tx.user.update({
        where: { id: invoice.userId },
        data: {
          subscriptionStatus: "ACTIVE",
          currentPlanId: invoice.planId,
          subscriptionExpiresAt: newExpiresAt,
          pendingPlanId: null,
          pendingPlanEffectiveAt: null
        }
      });
    }

    await enforceChannelLimits(invoice.userId, tx);

    return invoice;
  });

  // Send in-app notification to user
  await notifyUser(
    result.userId,
    "PAYMENT_APPROVED",
    "paymentApprovedTitle",
    "paymentApprovedMsg",
    "/dashboard/billing",
    { planName: result.plan?.name || "Premium" }
  );

  return result;
}
