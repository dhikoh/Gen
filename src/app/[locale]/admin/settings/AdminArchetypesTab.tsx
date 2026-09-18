"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import {
  getNarrationModeLabel,
  getNarrationModeBadge,
  getDurationCalcModeBadge,
  getDurationCalcModeLabel,
} from "@/lib/enumMapping";

interface ContentArchetypeItem {
  id: string;
  name: string;
  description: string | null;
  narrationMode: "VOICE_OVER" | "DIEGETIC_ONLY" | "SILENT_TEXT_ONLY" | "HYBRID";
  emotionalArcTemplate: string;
  defaultIncludedSections: {
    hook: boolean;
    cta: boolean;
    caption: boolean;
    thumbnail: boolean;
  };
  compositionCategories: Array<{ label: string; required: boolean }>;
  durationCalcMode: "NARRATION_WORDCOUNT" | "SEGMENT_SELF_ESTIMATE" | "HYBRID";
  cameraMovementRoleMap?: Record<string, string[]> | null;
  isSystem: boolean;
  createdAt: string;
  _count?: {
    channels: number;
  };
}

export default function AdminArchetypesTab() {
  const t = useTranslations("AdminArchetypes");
  const tEnums = useTranslations("Enums");

  const [archetypes, setArchetypes] = useState<ContentArchetypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    narrationMode: "VOICE_OVER" as ContentArchetypeItem["narrationMode"],
    emotionalArcTemplate: "Hook -> Problem -> Solution -> CTA",
    defaultIncludedSections: {
      hook: true,
      cta: true,
      caption: true,
      thumbnail: true,
    },
    durationCalcMode: "HYBRID" as ContentArchetypeItem["durationCalcMode"],
  });

  const fetchArchetypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/content-archetypes");
      const data = await res.json();
      if (data.success && data.archetypes) {
        setArchetypes(data.archetypes);
      } else {
        toast.error(data.error || t("loadError"));
      }
    } catch {
      toast.error(t("loadNetworkError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/content-archetypes");
        const data = await res.json();
        if (data.success && !ignore) {
          setArchetypes(data.archetypes);
        } else if (!ignore) {
          toast.error(data.error || t("loadError"));
        }
      } catch {
        if (!ignore) toast.error(t("loadNetworkError"));
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [t]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      narrationMode: "VOICE_OVER",
      emotionalArcTemplate: "Hook -> Problem -> Solution -> CTA",
      defaultIncludedSections: {
        hook: true,
        cta: true,
        caption: true,
        thumbnail: true,
      },
      durationCalcMode: "HYBRID",
    });
    setModalOpen(true);
  };

  const openEditModal = (item: ContentArchetypeItem) => {
    setEditingId(item.id);
    const sections = item.defaultIncludedSections || {
      hook: true,
      cta: true,
      caption: true,
      thumbnail: true,
    };
    setFormData({
      name: item.name,
      description: item.description || "",
      narrationMode: item.narrationMode,
      emotionalArcTemplate: item.emotionalArcTemplate,
      defaultIncludedSections: {
        hook: sections.hook !== false,
        cta: sections.cta !== false,
        caption: sections.caption !== false,
        thumbnail: sections.thumbnail !== false,
      },
      durationCalcMode: item.durationCalcMode,
    });
    setModalOpen(true);
  };

  const handleDelete = async (item: ContentArchetypeItem) => {
    if (item.isSystem) {
      toast.error(t("deleteSystemForbidden"));
      return;
    }
    if (item._count && item._count.channels > 0) {
      toast.error(t("deleteInUse", { count: item._count.channels }));
      return;
    }
    if (!confirm(t("deleteConfirm", { name: item.name }))) return;

    try {
      const res = await fetch(`/api/admin/content-archetypes/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("deleteSuccess"));
        fetchArchetypes();
      } else {
        toast.error(data.error || t("deleteError"));
      }
    } catch {
      toast.error(t("deleteNetworkError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `/api/admin/content-archetypes/${editingId}`
        : "/api/admin/content-archetypes";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          narrationMode: formData.narrationMode,
          emotionalArcTemplate: formData.emotionalArcTemplate.trim(),
          defaultIncludedSections: formData.defaultIncludedSections,
          durationCalcMode: formData.durationCalcMode,
          compositionCategories:
            formData.narrationMode === "DIEGETIC_ONLY" || formData.narrationMode === "SILENT_TEXT_ONLY"
              ? []
              : [
                  { label: "Edukasi", required: true },
                  { label: "Hiburan", required: true },
                  { label: "Marketing", required: true },
                ],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? t("updateSuccess") : t("createSuccess"));
        setModalOpen(false);
        fetchArchetypes();
      } else {
        toast.error(data.error || t("saveError"));
      }
    } catch {
      toast.error(t("saveNetworkError"));
    } finally {
      setSubmitting(false);
    }
  };

  const editingItem = archetypes.find((a) => a.id === editingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold pg-text-heading">{t("title")}</h3>
          <p className="text-xs pg-text-muted mt-0.5">
            {t("desc")}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="neu-btn-brand px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          {t("addBtn")}
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center pg-text-muted text-sm pg-surface rounded-xl border pg-border">
          {t("loading")}
        </div>
      ) : archetypes.length === 0 ? (
        <div className="p-8 text-center pg-text-muted text-sm pg-surface rounded-xl border pg-border">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {archetypes.map((arch) => {
            const narrationBadge = getNarrationModeBadge(arch.narrationMode);
            const durationBadge = getDurationCalcModeBadge(arch.durationCalcMode);

            return (
              <div
                key={arch.id}
                className="pg-surface border pg-border rounded-xl p-5 shadow-sm space-y-3 glass-panel"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm pg-text-heading">{arch.name}</h4>
                      {arch.isSystem ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--pg-brand-light)] text-[var(--pg-brand)] border border-[var(--pg-brand)]/20">
                          {t("systemBadge")}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {t("customBadge")}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${narrationBadge.className}`}>
                        {narrationBadge.icon} {getNarrationModeLabel(arch.narrationMode, (k) => tEnums(k as Parameters<typeof tEnums>[0]))}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${durationBadge.className}`}>
                        {durationBadge.icon} {getDurationCalcModeLabel(arch.durationCalcMode, (k) => tEnums(k as Parameters<typeof tEnums>[0]))}
                      </span>
                    </div>
                    {arch.description && (
                      <p className="text-xs pg-text-muted mt-1">{arch.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(arch)}
                      className="neu-btn px-3 py-1 text-xs font-medium rounded-md transition-colors"
                    >
                      {t("edit")}
                    </button>
                    {!arch.isSystem && (
                      <button
                        type="button"
                        onClick={() => handleDelete(arch)}
                        className="px-3 py-1 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-md transition-colors"
                      >
                        {t("delete")}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 pg-surface-dim border pg-border rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold pg-text-sub shrink-0">{t("emotionalArc")}:</span>
                    <code className="text-[11px] pg-surface px-2 py-0.5 rounded border pg-border text-brand">
                      {arch.emotionalArcTemplate}
                    </code>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-[11px] pg-text-muted pt-1">
                    <span>
                      {t("activeComponents")}:{" "}
                      <strong>
                        {[
                          arch.defaultIncludedSections?.hook !== false && "Hook",
                          arch.defaultIncludedSections?.cta !== false && "CTA",
                          arch.defaultIncludedSections?.caption !== false && "Caption",
                          arch.defaultIncludedSections?.thumbnail !== false && "Thumbnail",
                        ]
                          .filter(Boolean)
                          .join(", ") || t("none")}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      {t("connectedTo")}: <strong>{t("channelsCount", { count: arch._count?.channels || 0 })}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Tambah / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="pg-surface border pg-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b pg-border pb-3">
              <h4 className="text-base font-bold pg-text-heading">
                {editingId
                  ? t("modalTitleEdit", { name: editingItem?.name || "" })
                  : t("modalTitleAdd")}
              </h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="pg-text-muted hover:pg-text-heading text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium pg-text-sub mb-1">
                  {t("nameLabel")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={editingItem?.isSystem}
                  placeholder={t("namePlaceholder")}
                  className="w-full p-2.5 pg-surface-dim border pg-border rounded-lg outline-none focus:ring-2 focus:ring-[var(--pg-brand)] pg-text-heading disabled:opacity-60"
                  required
                />
                {editingItem?.isSystem && (
                  <p className="text-[10px] text-amber-500 mt-1">{t("systemNameWarning")}</p>
                )}
              </div>

              <div>
                <label className="block font-medium pg-text-sub mb-1">{t("descLabel")}</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("descPlaceholder")}
                  className="w-full p-2.5 pg-surface-dim border pg-border rounded-lg outline-none focus:ring-2 focus:ring-[var(--pg-brand)] pg-text-heading"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium pg-text-sub mb-1">{t("narrationModeLabel")}</label>
                  <select
                    value={formData.narrationMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        narrationMode: e.target.value as ContentArchetypeItem["narrationMode"],
                      })
                    }
                    className="w-full p-2.5 pg-surface-dim border pg-border rounded-lg outline-none focus:ring-2 focus:ring-[var(--pg-brand)] pg-text-heading"
                  >
                    <option value="VOICE_OVER">VOICE_OVER ({getNarrationModeLabel("VOICE_OVER", (k) => tEnums(k as Parameters<typeof tEnums>[0]))})</option>
                    <option value="DIEGETIC_ONLY">DIEGETIC_ONLY ({getNarrationModeLabel("DIEGETIC_ONLY", (k) => tEnums(k as Parameters<typeof tEnums>[0]))})</option>
                    <option value="SILENT_TEXT_ONLY">SILENT_TEXT_ONLY ({getNarrationModeLabel("SILENT_TEXT_ONLY", (k) => tEnums(k as Parameters<typeof tEnums>[0]))})</option>
                    <option value="HYBRID">HYBRID ({getNarrationModeLabel("HYBRID", (k) => tEnums(k as Parameters<typeof tEnums>[0]))})</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium pg-text-sub mb-1">{t("durationCalcModeLabel")}</label>
                  <select
                    value={formData.durationCalcMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationCalcMode: e.target.value as ContentArchetypeItem["durationCalcMode"],
                      })
                    }
                    className="w-full p-2.5 pg-surface-dim border pg-border rounded-lg outline-none focus:ring-2 focus:ring-[var(--pg-brand)] pg-text-heading"
                  >
                    <option value="HYBRID">HYBRID ({getDurationCalcModeLabel("HYBRID", (k) => tEnums(k as Parameters<typeof tEnums>[0]))})</option>
                    <option value="SEGMENT_SELF_ESTIMATE">SEGMENT_SELF_ESTIMATE ({getDurationCalcModeLabel("SEGMENT_SELF_ESTIMATE", (k) => tEnums(k as Parameters<typeof tEnums>[0]))})</option>
                    <option value="NARRATION_WORDCOUNT">NARRATION_WORDCOUNT ({getDurationCalcModeLabel("NARRATION_WORDCOUNT", (k) => tEnums(k as Parameters<typeof tEnums>[0]))})</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium pg-text-sub mb-1">
                  {t("emotionalArcLabel")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.emotionalArcTemplate}
                  onChange={(e) => setFormData({ ...formData, emotionalArcTemplate: e.target.value })}
                  placeholder={t("emotionalArcPlaceholder")}
                  className="w-full p-2.5 pg-surface-dim border pg-border rounded-lg outline-none focus:ring-2 focus:ring-[var(--pg-brand)] pg-text-heading font-mono text-[11px]"
                  required
                />
                <p className="text-[10px] pg-text-muted mt-1">
                  {t("emotionalArcHint")}
                </p>
              </div>

              <div>
                <label className="block font-medium pg-text-sub mb-2">{t("defaultSectionsLabel")}</label>
                <div className="grid grid-cols-2 gap-2 pg-surface-dim p-3 rounded-lg border pg-border">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.defaultIncludedSections.hook}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultIncludedSections: {
                            ...formData.defaultIncludedSections,
                            hook: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-[var(--pg-brand)]"
                    />
                    <span>{t("includeHook")}</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.defaultIncludedSections.cta}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultIncludedSections: {
                            ...formData.defaultIncludedSections,
                            cta: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-[var(--pg-brand)]"
                    />
                    <span>{t("includeCta")}</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.defaultIncludedSections.caption}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultIncludedSections: {
                            ...formData.defaultIncludedSections,
                            caption: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-[var(--pg-brand)]"
                    />
                    <span>{t("includeCaption")}</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.defaultIncludedSections.thumbnail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultIncludedSections: {
                            ...formData.defaultIncludedSections,
                            thumbnail: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-[var(--pg-brand)]"
                    />
                    <span>{t("includeThumbnail")}</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t pg-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="neu-btn px-4 py-2 text-xs font-semibold rounded-lg pg-text-sub transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="neu-btn-brand px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? t("saving") : editingId ? t("saveChanges") : t("createBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
