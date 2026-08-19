import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import UserManagement from "@/components/admin/UserManagement";
import AdminPlansClient from "./plans/AdminPlansClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Admin' });
  return { title: `${t('pageTitleTab')} - Prompt Gen` };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect(`/${locale}/dashboard`);
  }
  const t = await getTranslations({ locale, namespace: 'Admin' });

  // Dashboard Stats Queries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [plans, activeUsersCount, pendingInvoicesCount, currentMonthInvoices] = await Promise.all([
    prisma.plan.findMany({
      orderBy: { sortOrder: "asc" }
    }),
    prisma.user.count({
      where: { subscriptionStatus: "ACTIVE" }
    }),
    prisma.invoice.count({
      where: { status: "PENDING" }
    }),
    prisma.invoice.findMany({
      where: { 
        status: { in: ["APPROVED", "PAID"] },
        createdAt: { gte: startOfMonth }
      },
      select: { amount: true }
    })
  ]);

  const currentMonthRevenue = currentMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('totalActiveUsers')}</h3>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">{activeUsersCount}</p>
        </div>
        <div className="glass-panel p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('monthlyRevenue')}</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">Rp {currentMonthRevenue.toLocaleString('id-ID')}</p>
        </div>
        <div className="glass-panel p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('pendingInvoices')}</h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{pendingInvoicesCount}</p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Subscription Plans</h2>
          <AdminPlansClient initialPlans={plans as any} />
        </div>
        <UserManagement initialPlans={plans} />
      </div>
    </div>
  );
}
