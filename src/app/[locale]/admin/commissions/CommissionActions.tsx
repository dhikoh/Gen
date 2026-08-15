"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function CommissionActions({ commissionId }: { commissionId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("AdminCommissions");

  const handleAction = async (action: "PAID" | "REJECTED") => {
    if (!confirm(t('confirmAction', { action }))) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/commissions/${commissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      
      if (res.ok) {
        router.refresh();
      } else {
        alert(t('processFail'));
      }
    } catch (err) {
      alert(t('systemError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <button 
        disabled={loading}
        onClick={() => handleAction("PAID")}
        className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded text-xs font-medium transition-colors disabled:opacity-50"
      >
        {t('markPaid')}
      </button>
      <button 
        disabled={loading}
        onClick={() => handleAction("REJECTED")}
        className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded text-xs font-medium transition-colors disabled:opacity-50"
      >
        {t('reject')}
      </button>
    </div>
  );
}
