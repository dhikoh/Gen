import { prisma } from "@/lib/db";
import { NotificationType } from "@prisma/client";

/**
 * Creates a notification record for a specific user.
 */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
      },
    });
  } catch (error) {
    console.error("notifyUser error:", error);
    return null;
  }
}

/**
 * Creates notification records for all users with SUPERADMIN role.
 */
export async function notifyAllSuperadmins(
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    const superadmins = await prisma.user.findMany({
      where: { role: "SUPERADMIN" },
      select: { id: true },
    });

    if (superadmins.length === 0) return;

    await prisma.notification.createMany({
      data: superadmins.map((sa) => ({
        userId: sa.id,
        type,
        title,
        message,
        link: link || null,
      })),
    });
  } catch (error) {
    console.error("notifyAllSuperadmins error:", error);
  }
}
