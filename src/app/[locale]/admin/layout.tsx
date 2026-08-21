import { requireRole } from "@/lib/authHelpers";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import NotificationBell from "@/components/notifications/NotificationBell";
import AdminSidebarNav from "@/components/layout/AdminSidebarNav";
import AdminMobileNav from "@/components/layout/AdminMobileNav";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole("SUPERADMIN", locale);

  const t = await getTranslations({ locale, namespace: "Admin" });

  const pendingRegistrationsCount = await prisma.user.count({
    where: { registrationStatus: "PENDING_APPROVAL" },
  });

  const openTicketsCount = await prisma.supportTicket.count({
    where: { status: "OPEN" },
  });

  const adminNavLinks = [
    { href: `/${locale}/admin`,               icon: "📊", label: t("overview"),          badge: 0 },
    { href: `/${locale}/admin/users`,         icon: "👥", label: t("users"),              badge: 0 },
    { href: `/${locale}/admin/registrations`, icon: "📋", label: t("registrations"),      badge: pendingRegistrationsCount },
    { href: `/${locale}/admin/payments`,      icon: "💰", label: t("paymentApproval"),    badge: 0 },
    { href: `/${locale}/admin/support`,       icon: "🎫", label: t("support"),            badge: openTicketsCount },
    { href: `/${locale}/admin/plans`,         icon: "💎", label: t("subscriptionPlans"),  badge: 0 },
    { href: `/${locale}/admin/announcements`, icon: "📣", label: t("announcements"),      badge: 0 },
    { href: `/${locale}/admin/notifications`, icon: "🔔", label: t("systemNotifications"),badge: 0 },
    { href: `/${locale}/admin/settings`,      icon: "⚙️", label: t("systemSettings"),     badge: 0 },
    { href: `/${locale}/admin/panduan`,       icon: "📖", label: t("guide"),              badge: 0 },
  ];

  const adminInitial = session.user.name?.[0]?.toUpperCase() || "A";

  return (
    <div className="flex h-screen" style={{ background: "var(--pg-bg)" }}>
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-64 flex-col flex-shrink-0"
        style={{
          background: "var(--pg-admin-bg)",
          boxShadow: "4px 0 20px rgba(0,0,0,0.35)",
        }}
      >
        {/* Brand Header */}
        <div
          className="h-16 flex items-center px-5 gap-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--pg-admin-border)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--pg-brand) 0%, #c94d00 100%)",
              boxShadow: "0 2px 10px var(--pg-brand-glow)",
            }}
          >
            ⚡
          </div>
          <div>
            <Link
              href={`/${locale}/admin`}
              className="font-bold text-sm tracking-tight leading-none"
              style={{ color: "#ffffff" }}
            >
              Admin Portal
            </Link>
            <p className="text-[10px] mt-0.5 font-medium" style={{ color: "var(--pg-brand)" }}>
              Prompt Gen
            </p>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-4 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--pg-admin-sub)" }}>
            {t("systemManagement")}
          </p>
        </div>

        {/* Nav Links — client component handles active state */}
        <AdminSidebarNav links={adminNavLinks} />

        {/* User Footer */}
        <div
          className="p-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--pg-admin-border)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--pg-brand) 0%, #c94d00 100%)",
                boxShadow: "2px 2px 8px var(--pg-brand-glow)",
              }}
            >
              {adminInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#e8eaf6" }}>
                {session.user.name}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide truncate" style={{ color: "var(--pg-brand)" }}>
                {session.user.role}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto focus:outline-none flex flex-col min-w-0">
        {/* Mobile Nav — hamburger + slide-in drawer */}
        <AdminMobileNav
          links={adminNavLinks}
          adminName={session.user.name || "Admin"}
          adminInitial={adminInitial}
          adminRole={session.user.role || "SUPERADMIN"}
        />

        {/* Desktop Topbar */}
        <header
          className="hidden md:flex h-16 flex-shrink-0 px-8 items-center justify-between sticky top-0 z-40"
          style={{
            background: "var(--pg-card)",
            boxShadow: "0 2px 10px var(--pg-shadow-dark)",
          }}
        >
          <div className="text-sm font-semibold" style={{ color: "var(--pg-text-sub)" }}>
            Prompt Gen Admin Portal
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        <div className="py-6 px-4 md:px-8 flex-1 pg-fade-in custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
