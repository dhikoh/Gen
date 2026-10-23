"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { sanitizeFolderName } from "@/lib/googleDrive";
import { buildTextPackageFiles } from "@/lib/gdrivePackageFormat";
import { useDrivePackageUpload, MultiSegmentUploadItem } from "@/hooks/useDrivePackageUpload";
import type { Scene, ThumbnailData, MultiPlatformSeoData } from "@/lib/parsers";
import type { FunnelPackData } from "@/types/generator";

type FunnelSegmentKey = "short1" | "short2" | "long";

interface SegmentState {
  included: boolean;
  folderName: string;
  videoFile: File | null;
  thumbnailFile: File | null;
  thumbPreviewUrl: string | null;
}

interface DrivePackageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  channelName: string;
  defaultTitle: string;
  scenes: Scene[];
  caption?: string;
  hashtags?: string;
  multiPlatformSeo?: MultiPlatformSeoData | null;
  thumbnailData?: ThumbnailData | null;
  isFunnel?: boolean;
  funnelPackData?: FunnelPackData | null;
  activeSegmentId?: "short1" | "short2" | "long";
  onSelectSegment?: (seg: "short1" | "short2" | "long") => void;
}

const FUNNEL_CONFIG: Record<
  FunnelSegmentKey,
  { defaultName: string; label: string; badge: string; icon: string; ratio: string }
> = {
  short1: {
    defaultName: "01_Short_1_Hook",
    label: "Segmen 1: Short 1 — Hook",
    badge: "Top of Funnel",
    icon: "🎯",
    ratio: "9:16",
  },
  short2: {
    defaultName: "02_Short_2_Value",
    label: "Segmen 2: Short 2 — Value",
    badge: "Middle of Funnel",
    icon: "💡",
    ratio: "9:16",
  },
  long: {
    defaultName: "03_Long_Convert",
    label: "Segmen 3: Long Video — Convert",
    badge: "Pillar Long-Form",
    icon: "🚀",
    ratio: "16:9",
  },
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export function DrivePackageUploadModal({
  isOpen,
  onClose,
  locale,
  channelName,
  defaultTitle,
  scenes,
  caption,
  hashtags,
  multiPlatformSeo,
  thumbnailData,
  isFunnel = false,
  funnelPackData,
  activeSegmentId = "short1",
  onSelectSegment,
}: DrivePackageUploadModalProps) {
  // ── Drive status check
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null);
  const [driveChecking, setDriveChecking] = useState<boolean>(true);

  // ── Project Folder Name
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const initialProjectName = useMemo(() => {
    const raw = defaultTitle ? `${defaultTitle}_${todayStr}` : `Proyek_${todayStr}`;
    return sanitizeFolderName(isFunnel ? `[FUNNEL] ${raw}` : raw);
  }, [defaultTitle, todayStr, isFunnel]);

  const [projectFolderName, setProjectFolderName] = useState(initialProjectName);

  // ── Single Video Mode States
  const [singleFolderName, setSingleFolderName] = useState<string>("");
  const [singleVideoFile, setSingleVideoFile] = useState<File | null>(null);
  const [singleThumbnailFile, setSingleThumbnailFile] = useState<File | null>(null);
  const [singleThumbPreview, setSingleThumbPreview] = useState<string | null>(null);

  const singleVideoInputRef = useRef<HTMLInputElement>(null);
  const singleThumbInputRef = useRef<HTMLInputElement>(null);

  // ── Funnel Multi-Segment States
  const [segmentStates, setSegmentStates] = useState<Record<FunnelSegmentKey, SegmentState>>({
    short1: {
      included: true,
      folderName: FUNNEL_CONFIG.short1.defaultName,
      videoFile: null,
      thumbnailFile: null,
      thumbPreviewUrl: null,
    },
    short2: {
      included: true,
      folderName: FUNNEL_CONFIG.short2.defaultName,
      videoFile: null,
      thumbnailFile: null,
      thumbPreviewUrl: null,
    },
    long: {
      included: true,
      folderName: FUNNEL_CONFIG.long.defaultName,
      videoFile: null,
      thumbnailFile: null,
      thumbPreviewUrl: null,
    },
  });

  // Dynamic file input refs per segment
  const videoInputRefs = {
    short1: useRef<HTMLInputElement>(null),
    short2: useRef<HTMLInputElement>(null),
    long: useRef<HTMLInputElement>(null),
  };
  const thumbInputRefs = {
    short1: useRef<HTMLInputElement>(null),
    short2: useRef<HTMLInputElement>(null),
    long: useRef<HTMLInputElement>(null),
  };

  // ── Hook upload
  const {
    isUploading,
    progressStatus,
    progressPercent,
    folderUrl,
    uploadError,
    uploadPackage,
    uploadMultiSegmentPackage,
    resetUploadState,
  } = useDrivePackageUpload();

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      resetUploadState();
      setProjectFolderName(initialProjectName);
      setSingleVideoFile(null);
      setSingleThumbnailFile(null);
      setSingleThumbPreview(null);
      setSingleFolderName("");

      setSegmentStates({
        short1: {
          included: true,
          folderName: FUNNEL_CONFIG.short1.defaultName,
          videoFile: null,
          thumbnailFile: null,
          thumbPreviewUrl: null,
        },
        short2: {
          included: true,
          folderName: FUNNEL_CONFIG.short2.defaultName,
          videoFile: null,
          thumbnailFile: null,
          thumbPreviewUrl: null,
        },
        long: {
          included: true,
          folderName: FUNNEL_CONFIG.long.defaultName,
          videoFile: null,
          thumbnailFile: null,
          thumbPreviewUrl: null,
        },
      });

      // Check Drive status
      setDriveChecking(true);
      fetch("/api/user/google-drive/status")
        .then((res) => res.json())
        .then((data) => {
          setDriveConnected(!!data.connected);
        })
        .catch(() => {
          setDriveConnected(false);
        })
        .finally(() => {
          setDriveChecking(false);
        });
    }
  }, [isOpen, initialProjectName, resetUploadState]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (singleThumbPreview) URL.revokeObjectURL(singleThumbPreview);
      Object.values(segmentStates).forEach((s) => {
        if (s.thumbPreviewUrl) URL.revokeObjectURL(s.thumbPreviewUrl);
      });
    };
  }, [singleThumbPreview, segmentStates]);

  // Single thumb preview
  useEffect(() => {
    if (!singleThumbnailFile) {
      setSingleThumbPreview(null);
      return;
    }
    const url = URL.createObjectURL(singleThumbnailFile);
    setSingleThumbPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [singleThumbnailFile]);

  // Handler for Funnel segment file inputs
  const handleSegmentVideoChange = (segKey: FunnelSegmentKey, file: File | null) => {
    setSegmentStates((prev) => ({
      ...prev,
      [segKey]: {
        ...prev[segKey],
        videoFile: file,
        included: file ? true : prev[segKey].included,
      },
    }));
  };

  const handleSegmentThumbChange = (segKey: FunnelSegmentKey, file: File | null) => {
    setSegmentStates((prev) => {
      const oldUrl = prev[segKey].thumbPreviewUrl;
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      const newUrl = file ? URL.createObjectURL(file) : null;
      return {
        ...prev,
        [segKey]: {
          ...prev[segKey],
          thumbnailFile: file,
          thumbPreviewUrl: newUrl,
          included: file ? true : prev[segKey].included,
        },
      };
    });
  };

  const toggleSegmentIncluded = (segKey: FunnelSegmentKey) => {
    setSegmentStates((prev) => ({
      ...prev,
      [segKey]: {
        ...prev[segKey],
        included: !prev[segKey].included,
      },
    }));
  };

  const setSegmentFolderName = (segKey: FunnelSegmentKey, name: string) => {
    setSegmentStates((prev) => ({
      ...prev,
      [segKey]: {
        ...prev[segKey],
        folderName: name,
      },
    }));
  };

  // Helper: Dapatkan berkas teks per segmen Funnel
  const getSegmentTextFiles = useCallback(
    (segKey: FunnelSegmentKey) => {
      if (isFunnel && funnelPackData?.segments?.[segKey]) {
        const seg = funnelPackData.segments[segKey];
        return buildTextPackageFiles({
          projectTitle: seg.title || defaultTitle || projectFolderName,
          scenes: seg.scenes,
          caption: seg.caption || caption,
          hashtags: seg.hashtags || hashtags,
          multiPlatformSeo: seg.multiPlatformSeo || multiPlatformSeo,
          thumbnailData: seg.thumbnailData || thumbnailData,
          segmentLabel: seg.label || FUNNEL_CONFIG[segKey].label,
          aspectRatio: seg.aspectRatio,
        });
      }
      return buildTextPackageFiles({
        projectTitle: defaultTitle || projectFolderName,
        scenes,
        caption,
        hashtags,
        multiPlatformSeo,
        thumbnailData,
        segmentLabel: FUNNEL_CONFIG[segKey].label,
      });
    },
    [isFunnel, funnelPackData, defaultTitle, projectFolderName, scenes, caption, hashtags, multiPlatformSeo, thumbnailData]
  );

  // Helper: Berkas teks untuk single video
  const singleTextFiles = useMemo(() => {
    return buildTextPackageFiles({
      projectTitle: defaultTitle || projectFolderName,
      scenes,
      caption,
      hashtags,
      multiPlatformSeo,
      thumbnailData,
    });
  }, [defaultTitle, projectFolderName, scenes, caption, hashtags, multiPlatformSeo, thumbnailData]);

  // Hitung jumlah segmen yang aktif dicentang
  const activeSegmentsList = useMemo(() => {
    return (["short1", "short2", "long"] as FunnelSegmentKey[]).filter(
      (k) => segmentStates[k].included
    );
  }, [segmentStates]);

  const activeSegmentsCount = activeSegmentsList.length;

  // Submit Handler
  const handleUploadSubmit = async () => {
    if (isFunnel && funnelPackData) {
      if (activeSegmentsCount === 0) return;

      const items: MultiSegmentUploadItem[] = activeSegmentsList.map((k) => {
        const st = segmentStates[k];
        return {
          segmentKey: k,
          segmentFolderName: st.folderName || FUNNEL_CONFIG[k].defaultName,
          label: FUNNEL_CONFIG[k].label,
          textFiles: getSegmentTextFiles(k),
          videoFile: st.videoFile,
          thumbnailFile: st.thumbnailFile,
        };
      });

      await uploadMultiSegmentPackage({
        channelName: channelName || "Default Channel",
        projectFolderName,
        segments: items,
      });
    } else {
      await uploadPackage({
        channelName: channelName || "Default Channel",
        projectFolderName,
        segmentFolderName: singleFolderName.trim() || undefined,
        textFiles: singleTextFiles,
        videoFile: singleVideoFile,
        thumbnailFile: singleThumbnailFile,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">☁️</span>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>
                  {locale === "en" ? "Backup Package to Google Drive" : "Upload Paket ke Google Drive"}
                </span>
                {driveConnected && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold">
                    ✓ Connected
                  </span>
                )}
                {isFunnel && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold">
                    🌪️ Funnel Pack (Multi-Segment)
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFunnel
                  ? locale === "en"
                    ? "Upload 1, 2, or 3 funnel segments simultaneously into organized non-duplicate folders."
                    : "Unggah 1, 2, atau 3 segmen funnel sekaligus ke folder Google Drive yang rapi & anti-duplikat."
                  : locale === "en"
                  ? "Organized hierarchy: Profile > Project > Platform SEO, Script & Local Media"
                  : "Struktur rapi otomatis: Profil > Proyek > Berkas SEO 4 Platform, Naskah & Media PC"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Status Koneksi Google Drive */}
          {driveChecking ? (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 animate-pulse">
              {locale === "en" ? "Checking Google Drive connection..." : "Memeriksa status Google Drive..."}
            </div>
          ) : !driveConnected ? (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <span>⚠️</span>
                <span>
                  {locale === "en"
                    ? "Google Drive Account Not Connected"
                    : "Akun Google Drive Belum Terhubung"}
                </span>
              </div>
              <p>
                {locale === "en"
                  ? "Please connect your Google Drive account in Settings before uploading packages."
                  : "Silakan hubungkan akun Google Drive Anda di menu Pengaturan terlebih dahulu."}
              </p>
              <div className="pt-1">
                <a
                  href="/dashboard/settings"
                  target="_blank"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-sm"
                >
                  🔗 {locale === "en" ? "Go to Settings" : "Buka Pengaturan"}
                </a>
              </div>
            </div>
          ) : null}

          {/* 1. Pengaturan Hirarki Folder Induk */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>📁</span>
                <span>
                  {locale === "en"
                    ? "Google Drive Folder Hierarchy"
                    : "Pengaturan Struktur Folder Google Drive"}
                </span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                🛡️ {locale === "en" ? "Anti-duplicate & In-place overwrite" : "Anti-duplikat & Update In-place"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Profile / Channel */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {locale === "en" ? "Channel / Profile Name" : "Nama Channel / Profil"}
                </label>
                <input
                  type="text"
                  readOnly
                  value={channelName || "Default Channel"}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px]"
                />
              </div>

              {/* Project Folder Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {locale === "en" ? "Project Folder Name" : "Nama Folder Proyek"}
                </label>
                <input
                  type="text"
                  disabled={isUploading}
                  value={projectFolderName}
                  onChange={(e) => setProjectFolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Breadcrumb Path */}
            <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap bg-white dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {locale === "en" ? "Target Drive Path:" : "Jalur Folder:"}
              </span>
              <span className="font-mono text-blue-600 dark:text-blue-400">Prompt Gen Videos</span>
              <span>/</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">{channelName || "Default Channel"}</span>
              <span>/</span>
              <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{projectFolderName || "Project"}</span>
              {isFunnel ? (
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                  ({activeSegmentsCount} {locale === "en" ? "segments selected" : "segmen terpilih"})
                </span>
              ) : singleFolderName.trim() ? (
                <>
                  <span>/</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{singleFolderName.trim()}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* ── KONTEN FUNNEL PACK: TAMPILKAN 3 KARTU SEGMEN ── */}
          {isFunnel && funnelPackData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🌪️</span>
                  <span>
                    {locale === "en"
                      ? "Funnel Segments (Select 1, 2, or all 3 to upload)"
                      : "Pilihan Segmen Funnel (Dapat pilih 1, 2, atau ketiganya sekaligus)"}
                  </span>
                </span>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => {
                      setSegmentStates((prev) => ({
                        short1: { ...prev.short1, included: true },
                        short2: { ...prev.short2, included: true },
                        long: { ...prev.long, included: true },
                      }));
                    }}
                    className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-semibold transition-colors"
                  >
                    {locale === "en" ? "Select All (3)" : "Pilih Semua (3)"}
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => {
                      setSegmentStates((prev) => ({
                        short1: { ...prev.short1, included: prev.short1.videoFile !== null },
                        short2: { ...prev.short2, included: prev.short2.videoFile !== null },
                        long: { ...prev.long, included: prev.long.videoFile !== null },
                      }));
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 font-semibold transition-colors"
                  >
                    {locale === "en" ? "Only with Media" : "Hanya yang ada Media"}
                  </button>
                </div>
              </div>

              {(["short1", "short2", "long"] as FunnelSegmentKey[]).map((segKey) => {
                const conf = FUNNEL_CONFIG[segKey];
                const st = segmentStates[segKey];
                const textFiles = getSegmentTextFiles(segKey);

                return (
                  <div
                    key={segKey}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      st.included
                        ? "border-purple-300 dark:border-purple-800/80 bg-white dark:bg-slate-900 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/30 opacity-60"
                    }`}
                  >
                    {/* Segment Header */}
                    <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`check_${segKey}`}
                          checked={st.included}
                          disabled={isUploading}
                          onChange={() => toggleSegmentIncluded(segKey)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`check_${segKey}`}
                          className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{conf.icon}</span>
                          <span>{conf.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                            {conf.ratio}
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        {st.included ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                            ✓ Siap Diunggah
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold">
                            ✕ Dilewati
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Segment Content (Only if included or user interacts) */}
                    <div className="p-4 space-y-3">
                      {/* Subfolder Name & Text Files Badge */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs items-center">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            {locale === "en" ? "Subfolder Name" : "Nama Subfolder Segmen"}
                          </label>
                          <input
                            type="text"
                            disabled={isUploading || !st.included}
                            value={st.folderName}
                            onChange={(e) => setSegmentFolderName(segKey, e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono text-[11px] focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            {locale === "en" ? "Formatted Text Files" : "Berkas Teks Terpisah (Otomatis)"}
                          </label>
                          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              ✓ {textFiles.length} berkas naskah & SEO 4 platform
                            </span>
                            <span className="text-[10px] text-slate-400">Auto</span>
                          </div>
                        </div>
                      </div>

                      {/* Dual Dropzone: Video & Thumbnail untuk Segmen ini */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Video Dropzone */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <span>🎬</span>
                            <span>
                              {locale === "en"
                                ? `Video ${conf.ratio} (${conf.badge})`
                                : `Video ${conf.ratio} (${conf.badge})`}
                            </span>
                          </label>
                          <input
                            type="file"
                            ref={videoInputRefs[segKey]}
                            accept="video/mp4,video/webm,video/quicktime"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              handleSegmentVideoChange(segKey, f);
                            }}
                          />

                          {st.videoFile ? (
                            <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate">
                                  {st.videoFile.name}
                                </p>
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                                  {formatBytes(st.videoFile.size)}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={isUploading}
                                onClick={() => handleSegmentVideoChange(segKey, null)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => videoInputRefs[segKey].current?.click()}
                              className="w-full p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-slate-800/30 text-center transition-colors group cursor-pointer"
                            >
                              <span className="text-xl block mb-0.5 group-hover:scale-110 transition-transform">
                                🎬
                              </span>
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                                {locale === "en" ? "Drop Video File" : `Pilih Video ${conf.ratio}`}
                              </span>
                              <span className="text-[9px] text-slate-400 block">MP4, WEBM, MOV (Max 250 MB)</span>
                            </button>
                          )}
                        </div>

                        {/* Thumbnail Dropzone */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <span>🖼️</span>
                            <span>{locale === "en" ? "Thumbnail Image" : `Thumbnail (${conf.ratio})`}</span>
                          </label>
                          <input
                            type="file"
                            ref={thumbInputRefs[segKey]}
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              handleSegmentThumbChange(segKey, f);
                            }}
                          />

                          {st.thumbnailFile ? (
                            <div className="p-2 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/70 dark:bg-purple-950/30 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {st.thumbPreviewUrl && (
                                  <img
                                    src={st.thumbPreviewUrl}
                                    alt="Thumbnail preview"
                                    className="w-8 h-8 object-cover rounded-lg border border-purple-300 dark:border-purple-800 shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate">
                                    {st.thumbnailFile.name}
                                  </p>
                                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                                    {formatBytes(st.thumbnailFile.size)}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={isUploading}
                                onClick={() => handleSegmentThumbChange(segKey, null)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => thumbInputRefs[segKey].current?.click()}
                              className="w-full p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 bg-slate-50 dark:bg-slate-800/30 text-center transition-colors group cursor-pointer"
                            >
                              <span className="text-xl block mb-0.5 group-hover:scale-110 transition-transform">
                                🖼️
                              </span>
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                                {locale === "en" ? "Drop Thumbnail Image" : `Pilih Thumbnail ${conf.ratio}`}
                              </span>
                              <span className="text-[9px] text-slate-400 block">PNG, JPG, WEBP (Max 15 MB)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── KONTEN SINGLE VIDEO: TAMPILAN STANDAR ── */
            <div className="space-y-4">
              {/* Optional Subfolder */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {locale === "en" ? "Subfolder (Optional)" : "Nama Subfolder Segmen (Opsional)"}
                </label>
                <input
                  type="text"
                  disabled={isUploading}
                  placeholder="Kosongkan jika ingin langsung di folder proyek"
                  value={singleFolderName}
                  onChange={(e) => setSingleFolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Berkas Teks Otomatis */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>📄</span>
                    <span>
                      {locale === "en"
                        ? "Automatic Formatted Text Files"
                        : "Berkas Teks Terpisah per Platform (Otomatis)"}
                    </span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {singleTextFiles.length} {locale === "en" ? "files ready" : "berkas siap unggah"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {singleTextFiles.map((tf, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate"
                      title={tf.filename}
                    >
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span className="truncate">{tf.filename}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dual Dropzone Single */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Video Dropzone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>🎬</span>
                    <span>
                      {locale === "en" ? "Final Video (.mp4, .mov, .webm)" : "File Video Final (.mp4, .mov, .webm)"}
                    </span>
                  </label>
                  <input
                    type="file"
                    ref={singleVideoInputRef}
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSingleVideoFile(file);
                    }}
                  />

                  {singleVideoFile ? (
                    <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate">
                          {singleVideoFile.name}
                        </p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                          {formatBytes(singleVideoFile.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => setSingleVideoFile(null)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => singleVideoInputRef.current?.click()}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-slate-800/30 text-center transition-colors group cursor-pointer"
                    >
                      <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform">🎬</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        {locale === "en" ? "Choose Video File" : "Pilih File Video dari Laptop"}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">MP4, WEBM, MOV (Max 250 MB)</span>
                    </button>
                  )}
                </div>

                {/* Thumbnail Dropzone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span>🖼️</span>
                    <span>
                      {locale === "en" ? "Thumbnail Image (.png, .jpg, .webp)" : "Gambar Thumbnail (.png, .jpg, .webp)"}
                    </span>
                  </label>
                  <input
                    type="file"
                    ref={singleThumbInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSingleThumbnailFile(file);
                    }}
                  />

                  {singleThumbnailFile ? (
                    <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/70 dark:bg-purple-950/30 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {singleThumbPreview && (
                          <img
                            src={singleThumbPreview}
                            alt="Thumbnail preview"
                            className="w-10 h-10 object-cover rounded-lg border border-purple-300 dark:border-purple-800 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate">
                            {singleThumbnailFile.name}
                          </p>
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                            {formatBytes(singleThumbnailFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => setSingleThumbnailFile(null)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => singleThumbInputRef.current?.click()}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 bg-slate-50 dark:bg-slate-800/30 text-center transition-colors group cursor-pointer"
                    >
                      <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform">🖼️</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        {locale === "en" ? "Choose Thumbnail Image" : "Pilih Gambar Thumbnail"}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">PNG, JPG, WEBP (Max 15 MB)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. Indikator Progress & Error */}
          {isUploading && (
            <div className="space-y-2 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-700 dark:text-blue-300 animate-pulse">
                  {progressStatus}
                </span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-blue-200 dark:bg-blue-900/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
              <span>⚠️ {uploadError}</span>
              <button
                type="button"
                onClick={resetUploadState}
                className="text-[11px] underline font-semibold ml-2 hover:text-red-900"
              >
                {locale === "en" ? "Dismiss" : "Tutup"}
              </button>
            </div>
          )}

          {folderUrl && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span>🎉</span>
                <span>
                  {locale === "en"
                    ? "Content Package Uploaded Successfully!"
                    : "Paket Konten Berhasil Diunggah ke Google Drive!"}
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                {isFunnel
                  ? locale === "en"
                    ? `Successfully uploaded ${activeSegmentsCount} funnel segments into your Google Drive project folder.`
                    : `Berhasil mengunggah ${activeSegmentsCount} segmen funnel ke dalam folder proyek Google Drive Anda secara rapi.`
                  : locale === "en"
                  ? "All individual metadata files, script, and local media have been stored in your Google Drive project folder."
                  : "Seluruh berkas teks metadata per platform, naskah, dan media lokal Anda telah tersimpan rapi di folder proyek Google Drive."}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <span>↗️</span>
                  <span>{locale === "en" ? "Open Project Folder in Drive" : "Buka Folder Proyek di Google Drive"}</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer Actions ── */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            disabled={isUploading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {folderUrl ? (locale === "en" ? "Done" : "Selesai") : locale === "en" ? "Cancel" : "Batal"}
          </button>

          {!folderUrl && (
            <button
              type="button"
              disabled={isUploading || !driveConnected || (isFunnel && activeSegmentsCount === 0)}
              onClick={handleUploadSubmit}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <span>☁️</span>
              <span>
                {isUploading
                  ? locale === "en"
                    ? "Uploading Packages..."
                    : "Mengunggah Paket..."
                  : isFunnel
                  ? activeSegmentsCount === 0
                    ? locale === "en"
                      ? "Select at least 1 segment"
                      : "Pilih minimal 1 segmen"
                    : locale === "en"
                    ? `Upload ${activeSegmentsCount} Segment(s) to Drive`
                    : `Upload ${activeSegmentsCount} Segmen Terpilih ke Drive`
                  : locale === "en"
                  ? "Start Package Upload"
                  : "Mulai Upload Paket"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
