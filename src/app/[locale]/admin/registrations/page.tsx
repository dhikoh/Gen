import { getTranslations } from "next-intl/server";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import AdminRegistrationsClient from "./AdminRegistrationsClient";

export async function generateMetadata() {
  const t = await getTranslations("AdminRegistrations");
  return { title: t("pageTitleTab") };
}

export default async function AdminRegistrationsPage() {
  const t = await getTranslations("AdminRegistrations");

  const pendingUsers = await prisma.user.findMany({
    where: {
      registrationStatus: "PENDING_APPROVAL"
    },
    select: {
      ...SAFE_USER_SELECT,
      registrationStatus: true,
      createdAt: true,
      channels: {
        select: {
          id: true,
          channelName: true,
          niche: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("description")}</p>
      </div>

      <AdminRegistrationsClient initialUsers={pendingUsers} />
    </div>
  );
}
