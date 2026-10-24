"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { Scene, MultiPlatformSeoData } from "@/lib/parsers";
import type { FunnelPackData } from "@/types/generator";
import { adaptPublishMetadata, type AdaptedPublishMetadata } from "@/lib/publishMetadataAdapter";

interface AutoPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName?: string;
  content: {
    title?: string;
    projectTitle?: string;
    scenes?: Scene[];
    caption?: string;
    hashtags?: string;
    multiPlatformSeo?: MultiPlatformSeoData | null;
    aspectRatio?: string;
  };
  isFunnel?: boolean;
  funnelPackData?: FunnelPackData | null;
  activeSegmentId?: "short1" | "short2" | "long";
}

export function AutoPublishModal({
  isOpen,
  onClose,
  channelId,
  channelName = "Channel Aktif",
  content,
  isFunnel = false,
  funnelPackData,
  activeSegmentId = "short1",
}: AutoPublishModalProps) {
  // State segmen aktif jika mode Funnel Pack
  const [selectedSegment, setSelectedSegment] = useState<"short1" | "short2" | "long">(
    activeSegmentId
  );

  // Sumber video: Direct upload atau Google Drive
  const [sourceType, setSourceType] = useState<"DIRECT_UPLOAD" | "DRIVE">("DIRECT_UPLOAD");
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);
  const [driveFileId, setDriveFileId] = useState<string>("");

  // Platform target
  const [platforms, setPlatforms] = useState<{ youtube: boolean; instagram: boolean; facebook: boolean }>({
    youtube: true,
    instagram: true,
    facebook: true,
  });

  // Pengaturan privasi
  const [privacyStatus, setPrivacyStatus] = useState<"public" | "unlisted" | "private">("public");

  // Tab preview platform
  const [previewPlatform, setPreviewPlatform] = useState<"youtube" | "instagram" | "facebook">("youtube");

  // State loading & hasil eksekusi
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState<string>("");
  const [results, setResults] = useState<{
    youtube?: { success: boolean; videoUrl?: string; error?: string };
    instagram?: { success: boolean; postUrl?: string; error?: string };
    facebook?: { success: boolean; postUrl?: string; error?: string };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ambil metadata segmen yang sedang aktif
  const currentContent = useMemo(() => {
    if (isFunnel && funnelPackData?.segments?.[selectedSegment]) {
      const seg = funnelPackData.segments[selectedSegment];
      const isCurrentActive = activeSegmentId === selectedSegment;
      return {
        title: seg.title || (isCurrentActive ? content.title : `Segmen ${selectedSegment}`),
        projectTitle: content.projectTitle,
        scenes: seg.scenes,
        caption: seg.caption || (isCurrentActive ? content.caption : ""),
        hashtags: seg.hashtags || (isCurrentActive ? content.hashtags : ""),
        multiPlatformSeo: seg.multiPlatformSeo || (isCurrentActive ? content.multiPlatformSeo : null),
        aspectRatio: seg.aspectRatio || (selectedSegment === "long" ? "16:9" : "9:16"),
      };
    }
    return content;
  }, [isFunnel, funnelPackData, selectedSegment, content, activeSegmentId]);

  // Adaptasi otomatis metadata parse engine
  const adaptedMetadata: AdaptedPublishMetadata = useMemo(() => {
    return adaptPublishMetadata({
      ...currentContent,
      privacyStatus,
      channel: {
        channelName,
      },
    });
  }, [currentContent, privacyStatus, channelName]);

  // Reset saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setResults(null);
      setPublishProgress("");
      setLocalVideoFile(null);
      setDriveFileId("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlatformToggle = (platform: "youtube" | "instagram" | "facebook") => {
    setPlatforms((prev) => ({ ...prev, [platform]: !prev[platform] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("video/")) {
        toast.error("Format file harus berupa video (.mp4, .webm, .mov)");
        return;
      }
      setLocalVideoFile(file);
    }
  };

  const handlePublishSubmit = async () => {
    const selectedPlatforms = (Object.keys(platforms) as Array<"youtube" | "instagram" | "facebook">).filter(
      (k) => platforms[k]
    );

    if (selectedPlatforms.length === 0) {
      toast.error("Pilih minimal satu platform untuk publikasi.");
      return;
    }

    if (sourceType === "DIRECT_UPLOAD" && !localVideoFile) {
      toast.error("Silakan pilih file video dari perangkat Anda terlebih dahulu.");
      return;
    }

    if (sourceType === "DRIVE" && !driveFileId.trim()) {
      toast.error("Silakan masukkan ID file Google Drive.");
      return;
    }

    try {
      setIsPublishing(true);
      setResults(null);
      setPublishProgress("Menyiapkan payload publikasi...");

      let res: Response;
      if (sourceType === "DIRECT_UPLOAD" && localVideoFile) {
        const formData = new FormData();
        formData.append("video", localVideoFile);
        formData.append("platforms", JSON.stringify(selectedPlatforms));
        formData.append(
          "content",
          JSON.stringify({
            ...currentContent,
            privacyStatus,
          })
        );
        if (isFunnel) {
          formData.append("funnelSegment", selectedSegment);
        }

        setPublishProgress("Mengunggah video dan memproses metadata...");
        res = await fetch(`/api/channels/${channelId}/publish`, {
          method: "POST",
          body: formData,
        });
      } else {
        setPublishProgress("Menghubungkan ke Google Drive & platform target...");
        res = await fetch(`/api/channels/${channelId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: "DRIVE",
            driveFileId: driveFileId.trim(),
            platforms: selectedPlatforms,
            content: {
              ...currentContent,
              privacyStatus,
            },
            funnelSegment: isFunnel ? selectedSegment : undefined,
          }),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memproses publikasi video.");
      }

      const data = await res.json();
      setResults(data.results);
      toast.success("Proses publikasi selesai dieksekusi!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setIsPublishing(false);
      setPublishProgress("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🚀</span>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>1-Tombol Auto Upload & Publish</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">
                  Channel: {channelName}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Otomatis menyesuaikan Judul, Deskripsi, Hashtag & Tag dari Parse Engine ke YouTube, Instagram & Facebook.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Switcher Segmen jika Funnel Pack */}
          {isFunnel && funnelPackData && (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30">
              <div className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-1.5">
                <span>🌪️</span>
                <span>Pilih Segmen Funnel yang Ingin Diposting:</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSegment("short1")}
                  className={`p-2 rounded-lg text-xs font-semibold text-left border transition-all ${
                    selectedSegment === "short1"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="text-[10px] opacity-80">Segmen 1 (9:16)</div>
                  <div className="truncate font-bold">
                    {funnelPackData.segments.short1.title || "Short 1: Hook"}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSegment("short2")}
                  className={`p-2 rounded-lg text-xs font-semibold text-left border transition-all ${
                    selectedSegment === "short2"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="text-[10px] opacity-80">Segmen 2 (9:16)</div>
                  <div className="truncate font-bold">
                    {funnelPackData.segments.short2.title || "Short 2: Problem"}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSegment("long")}
                  className={`p-2 rounded-lg text-xs font-semibold text-left border transition-all ${
                    selectedSegment === "long"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="text-[10px] opacity-80">Pillar (16:9)</div>
                  <div className="truncate font-bold">
                    {funnelPackData.segments.long.title || "Long Pillar"}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── PILIHAN SUMBER VIDEO (DUAL SOURCE) ── */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              1. Sumber File Video:
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setSourceType("DIRECT_UPLOAD")}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  sourceType === "DIRECT_UPLOAD"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 font-semibold"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <span className="text-xl">💻</span>
                <div>
                  <div className="text-xs font-bold">Upload Langsung dari PC/HP</div>
                  <div className="text-[10px] opacity-80">Pilih file .mp4 dari perangkat Anda</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSourceType("DRIVE")}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  sourceType === "DRIVE"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 font-semibold"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <span className="text-xl">☁️</span>
                <div>
                  <div className="text-xs font-bold">Ambil dari Google Drive Channel</div>
                  <div className="text-[10px] opacity-80">Stream langsung cloud-to-cloud</div>
                </div>
              </button>
            </div>

            {sourceType === "DIRECT_UPLOAD" ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 cursor-pointer text-center bg-slate-50/50 dark:bg-slate-800/40 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {localVideoFile ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>🎬 {localVideoFile.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({(localVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                    <span className="text-blue-600 underline text-[11px] ml-2">Ganti file</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-2xl">📁</span>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Klik atau seret file video (.mp4) ke sini
                    </p>
                    <p className="text-[10px] text-slate-400">Maksimum ukuran video sesuai limit hosting/browser</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={driveFileId}
                  onChange={(e) => setDriveFileId(e.target.value)}
                  placeholder="Masukkan ID File Google Drive (misal: 1A2b3C...)"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Tips: ID file bisa disalin dari link bagikan Google Drive atau file yang sudah di-backup via modal Google Drive sebelumnya.
                </p>
              </div>
            )}
          </div>

          {/* ── PILIHAN PLATFORM & PRIVASI ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                2. Target Platform:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={platforms.youtube}
                    onChange={() => handlePlatformToggle("youtube")}
                    className="rounded text-blue-600"
                  />
                  <span>▶️ YouTube ({currentContent.aspectRatio === "9:16" ? "Shorts" : "Video Utama"})</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={platforms.instagram}
                    onChange={() => handlePlatformToggle("instagram")}
                    className="rounded text-pink-600"
                  />
                  <span>📸 Instagram (Reels & Feed)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={platforms.facebook}
                    onChange={() => handlePlatformToggle("facebook")}
                    className="rounded text-blue-800"
                  />
                  <span>📘 Facebook Page</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                3. Status Privasi Tayang:
              </label>
              <select
                value={privacyStatus}
                onChange={(e) => setPrivacyStatus(e.target.value as "public" | "unlisted" | "private")}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="public">🟢 Public (Langsung Terbit ke Publik)</option>
                <option value="unlisted">🟡 Unlisted (Hanya yang Punya Link - Aman untuk Review)</option>
                <option value="private">🔒 Private (Draft Pribadi)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-2">
                Pilih <i>Unlisted</i> jika Anda ingin meninjau video di YouTube Studio terlebih dahulu sebelum dipublikasikan ke umum.
              </p>
            </div>
          </div>

          {/* ── PREVIEW METADATA OTOMATIS (TAB) ── */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 pt-2">
              <span className="text-[11px] font-bold text-slate-500 mr-3 pb-2">PREVIEW METADATA:</span>
              <button
                type="button"
                onClick={() => setPreviewPlatform("youtube")}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-all ${
                  previewPlatform === "youtube"
                    ? "border-red-500 text-red-600 dark:text-red-400"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                ▶️ YouTube
              </button>
              <button
                type="button"
                onClick={() => setPreviewPlatform("instagram")}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-all ${
                  previewPlatform === "instagram"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📸 Instagram
              </button>
              <button
                type="button"
                onClick={() => setPreviewPlatform("facebook")}
                className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-all ${
                  previewPlatform === "facebook"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📘 Facebook
              </button>
            </div>

            <div className="p-4 bg-slate-50/30 dark:bg-slate-900/30 text-xs space-y-3 font-mono">
              {previewPlatform === "youtube" && (
                <>
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] block">JUDUL VIDEO (MAKS 100 KARAKTER):</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {adaptedMetadata.youtube.title}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] block">DESKRIPSI LENGKAP:</span>
                    <div className="whitespace-pre-line text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto mt-0.5 font-sans">
                      {adaptedMetadata.youtube.description}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] block">TAGS YOUTUBE STUDIO:</span>
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                      {adaptedMetadata.youtube.tags.join(", ") || "-"}
                    </div>
                  </div>
                </>
              )}

              {previewPlatform === "instagram" && (
                <div>
                  <span className="font-bold text-slate-400 text-[10px] block">CAPTION REELS / FEED:</span>
                  <div className="whitespace-pre-line text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto mt-0.5 font-sans">
                    {adaptedMetadata.instagram.caption}
                  </div>
                </div>
              )}

              {previewPlatform === "facebook" && (
                <>
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] block">JUDUL POSTINGAN:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {adaptedMetadata.facebook.title}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] block">PESAN POSTINGAN:</span>
                    <div className="whitespace-pre-line text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto mt-0.5 font-sans">
                      {adaptedMetadata.facebook.description}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── HASIL PUBLIKASI JIKA SUDAH SELESAI ── */}
          {results && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>📋</span> Hasil Publikasi:
              </h4>
              {results.youtube && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-semibold">YouTube:</span>
                  {results.youtube.success ? (
                    <a
                      href={results.youtube.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline font-semibold flex items-center gap-1"
                    >
                      <span>✅ Video Tayang</span> <span>↗</span>
                    </a>
                  ) : (
                    <span className="text-red-500 font-medium">⚠️ {results.youtube.error}</span>
                  )}
                </div>
              )}
              {results.instagram && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-semibold">Instagram:</span>
                  {results.instagram.success ? (
                    <span className="text-emerald-600 font-semibold">✅ Post Berhasil</span>
                  ) : (
                    <span className="text-amber-600 font-medium">ℹ️ {results.instagram.error}</span>
                  )}
                </div>
              )}
              {results.facebook && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-semibold">Facebook:</span>
                  {results.facebook.success ? (
                    <span className="text-emerald-600 font-semibold">✅ Post Berhasil</span>
                  ) : (
                    <span className="text-amber-600 font-medium">ℹ️ {results.facebook.error}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="text-xs text-slate-500">
            {isPublishing ? (
              <span className="text-blue-600 font-semibold flex items-center gap-1.5 animate-pulse">
                <span>⏳</span> {publishProgress}
              </span>
            ) : (
              <span>Siap untuk auto-posting serentak.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPublishing}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePublishSubmit}
              disabled={isPublishing}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>🚀</span>
              <span>{isPublishing ? "Memproses..." : "Publish Sekarang"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
