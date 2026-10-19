"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { channelBundleSchema, type ChannelBundle } from "@/lib/channelBundle";

interface ImportChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  canAddMore: boolean;
  maxChannels: number;
  currentCount: number;
}

export default function ImportChannelModal({
  isOpen,
  onClose,
  onSuccess,
  canAddMore,
  maxChannels,
  currentCount,
}: ImportChannelModalProps) {
  const t = useTranslations("Channels");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBundle, setParsedBundle] = useState<ChannelBundle | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setParseError(null);
    setParsedBundle(null);
    setSelectedFile(file);

    if (!file.name.endsWith(".json")) {
      setParseError(t("invalidJsonExtension"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        const validated = channelBundleSchema.safeParse(json);

        if (!validated.success) {
          console.error("Bundle validation error:", validated.error);
          setParseError(t("invalidBundleFormat"));
          return;
        }

        setParsedBundle(validated.data);
      } catch (err) {
        console.error("JSON parse error:", err);
        setParseError(t("invalidJsonContent"));
      }
    };
    reader.onerror = () => {
      setParseError(t("fileReadError"));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!parsedBundle) return;
    if (!canAddMore) {
      toast.error(t("channelQuotaExceeded", { max: maxChannels }));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/channels/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedBundle),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("importFail"));
      }

      toast.success(
        t("importSuccess", { name: parsedBundle.channel.channelName })
      );
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl p-6 pg-surface border pg-border rounded-2xl shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b pg-border pb-4">
          <div>
            <h3 className="text-lg font-bold pg-text-heading flex items-center gap-2">
              <span>📥</span> {t("importModalTitle")}
            </h3>
            <p className="text-xs pg-text-muted mt-1">{t("importModalDesc")}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg pg-text-muted hover:pg-text-sub hover:pg-surface-dim transition-colors"
            aria-label={t("cancel")}
          >
            ✕
          </button>
        </div>

        {/* Quota Notice if limited */}
        {!canAddMore && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 dark:text-amber-400">
            ⚠️ {t("channelQuotaExceeded", { max: maxChannels })} ({currentCount}/{maxChannels})
          </div>
        )}

        {/* Drag & Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "pg-border pg-surface-dim hover:border-blue-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="text-3xl mb-2">📁</div>
          <p className="text-sm font-semibold pg-text-heading">
            {selectedFile ? selectedFile.name : t("dropJsonFile")}
          </p>
          <p className="text-xs pg-text-muted mt-1">{t("selectJsonFile")}</p>
        </div>

        {/* Error Feedback */}
        {parseError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <span>❌</span> {parseError}
          </div>
        )}

        {/* Rich Preview Card if Parsed Successfully */}
        {parsedBundle && !parseError && (
          <div className="p-4 rounded-xl border pg-border pg-surface-dim space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider pg-text-muted">
                {t("previewChannel")}
              </h4>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                v{parsedBundle.version} Bundle
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-base font-bold pg-text-heading flex items-center gap-2">
                {parsedBundle.channel.channelName}
                {parsedBundle.channel.targetPlatform && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {parsedBundle.channel.targetPlatform}
                  </span>
                )}
              </div>
              {parsedBundle.channel.niche && (
                <p className="text-xs pg-text-sub font-medium">
                  {parsedBundle.channel.niche}
                </p>
              )}
              {parsedBundle.channel.description && (
                <p className="text-xs pg-text-muted line-clamp-2">
                  {parsedBundle.channel.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t pg-border text-center">
              <div className="p-2 rounded-lg pg-surface border pg-border">
                <span className="block text-xs pg-text-muted">
                  {t("previewProducts")}
                </span>
                <span className="text-sm font-bold pg-text-heading">
                  {parsedBundle.products?.length || 0}
                </span>
              </div>
              <div className="p-2 rounded-lg pg-surface border pg-border">
                <span className="block text-xs pg-text-muted">
                  {t("previewUsedTitles")}
                </span>
                <span className="text-sm font-bold pg-text-heading">
                  {parsedBundle.usedTitles?.length || 0}
                </span>
              </div>
              <div className="p-2 rounded-lg pg-surface border pg-border">
                <span className="block text-xs pg-text-muted">
                  {t("previewGeneratorSettings")}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                  {parsedBundle.generatorSettings ? `✅ ${t("included")}` : `— ${t("notIncluded")}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-lg pg-surface-dim pg-text-sub hover:pg-surface transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!parsedBundle || !canAddMore || isSubmitting}
            className="pg-btn-primary min-h-[36px] px-5 py-2 text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t("importing")}
              </>
            ) : (
              <>
                <span>🚀</span> {t("importChannelJson")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
