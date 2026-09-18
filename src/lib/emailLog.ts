import { prisma } from "@/lib/db";

export interface LogEmailDeliveryInput {
  userId?: string | null;
  recipient: string;
  subject?: string;
  templateName?: string;
  templateType?: string;
  status: "SUCCESS" | "FAILED" | "DELIVERED";
  error?: unknown;
  errorDetails?: unknown;
}

export async function logEmailDelivery(data: LogEmailDeliveryInput): Promise<void> {
  try {
    const statusNormalized = data.status === "DELIVERED" ? "SUCCESS" : data.status;
    const rawError = data.error !== undefined ? data.error : data.errorDetails;
    const errorMessage = rawError instanceof Error 
      ? rawError.message 
      : rawError 
        ? String(rawError) 
        : null;

    await prisma.emailLog.create({
      data: {
        userId: data.userId || null,
        recipient: data.recipient,
        subject: data.subject || data.templateName || data.templateType || "Notification",
        templateType: data.templateType || data.templateName || "GENERAL",
        status: statusNormalized,
        error: errorMessage,
      }
    });
  } catch (err) {
    console.error("[EmailLog Error] Failed to write email log:", err);
  }
}
