import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminPlansClient from "./AdminPlansClient";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AdminPlans' });
  return { title: t('pageTitleTab') };
}

export default async function AdminPlansPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect(`/${locale}/auth`);
  }

  const t = await getTranslations({ locale, namespace: 'AdminPlans' });

  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t('description')}
        </p>
      </div>

      <AdminPlansClient initialPlans={plans as any} />
    </div>
  );
}
