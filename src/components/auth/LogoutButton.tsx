"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { clearAllUserScopedStorage } from "@/lib/clientStorage";
import { clearSensitiveCaches } from "@/lib/clearSensitiveCaches";

export default function LogoutButton() {
  const t = useTranslations("Dashboard");
  const params = useParams();
  const locale = (params?.locale as string) || "id";

  const handleLogout = async () => {
    try {
      await fetch("/api/user/google-drive/disconnect", { method: "POST" }).catch(() => null);
      clearAllUserScopedStorage();
      await clearSensitiveCaches();
    } catch {
      // Abaikan agar logout tidak terhambat
    }
    await signOut({ callbackUrl: `/${locale}/auth` });
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all neu-btn"
      style={{ color: "var(--pg-danger)" }}
    >
      🚪 {t("logout")}
    </button>
  );
}
