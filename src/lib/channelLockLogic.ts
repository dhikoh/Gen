import { prisma } from "./db";

export async function enforceChannelLimits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { currentPlan: true }
  });

  if (!user) return;

  const maxChannels = user.currentPlan?.maxChannels || 1;

  const channels = await prisma.profileChannel.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });

  for (let i = 0; i < channels.length; i++) {
    const shouldBeLocked = i >= maxChannels;
    if (channels[i].isLocked !== shouldBeLocked) {
      await prisma.profileChannel.update({
        where: { id: channels[i].id },
        data: { isLocked: shouldBeLocked }
      });
    }
  }
}
