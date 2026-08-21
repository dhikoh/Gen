"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
  href: string;
  icon: string;
  label: string;
}

export default function DashboardSidebarNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Exact match for overview
    if (href.endsWith("/dashboard")) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
      {links.map(({ href, icon, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              color: active ? "#ffffff" : "var(--pg-admin-sub)",
              background: active
                ? "rgba(255,118,0,0.18)"
                : "transparent",
              borderLeft: active
                ? "3px solid var(--pg-brand)"
                : "3px solid transparent",
            }}
          >
            <span className="mr-3 text-base">{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
