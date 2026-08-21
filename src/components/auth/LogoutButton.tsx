"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function LogoutButton() {
  const t = useTranslations("Dashboard");
  const params = useParams();
  const locale = (params?.locale as string) || "id";

  return (
    <button
      onClick={() => signOut({ callbackUrl: `/${locale}/auth` })}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all neu-btn"
      style={{ color: "var(--pg-danger)" }}
    >
      🚪 {t("logout")}
    </button>
  );
}
