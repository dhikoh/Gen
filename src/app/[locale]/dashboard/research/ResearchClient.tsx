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

  const handleCopyHashtags = () => {
    if (!result?.recommendedTags?.length) return;
    const tagText = result.recommendedTags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ");
    navigator.clipboard.writeText(tagText);
    toast.success("Hashtag (#) disalin untuk Deskripsi Video!");
  };

  const handleCopyCommaTags = () => {
    if (!result?.recommendedTags?.length) return;
    const tagText = result.recommendedTags.join(", ");
    navigator.clipboard.writeText(tagText);
    toast.success("Tag Koma (,) disalin untuk YouTube Studio!");
  };

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pg-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold pg-text-heading flex items-center gap-2">
            <span>🔍</span>
            <span>Riset Tren & Keyword SEO</span>
          </h1>
          <p className="text-xs pg-text-sub mt-1">
            Temukan kata kunci pencarian real-time YouTube & Google sebelum membuat naskah AI agar konten Anda mudah ditemukan algoritma.
          </p>
        </div>
        {channels.length > 0 && (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="pg-text-sub font-medium">Channel:</span>
            <select
              value={selectedChannelId}
              onChange={(e) => handleChannelChange(e.target.value)}
              className="px-3 py-2 rounded-lg border pg-border pg-surface text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none max-w-full"
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
              placeholder="Misal: Rubah Kutub, Gunbound, Tips Saham Pemula..."
              className="w-full px-4 py-3 sm:py-2.5 rounded-lg border pg-border bg-white dark:bg-slate-800 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full"
                aria-label="Hapus teks"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.99]"
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
            <div className="glass-panel p-4 sm:p-5 rounded-xl shadow-sm space-y-4">
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
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 active:scale-95"
                  >
                    <span>⚡</span>
                    <span>Buat Naskah ({selectedKeywords.length} Kata Kunci)</span>
                  </button>
                )}
              </div>

              {/* List / Table */}
              <div className="divide-y pg-border">
                {result.keywords.map((kw) => {
                  const isSelected = selectedKeywords.includes(kw.keyword);
                  return (
                    <div
                      key={kw.keyword}
                      className={`py-3 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg transition-colors ${
                        isSelected ? "bg-blue-50/60 dark:bg-blue-900/20" : "hover:pg-surface-dim"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleKeywordSelection(kw.keyword)}
                          className="mt-1 w-4 h-4 rounded cursor-pointer accent-blue-600 shrink-0"
                          aria-label={`Pilih kata kunci ${kw.keyword}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 break-words">
                              {kw.keyword}
                            </span>
                            {kw.trendTag && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 whitespace-nowrap">
                                {kw.trendTag}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1 text-[11px] pg-text-muted flex-wrap">
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

                      {/* Score & Action Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 pg-border">
                        {/* Mobile Score Badge */}
                        <div className="flex items-center gap-1.5 sm:hidden">
                          <span className="text-[10px] pg-text-muted">Skor Peluang:</span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                            {kw.score}/100
                          </span>
                        </div>

                        {/* Desktop Score Badge */}
                        <div className="text-right hidden sm:block mr-2">
                          <span className="text-[10px] pg-text-muted block">Skor Peluang</span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {kw.score}/100
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCreateScriptWithKeyword(kw.keyword)}
                          className="px-3.5 py-1.5 min-h-[36px] bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 active:scale-95 ml-auto sm:ml-0"
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

          {/* Kolom Kanan: Pertanyaan Populer & Tag (1 Kolom) */}
          <div className="space-y-4">
            {/* Kartu Pertanyaan Populer Penonton (Live YouTube Search Questions) */}
            <div className="glass-panel p-4 sm:p-5 rounded-xl shadow-sm space-y-3">
              <h3 className="text-xs font-bold pg-text-heading flex items-center gap-1.5">
                <span>❓</span>
                <span>Pertanyaan Populer Penonton</span>
              </h3>
              <p className="text-[11px] pg-text-muted leading-relaxed">
                Pertanyaan riil yang paling sering dicari penonton di YouTube seputar topik ini. Klik untuk langsung dijadikan naskah:
              </p>
              <div className="space-y-2">
                {result.contentAngles.map((angle, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      const url = `/${locale}/dashboard/generator?channelId=${selectedChannelId}&topic=${encodeURIComponent(angle)}&keywords=${encodeURIComponent(selectedKeywords.join(","))}`;
                      router.push(url);
                    }}
                    className="p-3 rounded-xl border pg-border bg-slate-50/70 dark:bg-slate-800/50 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 text-xs cursor-pointer transition-all active:scale-[0.99] flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      Q
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug block">
                        {angle}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1.5">
                        <span>⚡</span>
                        <span>Jadikan Topik Naskah &rarr;</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kartu Tag Populer (Deduplikasi Bersih & Dual Format Salin) */}
            <div className="glass-panel p-4 sm:p-5 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs font-bold pg-text-heading flex items-center gap-1.5">
                  <span>🏷️</span>
                  <span>Tag Populer</span>
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyCommaTags}
                    className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 transition-colors border border-blue-200 dark:border-blue-800 active:scale-95"
                    title="Format Koma (,) untuk kolom Tags di YouTube Studio"
                  >
                    <span>📋</span>
                    <span>Salin Studio (,)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyHashtags}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 transition-colors border pg-border active:scale-95"
                    title="Format Hashtag (#) untuk deskripsi video"
                  >
                    <span>#️⃣</span>
                    <span>Salin Hashtag (#)</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.recommendedTags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => {
                      navigator.clipboard.writeText(tag);
                      toast.success(`Tag "${tag}" disalin!`);
                    }}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border pg-border text-slate-700 dark:text-slate-300 rounded-md text-[11px] cursor-pointer hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none active:scale-95"
                    title="Klik untuk menyalin tag ini"
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
