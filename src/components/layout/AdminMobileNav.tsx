"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useParams } from "next/navigation";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

interface NavLink {
  href: string;
  icon: string;
  label: string;
  badge: number;
}

interface Props {
  links: NavLink[];
  adminName: string;
  adminInitial: string;
  adminRole: string;
}

export default function AdminMobileNav({ links, adminName, adminInitial, adminRole }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || "id";

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => {
    if (href.endsWith("/admin")) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Mobile Topbar ─────────────────────────────── */}
      <header
        className="md:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4 flex-shrink-0"
        style={{
          background: "var(--pg-admin-bg)",
          boxShadow: "0 3px 12px rgba(0,0,0,0.4)",
        }}
      >
        <Link href={`/${locale}/admin`} className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg, var(--pg-brand) 0%, #c94d00 100%)" }}
          >
            ⚡
          </span>
          <span className="font-bold text-sm tracking-tight text-white">Admin Portal</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="text-white">
            <LanguageSwitcher />
          </div>
          {/* Hamburger */}
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl border-none bg-transparent"
            aria-label="Open menu"
            style={{ color: "white" }}
          >
            <span className="w-5 h-0.5 rounded-full bg-current" />
            <span className="w-5 h-0.5 rounded-full bg-current" />
            <span className="w-4 h-0.5 rounded-full bg-current" />
          </button>
        </div>
      </header>

      {/* ── Backdrop ──────────────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-in Sidebar Drawer ───────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 bottom-0 z-[70] w-72 flex flex-col transition-transform duration-300"
        style={{
          background: "var(--pg-admin-bg)",
          boxShadow: "8px 0 32px rgba(0,0,0,0.5)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
      >
        {/* Header */}
        <div
          className="h-16 flex items-center justify-between px-5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--pg-admin-border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, var(--pg-brand) 0%, #c94d00 100%)" }}
            >
              ⚡
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-none">Admin Portal</p>
              <p className="text-[10px] mt-0.5 font-medium" style={{ color: "var(--pg-brand)" }}>
                Prompt Gen
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white bg-transparent border-none transition-colors"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Section label */}
        <div className="px-4 pt-4 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--pg-admin-sub)" }}>
            System Management
          </p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5 custom-scrollbar">
          {links.map(({ href, icon, label, badge }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  color: active ? "#ffffff" : "var(--pg-admin-sub)",
                  background: active ? "rgba(255,118,0,0.18)" : "transparent",
                  borderLeft: active ? "3px solid var(--pg-brand)" : "3px solid transparent",
                }}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </span>
                {badge > 0 && (
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold rounded-full text-white"
                    style={{ background: "var(--pg-brand)" }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div
          className="p-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--pg-admin-border)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--pg-brand) 0%, #c94d00 100%)" }}
            >
              {adminInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#e8eaf6" }}>
                {adminName}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--pg-brand)" }}>
                {adminRole}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: `/${locale}/auth` })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all neu-btn"
            style={{ color: "var(--pg-danger)" }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
}
