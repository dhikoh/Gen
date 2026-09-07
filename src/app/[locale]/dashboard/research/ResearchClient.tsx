"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Channel {
  id: string;
  channelName: string;
  niche?: string | null;
  description?: string | null;
}

interface KeywordMetric {
  keyword: string;
  volume: "High" | "Medium" | "Low";
  competition: "Low" | "Medium" | "High";
  score: number;
  trendTag?: string;
}

interface ResearchResult {
  query: string;
  source: string;
  keywords: KeywordMetric[];
  recommendedTags: string[];
  contentAngles: string[];
  timestamp: string;
}

interface Props {
  channels: Channel[];
  locale: string;
}

export default function ResearchClient({ channels, locale }: Props) {
  const router = useRouter();
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  const handleChannelChange = (chId: string) => {
    setSelectedChannelId(chId);
    const ch = channels.find((c) => c.id === chId);
    if (ch && ch.niche && !searchQuery.trim()) {
      setSearchQuery(ch.niche);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryToUse = searchQuery.trim() || channels.find((c) => c.id === selectedChannelId)?.niche || "";
    if (!queryToUse) {
      toast.error("Masukkan topik atau pilih channel dengan niche terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/research/trends?query=${encodeURIComponent(queryToUse)}&channelId=${selectedChannelId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal melakukan riset tren.");
      }
      setResult(data.data);
      if (data.data?.keywords?.length > 0) {
        setSelectedKeywords([data.data.keywords[0].keyword]);
      }
      toast.success(`Ditemukan ${data.data?.keywords?.length || 0} kata kunci populer!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleKeywordSelection = (kw: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  };

  const handleCreateScriptWithKeyword = (kw: string) => {
    const allKeywords = Array.from(new Set([kw, ...selectedKeywords]));
    const url = `/${locale}/dashboard/generator?channelId=${selectedChannelId}&topic=${encodeURIComponent(kw)}&keywords=${encodeURIComponent(allKeywords.join(","))}`;
    router.push(url);
  };

  const handleCopyAllTags = () => {
    if (!result?.recommendedTags?.length) return;
    const tagText = result.recommendedTags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ");
    navigator.clipboard.writeText(tagText);
    toast.success("Seluruh tag berhasil disalin ke clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pg-border pb-4">
        <div>
          <h1 className="text-2xl font-bold pg-text-heading flex items-center gap-2">
            <span>🔍</span>
            <span>Riset Tren & Keyword SEO</span>
          </h1>
          <p className="text-xs pg-text-sub mt-1">
            Temukan kata kunci pencarian real-time YouTube & Google sebelum membuat naskah AI agar konten Anda mudah ditemukan algoritma.
          </p>
        </div>
        {channels.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="pg-text-sub font-medium">Channel:</span>
            <select
              value={selectedChannelId}
              onChange={(e) => handleChannelChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg border pg-border pg-surface text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.channelName} {c.niche ? `(${c.niche})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Search Bar ───────────────────────────────────── */}
      <form onSubmit={handleSearch} className="glass-panel p-4 rounded-xl shadow-sm space-y-3">
        <label className="block text-xs font-semibold pg-text-sub">
          Topik Konten atau Kata Kunci Utama
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Misal: Rubah Kutub, Tips Saham Pemula, Cara Belajar Coding..."
              className="w-full px-4 py-2.5 rounded-lg border pg-border bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin text-base">⏳</span>
                <span>Menganalisis Tren...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Analisis Kata Kunci</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Results Container ────────────────────────────── */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Tabel Kata Kunci (2 Kolom di Desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b pg-border pb-3">
                <div>
                  <h2 className="text-sm font-bold pg-text-heading flex items-center gap-2">
                    <span>📊</span>
                    <span>Kata Kunci Populer untuk &quot;{result.query}&quot;</span>
                  </h2>
                  <span className="text-[11px] pg-text-muted">
                    Sumber Data: {result.source === "VIDIQ_MCP" ? "vidIQ MCP Intelligence" : "Live YouTube Search Intelligence"}
                  </span>
                </div>
                {selectedKeywords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleCreateScriptWithKeyword(selectedKeywords[0])}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Buat Naskah ({selectedKeywords.length} Kata Kunci)</span>
                  </button>
                )}
              </div>

              {/* List / Table */}
              <div className="divide-y pg-border">
                {result.keywords.map((kw, idx) => {
                  const isSelected = selectedKeywords.includes(kw.keyword);
                  return (
                    <div
                      key={kw.keyword}
                      className={`py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg transition-colors ${
                        isSelected ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:pg-surface-dim"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleKeywordSelection(kw.keyword)}
                          className="mt-1 rounded cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                              {kw.keyword}
                            </span>
                            {kw.trendTag && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                {kw.trendTag}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] pg-text-muted">
                            <span className="flex items-center gap-1">
                              Volume:{" "}
                              <strong
                                className={
                                  kw.volume === "High"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-blue-600 dark:text-blue-400"
                                }
                              >
                                {kw.volume === "High" ? "🔥 Tinggi" : "⚡ Sedang"}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              Kompetisi:{" "}
                              <strong
                                className={
                                  kw.competition === "Low"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : kw.competition === "Medium"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-red-500"
                                }
                              >
                                {kw.competition === "Low" ? "🟢 Rendah" : kw.competition === "Medium" ? "🟡 Sedang" : "🔴 Tinggi"}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className="text-right hidden sm:block mr-2">
                          <span className="text-[10px] pg-text-muted block">Skor Peluang</span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {kw.score}/100
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCreateScriptWithKeyword(kw.keyword)}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <span>⚡</span>
                          <span>Pilih</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Ide Sudut Pandang & Tag (1 Kolom) */}
          <div className="space-y-4">
            {/* Kartu Content Angles */}
            <div className="glass-panel p-5 rounded-xl shadow-sm space-y-3">
              <h3 className="text-xs font-bold pg-text-heading flex items-center gap-1.5">
                <span>💡</span>
                <span>Rekomendasi Sudut Pandang Konten</span>
              </h3>
              <p className="text-[11px] pg-text-muted">
                Formula hook & sudut pandang yang sering memicu rasa penasaran tinggi pada topik ini:
              </p>
              <div className="space-y-2">
                {result.contentAngles.map((angle, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      const url = `/${locale}/dashboard/generator?channelId=${selectedChannelId}&topic=${encodeURIComponent(angle)}&keywords=${encodeURIComponent(selectedKeywords.join(","))}`;
                      router.push(url);
                    }}
                    className="p-2.5 rounded-lg border pg-border bg-slate-50/60 dark:bg-slate-800/40 text-xs hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                  >
                    <span className="font-medium">{angle}</span>
                    <span className="block text-[10px] text-blue-500 mt-1">
                      → Gunakan sebagai topik naskah
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kartu Tag Rekomendasi */}
            <div className="glass-panel p-5 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold pg-text-heading flex items-center gap-1.5">
                  <span>🏷️</span>
                  <span>Tag Populer</span>
                </h3>
                <button
                  type="button"
                  onClick={handleCopyAllTags}
                  className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Salin Semua Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.recommendedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border pg-border text-slate-700 dark:text-slate-300 rounded-md text-[11px]"
                  >
                    #{tag.replace(/\s+/g, "")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
