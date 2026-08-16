"use client";
import toast from "react-hot-toast";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function DraftActions({ draftId, rawJson, locale }: { draftId: string; rawJson: string; locale: string }) {
  const t = useTranslations('Drafts');
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete'))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus draft");
      router.push(`/${locale}/dashboard/drafts`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
      setDeleting(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleCopy}
        className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 shadow-sm transition-colors"
      >
        {copied ? t('copied') : t('copyRawJson')}
      </button>
      <button 
        onClick={handleDelete}
        disabled={deleting}
        className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 dark:bg-zinc-800 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/20 shadow-sm transition-colors disabled:opacity-50"
      >
        {deleting ? t('deleting') : t('delete')}
      </button>
    </>
  );
}
