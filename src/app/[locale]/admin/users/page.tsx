import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import UserManagement from "@/components/admin/UserManagement";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Admin' });
  return { title: `${t('users')} - Prompt Gen Admin` };
}

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPERADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations({ locale, namespace: 'Admin' });

  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: "asc" }
  });

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold pg-text-heading">{t('users')}</h1>
        <p className="text-sm pg-text-muted">{t('userManagementDescription')}</p>
      </div>
      <UserManagement initialPlans={plans} />
    </div>
  );
}
