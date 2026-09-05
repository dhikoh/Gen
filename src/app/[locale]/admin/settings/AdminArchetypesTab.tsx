"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

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
        toast.error(data.error || "Gagal memuat model konten");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat memuat model konten");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchetypes();
  }, [fetchArchetypes]);

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
      toast.error("Model konten bawaan sistem tidak dapat dihapus");
      return;
    }
    if (item._count && item._count.channels > 0) {
      toast.error(`Tidak dapat menghapus: Masih digunakan oleh ${item._count.channels} channel`);
      return;
    }
    if (!confirm(`Yakin ingin menghapus model konten "${item.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/content-archetypes/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Model konten berhasil dihapus");
        fetchArchetypes();
      } else {
        toast.error(data.error || "Gagal menghapus model konten");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menghapus");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama model konten wajib diisi");
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
        toast.success(editingId ? "Model konten berhasil diperbarui" : "Model konten berhasil dibuat");
        setModalOpen(false);
        fetchArchetypes();
      } else {
        toast.error(data.error || "Gagal menyimpan model konten");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const editingItem = archetypes.find((a) => a.id === editingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold pg-text-heading">Manajemen Model Konten (Archetypes)</h3>
          <p className="text-xs pg-text-muted mt-0.5">
            Kelola template alur emosi, mode suara (VO vs Diegetic), dan komponen naskah bawaan channel.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          + Tambah Model Konten
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center pg-text-muted text-sm pg-surface rounded-xl border pg-border">
          Memuat daftar model konten...
        </div>
      ) : archetypes.length === 0 ? (
        <div className="p-8 text-center pg-text-muted text-sm pg-surface rounded-xl border pg-border">
          Belum ada model konten. Silakan tambahkan model konten pertama Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {archetypes.map((arch) => (
            <div
              key={arch.id}
              className="pg-surface border pg-border rounded-xl p-5 shadow-sm space-y-3 glass-panel"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm pg-text-heading">{arch.name}</h4>
                    {arch.isSystem ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                        SISTEM
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        KUSTOM
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 pg-text-sub border pg-border">
                      {arch.narrationMode === "VOICE_OVER" && "🎙️ Voice Over"}
                      {arch.narrationMode === "DIEGETIC_ONLY" && "🔇 Diegetik Murni"}
                      {arch.narrationMode === "SILENT_TEXT_ONLY" && "📄 Teks Saja"}
                      {arch.narrationMode === "HYBRID" && "🔀 Hybrid"}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      ⏱️ {arch.durationCalcMode}
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
                    className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 pg-text-heading rounded-md transition-colors"
                  >
                    Edit
                  </button>
                  {!arch.isSystem && (
                    <button
                      type="button"
                      onClick={() => handleDelete(arch)}
                      className="px-3 py-1 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-400 rounded-md transition-colors"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border pg-border rounded-lg text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold pg-text-sub shrink-0">Alur Emosi:</span>
                  <code className="text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border pg-border text-purple-700 dark:text-purple-300">
                    {arch.emotionalArcTemplate}
                  </code>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-[11px] pg-text-muted pt-1">
                  <span>
                    Komponen Aktif:{" "}
                    <strong>
                      {[
                        arch.defaultIncludedSections?.hook !== false && "Hook",
                        arch.defaultIncludedSections?.cta !== false && "CTA",
                        arch.defaultIncludedSections?.caption !== false && "Caption",
                        arch.defaultIncludedSections?.thumbnail !== false && "Thumbnail",
                      ]
                        .filter(Boolean)
                        .join(", ") || "Tidak ada"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Terhubung ke: <strong>{arch._count?.channels || 0} Channel</strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Tambah / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border pg-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b pg-border pb-3">
              <h4 className="text-base font-bold pg-text-heading">
                {editingId ? `Edit Model Konten: ${editingItem?.name}` : "Tambah Model Konten Baru"}
              </h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium pg-text-sub mb-1">
                  Nama Model Konten <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={editingItem?.isSystem}
                  placeholder="e.g. Edukasi Storytelling, Nostalgia Reconstruction"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border pg-border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 pg-text-heading disabled:opacity-60"
                  required
                />
                {editingItem?.isSystem && (
                  <p className="text-[10px] text-amber-500 mt-1">Nama model bawaan sistem tidak dapat diubah.</p>
                )}
              </div>

              <div>
                <label className="block font-medium pg-text-sub mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Penjelasan ringkas tentang karakteristik dan tujuan model konten ini..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border pg-border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 pg-text-heading"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium pg-text-sub mb-1">Mode Narasi & Audio</label>
                  <select
                    value={formData.narrationMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        narrationMode: e.target.value as ContentArchetypeItem["narrationMode"],
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border pg-border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 pg-text-heading"
                  >
                    <option value="VOICE_OVER">VOICE_OVER (Narator Suara)</option>
                    <option value="DIEGETIC_ONLY">DIEGETIC_ONLY (Suara In-Scene Murni)</option>
                    <option value="SILENT_TEXT_ONLY">SILENT_TEXT_ONLY (Teks di Layar Saja)</option>
                    <option value="HYBRID">HYBRID (Kombinasi VO + Diegetic)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium pg-text-sub mb-1">Metode Kalkulasi Durasi</label>
                  <select
                    value={formData.durationCalcMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationCalcMode: e.target.value as ContentArchetypeItem["durationCalcMode"],
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border pg-border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 pg-text-heading"
                  >
                    <option value="HYBRID">HYBRID (Segmen + Wordcount)</option>
                    <option value="SEGMENT_SELF_ESTIMATE">SEGMENT_SELF_ESTIMATE (Durasi Adegan)</option>
                    <option value="NARRATION_WORDCOUNT">NARRATION_WORDCOUNT (Hitung Kata VO)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium pg-text-sub mb-1">
                  Template Alur Emosi (Emotional Arc Template) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.emotionalArcTemplate}
                  onChange={(e) => setFormData({ ...formData, emotionalArcTemplate: e.target.value })}
                  placeholder="e.g. Hook -> Problem -> Solution -> CTA"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border pg-border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 pg-text-heading font-mono text-[11px]"
                  required
                />
                <p className="text-[10px] pg-text-muted mt-1">
                  Urutan segmen emosional yang diinstruksikan kepada AI (misal: <code>Setup -&gt; Recognition -&gt; Emotional Payoff</code>).
                </p>
              </div>

              <div>
                <label className="block font-medium pg-text-sub mb-2">Komponen Naskah Bawaan (Default Included Sections)</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border pg-border">
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
                      className="rounded"
                    />
                    <span>Sertakan Hook</span>
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
                      className="rounded"
                    />
                    <span>Sertakan Call to Action (CTA)</span>
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
                      className="rounded"
                    />
                    <span>Sertakan Social Caption</span>
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
                      className="rounded"
                    />
                    <span>Sertakan Ide Thumbnail</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t pg-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg pg-text-sub transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Model Konten"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
