"use client";
import toast from "react-hot-toast";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function DraftActions({
  draftId,
  rawJson,
  locale,
  draftType,
  channelId,
  isTemplate,
}: {
  draftId: string;
  rawJson: string;
  locale: string;
  draftType?: string;
  channelId?: string | null;
  isTemplate?: boolean;
}) {
  const t = useTranslations('Drafts');
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDownloadJson = () => {
    try {
      let formattedJson = rawJson;
      try {
        const parsed = JSON.parse(rawJson);
        formattedJson = JSON.stringify(parsed, null, 2);
      } catch {
        // keep as is
      }
      const blob = new Blob([formattedJson], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `draft_prompt_${draftId.slice(-6)}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("downloadSuccess"));
    } catch {
      toast.error(t("downloadError"));
    }
  };

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
      if (!res.ok) throw new Error(t('deleteFail'));
      router.push(`/${locale}/dashboard/drafts`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('systemError'));
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {draftType === "VIDEO" && (
        <Link
          href={`/${locale}/dashboard/scene-prompt?draftId=${draftId}`}
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
        >
          <span>🎙️</span> {t('openInSceneStudio')}
        </Link>
      )}
      {isTemplate && (
        <Link
          href={`/${locale}/dashboard/generator?templateId=${draftId}${channelId ? `&channelId=${channelId}` : ''}`}
          className="px-4 py-2 text-sm font-semibold text-amber-900 bg-amber-400 hover:bg-amber-500 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
        >
          <span>✨</span> {t('applyTemplate')}
        </Link>
      )}
      <button
        onClick={handleDownloadJson}
        className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
      >
        <span>⬇️</span> Download JSON
      </button>
      <button 
        onClick={handleCopy}
        className="px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors neu-btn pg-text-sub"
      >
        {copied ? t('copied') : t('copyRawJson')}
      </button>
      <button 
        onClick={handleDelete}
        disabled={deleting}
        className="px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50" style={{ color: 'var(--pg-danger)', background: 'rgba(225,112,85,0.08)', border: '1px solid rgba(225,112,85,0.25)' }}
      >
        {deleting ? t('deleting') : t('delete')}
      </button>
    </div>
  );
}
