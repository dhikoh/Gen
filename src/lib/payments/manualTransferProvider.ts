import { prisma } from "../db";
import { enforceChannelLimits } from "../channelLockLogic";
import { CreateInvoiceInput, PaymentProvider } from "./types";

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
        periodDays: 30 // hardcoded for now, could fetch from plan
      }
    });
    
    return { invoiceId: invoice.id };
  }

  async verifyPayment(invoiceId: string, proofData?: string): Promise<boolean> {
    // Manual transfer relies on admin approval, so verifyPayment just checks if proof exists
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    return !!(invoice && invoice.proofUrl);
  }

  getPaymentInstructions(): string {
    return "Please transfer to our bank account and upload proof of payment.";
  }
}

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

    await enforceChannelLimits(invoice.userId, tx);

    return invoice;
  });
}
