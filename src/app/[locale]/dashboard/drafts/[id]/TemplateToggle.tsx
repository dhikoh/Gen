"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function TemplateToggle({ draftId, initialIsTemplate }: { draftId: string, initialIsTemplate: boolean }) {
  const [isTemplate, setIsTemplate] = useState(initialIsTemplate);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("Drafts");

  const toggleTemplate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTemplate: !isTemplate })
      });
      
      if (res.ok) {
        setIsTemplate(!isTemplate);
        router.refresh();
      } else {
        alert(t('updateError'));
      }
    } catch (err) {
      alert(t('generalError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleTemplate}
      disabled={loading}
      className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors ${
        isTemplate 
          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50" 
          : "bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
      }`}
    >
      {loading ? t('saving') : isTemplate ? t('templateSaved') : t('saveAsTemplate')}
    </button>
  );
}
