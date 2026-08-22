"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link as IntlLink } from "@/i18n/routing";
import NotificationBell from "@/components/notifications/NotificationBell";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

// ── Icons (inline SVG — no extra dep) ───────────────────────────
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <polyline points="9 21 9 12 15 12 15 21"/>
  </svg>
);
const DraftsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const WandIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M15 4V2"/>
    <path d="M15 16v-2"/>
    <path d="M8 9h2"/>
    <path d="M20 9h2"/>
    <path d="M17.8 11.8 19 13"/>
    <path d="M15 9h0"/>
    <path d="M17.8 6.2 19 5"/>
    <path d="m3 21 9-9"/>
    <path d="M12.2 6.2 11 5"/>
  </svg>
);
const ChannelsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
    <polyline points="17 2 12 7 7 2"/>
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── Drawer menu items ────────────────────────────────────────────
const DRAWER_ITEMS = [
  { key: "scene-prompt",   icon: "🎬", labelKey: "scenePromptStudio", href: (l: string) => `/${l}/dashboard/scene-prompt` },
  { key: "billing",        icon: "💳", labelKey: "billing",            href: (l: string) => `/${l}/dashboard/billing` },
  { key: "notifications",  icon: "🔔", labelKey: "notifications",      href: (l: string) => `/${l}/dashboard/notifications` },
  { key: "support",        icon: "🆘", labelKey: "support",            href: (l: string) => `/${l}/dashboard/support` },
  { key: "panduan",        icon: "📖", labelKey: "guide",              href: (l: string) => `/${l}/dashboard/panduan` },
];

interface Props {
  userName: string;
  userEmail: string;
  userRole: string;
  userInitial: string;
}

export default function MobileDashboardNav({ userName, userEmail, userRole, userInitial }: Props) {
  const t = useTranslations("Dashboard");
  const params = useParams();
  const locale = (params?.locale as string) || "id";
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Close drawer on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const isActive = useCallback((href: string) => {
    if (href === `/${locale}/dashboard`) return pathname === `/${locale}/dashboard`;
    return pathname.startsWith(href);
  }, [pathname, locale]);

  const NAV_ITEMS = [
    { key: "home",     Icon: HomeIcon,     label: t("overview"),   href: `/${locale}/dashboard` },
    { key: "drafts",   Icon: DraftsIcon,   label: t("drafts"),     href: `/${locale}/dashboard/drafts` },
    { key: "channels", Icon: ChannelsIcon, label: t("channels"),   href: `/${locale}/dashboard/channels` },
  ];

  return (
    <>
      {/* ── Mobile Topbar ─────────────────────────────── */}
      <header
        className="md:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4"
        style={{
          background: "var(--pg-card)",
          boxShadow: "0 3px 10px var(--pg-shadow-dark), 0 -1px 0 var(--pg-shadow-light)",
        }}
      >
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "var(--pg-brand)" }}
          >
            ✨
          </span>
          <span className="font-bold text-base tracking-tight" style={{ color: "var(--pg-text)" }}>
            Prompt Gen
          </span>
        </Link>
        {/* Topbar Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {/* NotificationBell with real-time unread badge */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ boxShadow: "var(--pg-neu-sm)", background: "var(--pg-card)" }}
          >
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* ── Bottom Navigation ─────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
        style={{
          background: "var(--pg-card)",
          boxShadow: "0 -4px 16px var(--pg-shadow-dark), 0 1px 0 var(--pg-shadow-light)",
        }}
      >
        <div className="flex items-center justify-around px-2 h-16 relative">
          {/* Home */}
          {NAV_ITEMS.slice(0, 2).map(({ key, Icon, label, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={key}
                href={href}
                className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] gap-0.5 transition-all"
                style={{ color: active ? "var(--pg-brand)" : "var(--pg-text-sub)" }}
              >
                <span className={active ? "scale-110 transition-transform" : "transition-transform"}>
                  <Icon />
                </span>
                <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap truncate px-1 max-w-full text-center">{label}</span>
                {active && (
                  <span
                    className="absolute bottom-0 w-6 h-0.5 rounded-full"
                    style={{ background: "var(--pg-brand)" }}
                  />
                )}
              </Link>
            );
          })}

          {/* Center FAB — Generator */}
          <div className="flex-shrink-0 relative -top-4">
            <Link
              href={`/${locale}/dashboard/generator`}
              className="pg-pulse flex items-center justify-center w-14 h-14 rounded-2xl text-white"
              style={{
                background: isActive(`/${locale}/dashboard/generator`)
                  ? "var(--pg-brand-hover)"
                  : "var(--pg-brand)",
                boxShadow: "0 4px 16px var(--pg-brand-glow), 4px 4px 10px var(--pg-shadow-dark), -2px -2px 6px var(--pg-shadow-light)",
              }}
              aria-label="Generator"
            >
              <WandIcon />
            </Link>
          </div>

          {/* Channels */}
          {NAV_ITEMS.slice(2).map(({ key, Icon, label, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={key}
                href={href}
                className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] gap-0.5 transition-all"
                style={{ color: active ? "var(--pg-brand)" : "var(--pg-text-sub)" }}
              >
                <span className={active ? "scale-110 transition-transform" : "transition-transform"}>
                  <Icon />
                </span>
                <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap truncate px-1 max-w-full text-center">{label}</span>
                {active && (
                  <span
                    className="absolute bottom-0 w-6 h-0.5 rounded-full"
                    style={{ background: "var(--pg-brand)" }}
                  />
                )}
              </Link>
            );
          })}

          {/* Profile — opens drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] gap-0.5 transition-all border-none bg-transparent"
            style={{ color: drawerOpen ? "var(--pg-brand)" : "var(--pg-text-sub)" }}
          >
            <UserIcon />
            <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap truncate px-1 max-w-full text-center">{t("profile") || "Profil"}</span>
          </button>
        </div>
      </nav>

      {/* ── Profile Drawer Backdrop ────────────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Profile Drawer ─────────────────────────────── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-[70] transition-all duration-300 max-h-[85vh] flex flex-col"
        style={{
          transform: drawerOpen ? "translateY(0)" : "translateY(110%)",
          background: "var(--pg-card)",
          borderRadius: "22px 22px 0 0",
          boxShadow: "0 -8px 32px var(--pg-shadow-dark)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Profile menu"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "var(--pg-shadow-dark)" }}
          />
        </div>

        {/* User Info */}
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--pg-shadow-dark)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "var(--pg-brand)", boxShadow: "3px 3px 8px var(--pg-brand-glow)" }}
            >
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: "var(--pg-text)" }}>
                {userName}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--pg-text-sub)" }}>
                {userEmail}
              </p>
              <span
                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 text-white"
                style={{ background: "var(--pg-brand)", letterSpacing: "0.05em" }}
              >
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1 pb-safe">
          {/* Drawer Items */}
          <div className="px-4 py-3 space-y-1">
            {DRAWER_ITEMS.map((item) => {
              const href = item.href(locale);
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={item.key}
                  href={href}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active ? "var(--pg-brand-light)" : "transparent",
                    color: active ? "var(--pg-brand)" : "var(--pg-text)",
                    boxShadow: active ? "var(--pg-neu-sm)" : "none",
                  }}
                >
                  <span className="text-lg w-6 text-center">{item.icon}</span>
                  <span>{t(item.labelKey as any) || item.labelKey}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--pg-brand)" }} />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="px-4 pb-4">
            <div className="border-t my-2" style={{ borderColor: "var(--pg-shadow-dark)" }} />
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/auth` })}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                color: "var(--pg-danger)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span className="text-lg w-6 text-center">🚪</span>
              <span>{t("logout")}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
