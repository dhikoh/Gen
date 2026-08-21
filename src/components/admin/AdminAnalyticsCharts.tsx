"use client";

import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export interface AnalyticsData {
  monthlyRevenueTrend: Array<{ month: string; revenue: number }>;
  revenueByPlan: Array<{ name: string; value: number; color: string }>;
  userGrowthTrend: Array<{ month: string; users: number }>;
  subscriptionStatusDist: Array<{ name: string; value: number; color: string }>;
}

interface AdminAnalyticsChartsProps {
  data: AnalyticsData;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const TOOLTIP_STYLE = {
  backgroundColor: "var(--pg-surface)",
  borderColor: "var(--pg-shadow-dark)",
  color: "var(--pg-text)",
  borderRadius: "12px",
  boxShadow: "var(--pg-neu-sm)",
};
const AXIS_COLOR = "var(--pg-text-muted)";

export default function AdminAnalyticsCharts({ data }: AdminAnalyticsChartsProps) {
  const t = useTranslations("Admin");

  const panelCls = "neu-flat p-6 rounded-xl";

  return (
    <div className="space-y-8 my-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: 'var(--pg-text)' }}>
          {t("analyticsTitle")}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. AreaChart: Revenue Trend */}
        <div className={panelCls}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--pg-text)' }}>
            {t("revenueTrend")}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyRevenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke={AXIS_COLOR} fontSize={12} />
                <YAxis stroke={AXIS_COLOR} fontSize={12} tickFormatter={(val) => `Rp ${(val / 1000).toLocaleString()}k`} />
                <Tooltip
                  formatter={(val: unknown) => [`Rp ${Number(val ?? 0).toLocaleString("id-ID")}`, t("monthlyRevenue")]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. BarChart: User Growth Trend */}
        <div className={panelCls}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--pg-text)' }}>
            {t("userGrowthTrend")}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.userGrowthTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke={AXIS_COLOR} fontSize={12} />
                <YAxis stroke={AXIS_COLOR} fontSize={12} allowDecimals={false} />
                <Tooltip
                  formatter={(val: unknown) => [`${String(val ?? 0)} User`, t("recentUsers")]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="users" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. PieChart: Revenue by Plan */}
        <div className={panelCls}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--pg-text)' }}>
            {t("revenueByPlan")}
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {data.revenueByPlan.length === 0 || data.revenueByPlan.every((d) => d.value === 0) ? (
              <p className="text-sm" style={{ color: 'var(--pg-text-muted)' }}>Belum ada data pendapatan per paket.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.revenueByPlan}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80}
                    paddingAngle={5} dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {data.revenueByPlan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: unknown) => [`Rp ${Number(val ?? 0).toLocaleString("id-ID")}`, "Total"]} contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. PieChart: Subscription Status Distribution */}
        <div className={panelCls}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--pg-text)' }}>
            {t("subscriptionStatusDist")}
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {data.subscriptionStatusDist.length === 0 || data.subscriptionStatusDist.every((d) => d.value === 0) ? (
              <p className="text-sm" style={{ color: 'var(--pg-text-muted)' }}>Belum ada data status langganan.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.subscriptionStatusDist}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={4} dataKey="value"
                    label={({ name, value }: { name?: string; value?: number }) => `${name}: ${value}`}
                  >
                    {data.subscriptionStatusDist.map((entry, index) => (
                      <Cell key={`status-cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: unknown) => [`${String(val ?? 0)} User`, "Jumlah"]} contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
