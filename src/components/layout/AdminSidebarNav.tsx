"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
  href: string;
  icon: string;
  label: string;
  badge: number;
}

export default function AdminSidebarNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href.endsWith("/admin")) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5 custom-scrollbar">
      {links.map(({ href, icon, label, badge }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              color: active ? "#ffffff" : "var(--pg-admin-sub)",
              background: active ? "rgba(255,118,0,0.18)" : "transparent",
              borderLeft: active ? "3px solid var(--pg-brand)" : "3px solid transparent",
            }}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base">{icon}</span>
              <span className="group-hover:text-white transition-colors">{label}</span>
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
  );
}
