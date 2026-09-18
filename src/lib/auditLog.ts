import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface LogAdminActionInput {
  actorId?: string;
  adminId?: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
  ip?: string | null;
}

export async function logAdminAction(data: LogAdminActionInput): Promise<void> {
  try {
    const actor = data.actorId || data.adminId || "UNKNOWN";
    await prisma.adminAuditLog.create({
      data: {
        actorId: actor,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId || null,
        beforeData: (data.beforeData !== undefined ? data.beforeData : null) as Prisma.InputJsonValue,
        afterData: (data.afterData !== undefined ? data.afterData : (data.metadata !== undefined ? data.metadata : null)) as Prisma.InputJsonValue,
        ip: data.ip || null,
      }
    });
  } catch (err) {
    console.error("[AdminAuditLog Error] Failed to write audit log:", err);
  }
}
