import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./AdminSettingsClient";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AdminSettings' });
  return { title: t('pageTitleTab') };
}

export default async function AdminSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/");
  }

  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AdminSettings' });

  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" }
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">{t('description')}</p>
      </div>

      <AdminSettingsClient settings={settings} />
    </div>
  );
}
