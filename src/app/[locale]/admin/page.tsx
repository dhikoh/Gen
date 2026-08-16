import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import UserManagement from "@/components/admin/UserManagement";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Admin' });
  return { title: `${t('pageTitleTab')} - Prompt Gen` };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/id/dashboard");
  }

  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Admin' });

  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true }
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('description')}</p>
        </div>
      </div>

      <UserManagement initialPlans={plans} />
    </div>
  );
}
