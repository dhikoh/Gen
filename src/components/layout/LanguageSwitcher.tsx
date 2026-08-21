"use client";

import { usePathname, Link } from "@/i18n/routing";
import { useLocale } from "next-intl";

export default function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const nextLocale = currentLocale === "id" ? "en" : "id";

  return (
    <Link
      href={pathname}
      locale={nextLocale}
      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      title={currentLocale === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
    >
      <span className="text-lg leading-none">🌐</span>
    </Link>
  );
}
