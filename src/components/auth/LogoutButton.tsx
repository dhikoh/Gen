"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function LogoutButton() {
  const t = useTranslations("Dashboard");
  const params = useParams();
  const locale = params?.locale || "id";

  return (
    <button
      onClick={() => signOut({ callbackUrl: `/${locale}/auth` })}
      className="w-full flex items-center justify-center px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
    >
      {t('logout')}
    </button>
  );
}
