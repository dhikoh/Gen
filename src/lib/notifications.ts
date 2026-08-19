import { prisma } from "@/lib/db";
import { NotificationType } from "@prisma/client";
import { getTranslations } from "next-intl/server";

/**
 * Creates a notification record for a specific user, automatically translating title/message
 * based on the user's preferredLocale if i18n keys are provided.
 */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  titleKeyOrText: string,
  messageKeyOrText: string,
  link?: string,
  params?: Record<string, string | number>
) {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLocale: true },
    });
    const locale = targetUser?.preferredLocale || "id";
    let title = titleKeyOrText;
    let message = messageKeyOrText;

    try {
      const t = await getTranslations({ locale, namespace: "NotificationContent" });
      type TranslationKey = Parameters<typeof t>[0];
      if (t.has(titleKeyOrText as TranslationKey)) {
        title = t(titleKeyOrText as TranslationKey, params as never);
      }
      if (t.has(messageKeyOrText as TranslationKey)) {
        message = t(messageKeyOrText as TranslationKey, params as never);
      }
    } catch {
      // Fallback to literal text if key not found
    }

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
 * Creates notification records for all users with SUPERADMIN role using their preferred locales.
 */
export async function notifyAllSuperadmins(
  type: NotificationType,
  titleKeyOrText: string,
  messageKeyOrText: string,
  link?: string,
  params?: Record<string, string | number>
) {
  try {
    const superadmins = await prisma.user.findMany({
      where: { role: "SUPERADMIN" },
      select: { id: true, preferredLocale: true },
    });

    if (superadmins.length === 0) return;

    for (const sa of superadmins) {
      const locale = sa.preferredLocale || "id";
      let title = titleKeyOrText;
      let message = messageKeyOrText;

      try {
        const t = await getTranslations({ locale, namespace: "NotificationContent" });
        type TranslationKey = Parameters<typeof t>[0];
        if (t.has(titleKeyOrText as TranslationKey)) {
          title = t(titleKeyOrText as TranslationKey, params as never);
        }
        if (t.has(messageKeyOrText as TranslationKey)) {
          message = t(messageKeyOrText as TranslationKey, params as never);
        }
      } catch {
        // Fallback
      }

      await prisma.notification.create({
        data: {
          userId: sa.id,
          type,
          title,
          message,
          link: link || null,
        },
      });
    }
  } catch (error) {
    console.error("notifyAllSuperadmins error:", error);
  }
}
