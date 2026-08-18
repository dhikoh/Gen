import { prisma } from "./db";
import { Prisma } from "@prisma/client";

export async function enforceChannelLimits(userId: string, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { currentPlan: true }
  });

  if (!user) return;

  const maxChannels = user.currentPlan?.maxChannels || 1;

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
    }
  }
}
