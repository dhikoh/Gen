"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export function RemotionUpgradeCard() {
  const t = useTranslations("RemotionStudio");
  return (
    <div className="glass-panel rounded-xl p-6 text-center" role="region" aria-label={t("upgradeTitle")}>
      <h3 className="pg-text-heading text-lg font-semibold">⚛️ {t("upgradeTitle")}</h3>
      <p className="pg-text-muted mt-2 text-sm">{t("upgradeDescription")}</p>
      <Link href="/dashboard/billing" className="pg-border mt-4 inline-block rounded-lg border px-4 py-2 text-sm font-medium">
        {t("upgradeCta")}
      </Link>
    </div>
  );
}
