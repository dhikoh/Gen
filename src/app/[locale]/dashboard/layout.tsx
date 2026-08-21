import { requireRole } from "@/lib/authHelpers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import NotificationBell from "@/components/notifications/NotificationBell";
import MobileDashboardNav from "@/components/layout/MobileDashboardNav";
import LogoutButton from "@/components/auth/LogoutButton";
import DashboardSidebarNav from "@/components/layout/DashboardSidebarNav";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole("USER", locale);
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const userInitial = session.user.name?.[0]?.toUpperCase() || "U";
  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";
  const userRole = session.user.role || "USER";

  const navLinks = [
    { href: `/${locale}/dashboard`,               icon: "🏠", label: t("overview") },
    { href: `/${locale}/dashboard/generator`,     icon: "✨", label: t("generator") },
    { href: `/${locale}/dashboard/scene-prompt`,  icon: "🎬", label: t("scenePromptStudio") },
    { href: `/${locale}/dashboard/drafts`,        icon: "📄", label: t("drafts") },
    { href: `/${locale}/dashboard/channels`,      icon: "📺", label: t("channels") },
    { href: `/${locale}/dashboard/billing`,       icon: "💳", label: t("billing") },
    { href: `/${locale}/dashboard/notifications`, icon: "🔔", label: t("notifications") },
    { href: `/${locale}/dashboard/support`,       icon: "🆘", label: t("support") },
    { href: `/${locale}/dashboard/panduan`,       icon: "📖", label: t("guide") },
  ];

  return (
    <div
      className="flex h-screen"
      style={{ background: "var(--pg-bg)" }}
    >
      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-64 flex-col flex-shrink-0"
        style={{
          background: "var(--pg-admin-bg)",
          boxShadow: "4px 0 20px rgba(0,0,0,0.3)",
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
              background: "var(--pg-brand)",
              boxShadow: "0 2px 10px var(--pg-brand-glow)",
            }}
          >
            ✨
          </div>
          <Link
            href={`/${locale}/dashboard`}
            className="font-bold text-base tracking-tight"
            style={{ color: "#ffffff" }}
          >
            Prompt Gen
          </Link>
        </div>

        {/* Nav Links — client component handles active state via usePathname */}
        <DashboardSidebarNav links={navLinks} />

        {/* User Footer */}
        <div
          className="p-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--pg-admin-border)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: "var(--pg-brand)", boxShadow: "2px 2px 8px var(--pg-brand-glow)" }}
            >
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#e8eaf6" }}>
                {userName}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--pg-admin-sub)" }}>
                {userRole}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Desktop Top Header */}
        <header
          className="hidden md:flex h-16 flex-shrink-0 items-center justify-between px-8 sticky top-0 z-40"
          style={{
            background: "var(--pg-card)",
            boxShadow: "0 2px 10px var(--pg-shadow-dark)",
          }}
        >
          <div className="text-sm font-semibold" style={{ color: "var(--pg-text-sub)" }}>
            {t("overview")}
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Mobile Nav (topbar + bottom nav + drawer) */}
        <MobileDashboardNav
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          userInitial={userInitial}
        />

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto custom-scrollbar"
          style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="py-6 px-4 md:px-8 pg-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
