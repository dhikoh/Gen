import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AdminAnalyticsCharts, { AnalyticsData } from "@/components/admin/AdminAnalyticsCharts";

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

  // Dates for analytics
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Parallel Database Aggregations for Single Source of Truth Analytics
  const [
    activeUsersCount,
    pendingInvoicesCount,
    currentMonthInvoices,
    allTimeInvoices,
    usersByStatus,
    invoicesPast6Months,
    usersPast6Months,
    invoicesByPlan,
    lockedChannelsCount,
    openTicketsCount,
    pendingRegistrationsCount
  ] = await Promise.all([
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
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["APPROVED", "PAID"] } },
      select: { amount: true }
    }),
    prisma.user.groupBy({
      by: ["subscriptionStatus"],
      _count: { _all: true }
    }),
    prisma.invoice.findMany({
      where: {
        status: { in: ["APPROVED", "PAID"] },
        createdAt: { gte: sixMonthsAgo }
      },
      select: { amount: true, createdAt: true }
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["APPROVED", "PAID"] } },
      select: { amount: true, plan: { select: { name: true } } }
    }),
    prisma.profileChannel.count({
      where: { isLocked: true }
    }),
    prisma.supportTicket.count({
      where: { status: { in: ["OPEN", "REPLIED"] } }
    }),
    prisma.user.count({
      where: { registrationStatus: "PENDING_APPROVAL" }
    })
  ]);

  const currentMonthRevenue = currentMonthInvoices.reduce((sum: number, inv: { amount: number }) => sum + inv.amount, 0);
  const totalRevenue = allTimeInvoices.reduce((sum: number, inv: { amount: number }) => sum + inv.amount, 0);

  // Build Monthly Revenue & User Growth trends (Last 6 Months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenueMap = new Map<string, number>();
  const userGrowthMap = new Map<string, number>();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear() % 100}`;
    monthlyRevenueMap.set(key, 0);
    userGrowthMap.set(key, 0);
  }

  invoicesPast6Months.forEach((inv: { createdAt: Date; amount: number }) => {
    const d = new Date(inv.createdAt);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear() % 100}`;
    if (monthlyRevenueMap.has(key)) {
      monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + inv.amount);
    }
  });

  usersPast6Months.forEach((u: { createdAt: Date }) => {
    const d = new Date(u.createdAt);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear() % 100}`;
    if (userGrowthMap.has(key)) {
      userGrowthMap.set(key, (userGrowthMap.get(key) || 0) + 1);
    }
  });

  const monthlyRevenueTrend = Array.from(monthlyRevenueMap.entries()).map(([month, revenue]) => ({
    month,
    revenue
  }));

  const userGrowthTrend = Array.from(userGrowthMap.entries()).map(([month, users]) => ({
    month,
    users
  }));

  // Revenue by Plan calculation
  const planRevenueMap = new Map<string, number>();
  invoicesByPlan.forEach((inv: { plan?: { name: string } | null; amount: number }) => {
    const name = inv.plan?.name || "Other";
    planRevenueMap.set(name, (planRevenueMap.get(name) || 0) + inv.amount);
  });
  // Simple color mapping
  const planColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];
  const revenueByPlan = Array.from(planRevenueMap.entries()).map(([name, value], idx) => ({
    name,
    value,
    color: planColors[idx % planColors.length]
  }));

  // Subscription Status Distribution
  const statusColorMap: Record<string, string> = {
    ACTIVE: "#10b981",
    EXPIRED: "#ef4444",
    INACTIVE: "#6b7280"
  };
  const subscriptionStatusDist = usersByStatus.map((row: { subscriptionStatus: string; _count: { _all: number } }) => ({
    name: row.subscriptionStatus,
    value: row._count._all,
    color: statusColorMap[row.subscriptionStatus] || "#a1a1aa"
  }));

  const analyticsData: AnalyticsData = {
    monthlyRevenueTrend,
    revenueByPlan,
    userGrowthTrend,
    subscriptionStatusDist
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold pg-text-heading">{t('title')}</h1>
          <p className="text-sm pg-text-muted">{t('description')}</p>
        </div>
      </div>

      {/* Top 4 Key Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-xl shadow-lg border pg-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider pg-text-muted">{t('totalActiveUsers')}</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{activeUsersCount}</p>
        </div>
        <div className="glass-panel p-6 rounded-xl shadow-lg border pg-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider pg-text-muted">{t('monthlyRevenue')}</h3>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">Rp {currentMonthRevenue.toLocaleString('id-ID')}</p>
        </div>
        <div className="glass-panel p-6 rounded-xl shadow-lg border pg-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider pg-text-muted">{t('totalRevenue')}</h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">Rp {totalRevenue.toLocaleString('id-ID')}</p>
        </div>
        <div className="glass-panel p-6 rounded-xl shadow-lg border pg-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider pg-text-muted">{t('pendingInvoices')}</h3>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{pendingInvoicesCount}</p>
        </div>
      </div>

      {/* Operational Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{t('pendingRegistrations')}</p>
            <p className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-1">{pendingRegistrationsCount}</p>
          </div>
          <a href={`/${locale}/admin/registrations`} className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
            Lihat →
          </a>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-800 dark:text-blue-300">{t('openTickets')}</p>
            <p className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-1">{openTicketsCount}</p>
          </div>
          <a href={`/${locale}/admin/support`} className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline">
            Buka CS →
          </a>
        </div>

        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-rose-800 dark:text-rose-300">{t('lockedChannels')}</p>
            <p className="text-xl font-bold text-rose-900 dark:text-rose-200 mt-1">{lockedChannelsCount}</p>
          </div>
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Over Quota</span>
        </div>
      </div>

      {/* Interactive Recharts Analytics Visualizations */}
      <AdminAnalyticsCharts data={analyticsData} />
    </div>
  );
}
