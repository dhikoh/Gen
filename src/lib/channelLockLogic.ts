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

      // Send notification asynchronously
      notifyUser(
        userId,
        shouldBeLocked ? "CHANNEL_LOCKED" : "CHANNEL_UNLOCKED",
        shouldBeLocked ? "Kanal Dikunci" : "Kanal Dibuka",
        shouldBeLocked
          ? `Kanal ${channels[i].channelName} Anda dikunci karena melebihi kuota paket saat ini.`
          : `Kanal ${channels[i].channelName} Anda telah dibuka kembali.`,
        "/dashboard/channels"
      ).catch((err) => console.error("Error sending channel lock notification:", err));
    }
  }
}
