"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

export interface DraftPerformanceData {
  id?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  avgWatchTimeSec?: number | null;
  retentionPct?: number | null;
  notes?: string | null;
  recordedAt?: string | Date;
}

interface DraftPerformanceFormProps {
  draftId: string;
  initialPerformance?: DraftPerformanceData | null;
}

export default function DraftPerformanceForm({
  draftId,
  initialPerformance,
}: DraftPerformanceFormProps) {
  const t = useTranslations("Drafts");
  const [performance, setPerformance] = useState<DraftPerformanceData | null>(
    initialPerformance || null
  );
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    views: performance?.views !== undefined ? String(performance.views) : "",
    likes: performance?.likes !== undefined ? String(performance.likes) : "",
    comments: performance?.comments !== undefined ? String(performance.comments) : "",
    shares: performance?.shares !== undefined ? String(performance.shares) : "",
    avgWatchTimeSec:
      performance?.avgWatchTimeSec !== undefined && performance.avgWatchTimeSec !== null
        ? String(performance.avgWatchTimeSec)
        : "",
    retentionPct:
      performance?.retentionPct !== undefined && performance.retentionPct !== null
        ? String(performance.retentionPct)
        : "",
    notes: performance?.notes || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      views: parseInt(formData.views, 10) || 0,
      likes: parseInt(formData.likes, 10) || 0,
      comments: parseInt(formData.comments, 10) || 0,
      shares: parseInt(formData.shares, 10) || 0,
      avgWatchTimeSec: formData.avgWatchTimeSec ? parseFloat(formData.avgWatchTimeSec) : null,
      retentionPct: formData.retentionPct ? parseFloat(formData.retentionPct) : null,
      notes: formData.notes.trim() || null,
    };

    try {
      const res = await fetch(`/api/drafts/${draftId}/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(t("performanceRecorded"));
        setPerformance(data.data);
        setIsOpen(false);
      } else {
        toast.error(data.error || t("performanceError"));
      }
    } catch {
      toast.error(t("generalError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus data performa naskah ini?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/performance`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(t("performanceDeleted"));
        setPerformance(null);
        setFormData({
          views: "",
          likes: "",
          comments: "",
          shares: "",
          avgWatchTimeSec: "",
          retentionPct: "",
          notes: "",
        });
        setIsOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || t("generalError"));
      }
    } catch {
      toast.error(t("generalError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-xl space-y-4 border pg-border">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">📈</span>
            <h3 className="text-sm font-bold pg-text-heading">
              {t("performanceBadge")} (Closed-Loop Learning)
            </h3>
            {performance && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ✓ Tercatat
              </span>
            )}
          </div>
          <p className="text-[11px] pg-text-muted mt-0.5">
            {t("closedLoopNotice")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
        >
          <span>{isOpen ? "✕ Tutup" : performance ? "✏️ " + t("editPerformance") : "➕ " + t("recordPerformance")}</span>
        </button>
      </div>

      {/* Metrics Card Preview */}
      {performance && !isOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border pg-border">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
              {t("views")}
            </span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {performance.views.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border pg-border">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
              {t("retentionPct")}
            </span>
            <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {performance.retentionPct !== null && performance.retentionPct !== undefined
                ? `${performance.retentionPct}%`
                : "—"}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border pg-border">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
              {t("likes")} / {t("comments")}
            </span>
            <p className="text-sm font-bold pg-text-heading mt-0.5">
              {performance.likes.toLocaleString()} / {performance.comments.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border pg-border">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
              {t("avgWatchTime")}
            </span>
            <p className="text-sm font-bold pg-text-heading mt-0.5">
              {performance.avgWatchTimeSec ? `${performance.avgWatchTimeSec}s` : "—"}
            </p>
          </div>

          {performance.notes && (
            <div className="col-span-2 sm:col-span-4 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="font-semibold">{t("performanceNotes")}:</span> {performance.notes}
            </div>
          )}
        </div>
      )}

      {/* Form Input */}
      {isOpen && (
        <form onSubmit={handleSave} className="space-y-4 pt-3 border-t pg-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold pg-text-sub mb-1">
                👁️ {t("views")} *
              </label>
              <input
                type="number"
                name="views"
                required
                min="0"
                value={formData.views}
                onChange={handleChange}
                placeholder="Misal: 45000"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold pg-text-sub mb-1">
                ⏱️ {t("retentionPct")} (0-100%)
              </label>
              <input
                type="number"
                name="retentionPct"
                min="0"
                max="100"
                step="0.1"
                value={formData.retentionPct}
                onChange={handleChange}
                placeholder="Misal: 68.5"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold pg-text-sub mb-1">
                ⏳ {t("avgWatchTime")}
              </label>
              <input
                type="number"
                name="avgWatchTimeSec"
                min="0"
                step="0.1"
                value={formData.avgWatchTimeSec}
                onChange={handleChange}
                placeholder="Misal: 38"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold pg-text-sub mb-1">
                👍 {t("likes")}
              </label>
              <input
                type="number"
                name="likes"
                min="0"
                value={formData.likes}
                onChange={handleChange}
                placeholder="Misal: 3200"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold pg-text-sub mb-1">
                💬 {t("comments")}
              </label>
              <input
                type="number"
                name="comments"
                min="0"
                value={formData.comments}
                onChange={handleChange}
                placeholder="Misal: 140"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold pg-text-sub mb-1">
                🔗 {t("shares")}
              </label>
              <input
                type="number"
                name="shares"
                min="0"
                value={formData.shares}
                onChange={handleChange}
                placeholder="Misal: 85"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold pg-text-sub mb-1">
              📝 {t("performanceNotes")}
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder={t("performanceNotesPlaceholder")}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div>
              {performance && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors disabled:opacity-50"
                >
                  {deleting ? "Menghapus..." : t("deletePerformance")}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border pg-border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : t("savePerformance")}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
