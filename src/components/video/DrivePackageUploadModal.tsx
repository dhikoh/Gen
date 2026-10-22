"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { sanitizeFolderName } from "@/lib/googleDrive";
import { buildTextPackageFiles } from "@/lib/gdrivePackageFormat";
import { useDrivePackageUpload } from "@/hooks/useDrivePackageUpload";
import type { Scene, ThumbnailData, MultiPlatformSeoData } from "@/lib/parsers";
import type { FunnelPackData } from "@/types/generator";

interface DrivePackageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  channelName: string;
  defaultTitle: string;
  scenes: Scene[];
  multiPlatformSeo?: MultiPlatformSeoData | null;
  thumbnailData?: ThumbnailData | null;
  isFunnel?: boolean;
  funnelPackData?: FunnelPackData | null;
  activeSegmentId?: "short1" | "short2" | "long";
  onSelectSegment?: (seg: "short1" | "short2" | "long") => void;
}

export function DrivePackageUploadModal({
  isOpen,
  onClose,
  locale,
  channelName,
  defaultTitle,
  scenes,
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

  // ── Folder configuration
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const initialProjectName = useMemo(() => {
    const raw = defaultTitle ? `${defaultTitle}_${todayStr}` : `Proyek_${todayStr}`;
    return sanitizeFolderName(isFunnel ? `[FUNNEL] ${raw}` : raw);
  }, [defaultTitle, todayStr, isFunnel]);

  const [projectFolderName, setProjectFolderName] = useState(initialProjectName);

  // ── Segment selector for Funnel Pack
  const [selectedSegment, setSelectedSegment] = useState<"short1" | "short2" | "long">(activeSegmentId);

  useEffect(() => {
    if (activeSegmentId) {
      setSelectedSegment(activeSegmentId);
    }
  }, [activeSegmentId]);

  const defaultSegmentFolderNames: Record<"short1" | "short2" | "long", string> = {
    short1: "01_Short_1_Hook",
    short2: "02_Short_2_Value",
    long: "03_Long_Convert",
  };

  const [segmentFolderName, setSegmentFolderName] = useState<string>(
    defaultSegmentFolderNames[selectedSegment]
  );

  useEffect(() => {
    setSegmentFolderName(defaultSegmentFolderNames[selectedSegment]);
  }, [selectedSegment]);

  // ── Local Media Files from PC
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // ── Hook upload
  const {
    isUploading,
    progressStatus,
    progressPercent,
    folderUrl,
    uploadError,
    uploadPackage,
    resetUploadState,
  } = useDrivePackageUpload();

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      resetUploadState();
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbPreviewUrl(null);
      setProjectFolderName(initialProjectName);

      // Cek koneksi Drive
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

  // Thumbnail preview
  useEffect(() => {
    if (!thumbnailFile) {
      setThumbPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  // Data sumber naskah & SEO berdasarkan mode (Funnel vs Single)
  const currentSegmentData = useMemo(() => {
    if (isFunnel && funnelPackData?.segments?.[selectedSegment]) {
      const seg = funnelPackData.segments[selectedSegment];
      return {
        scenes: seg.scenes,
        multiPlatformSeo: seg.multiPlatformSeo || multiPlatformSeo,
        thumbnailData: seg.thumbnailData || thumbnailData,
        label: seg.label,
      };
    }
    return {
      scenes,
      multiPlatformSeo,
      thumbnailData,
      label: isFunnel ? defaultSegmentFolderNames[selectedSegment] : undefined,
    };
  }, [isFunnel, funnelPackData, selectedSegment, scenes, multiPlatformSeo, thumbnailData]);

  // Daftar berkas teks yang akan otomatis dibuat
  const textPackageFiles = useMemo(() => {
    return buildTextPackageFiles({
      projectTitle: defaultTitle || projectFolderName,
      scenes: currentSegmentData.scenes,
      multiPlatformSeo: currentSegmentData.multiPlatformSeo,
      thumbnailData: currentSegmentData.thumbnailData,
      segmentLabel: currentSegmentData.label,
    });
  }, [defaultTitle, projectFolderName, currentSegmentData]);

  // Format ukuran byte ke string human-readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleUploadSubmit = async () => {
    const success = await uploadPackage({
      channelName: channelName || "Default Channel",
      projectFolderName,
      segmentFolderName: isFunnel ? segmentFolderName : undefined,
      textFiles: textPackageFiles,
      videoFile,
      thumbnailFile,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">☁️</span>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{locale === "en" ? "Backup Package to Google Drive" : "Upload Paket ke Google Drive"}</span>
                {driveConnected && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold">
                    ✓ Connected
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {locale === "en"
                  ? "Organized hierarchy: Profile > Project > Individual Platform Metadata, Script & Media"
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

          {/* 1. Pengaturan Hirarki Folder (Editable) */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>📁</span>
                <span>{locale === "en" ? "Folder Hierarchy Configuration" : "Pengaturan Struktur Folder Google Drive"}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {locale === "en" ? "Editable / Non-duplicate" : "Dapat diedit & Anti-duplikat"}
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

            {/* Jika Funnel Pack: Segment Selection */}
            {isFunnel && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-700 dark:text-purple-300 mb-1">
                    🌪️ {locale === "en" ? "Target Funnel Segment" : "Target Segmen Funnel"}
                  </label>
                  <select
                    disabled={isUploading}
                    value={selectedSegment}
                    onChange={(e) => {
                      const val = e.target.value as "short1" | "short2" | "long";
                      setSelectedSegment(val);
                      if (onSelectSegment) onSelectSegment(val);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-800 text-slate-800 dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="short1">📌 01_Short_1_Hook (Top of Funnel - 9:16)</option>
                    <option value="short2">📌 02_Short_2_Value (Middle of Funnel - 9:16)</option>
                    <option value="long">📌 03_Long_Convert (Pillar Long-Form - 16:9)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {locale === "en" ? "Segment Subfolder Name" : "Nama Subfolder Segmen"}
                  </label>
                  <input
                    type="text"
                    disabled={isUploading}
                    value={segmentFolderName}
                    onChange={(e) => setSegmentFolderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Live Breadcrumb Path */}
            <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap bg-white dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {locale === "en" ? "Drive Path:" : "Jalur Folder:"}
              </span>
              <span className="font-mono text-blue-600 dark:text-blue-400">Prompt Gen Videos</span>
              <span>/</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">{channelName || "Default Channel"}</span>
              <span>/</span>
              <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{projectFolderName || "Project"}</span>
              {isFunnel && segmentFolderName && (
                <>
                  <span>/</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{segmentFolderName}</span>
                </>
              )}
            </div>
          </div>

          {/* 2. Berkas Teks Otomatis yang Disertakan */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>📄</span>
                <span>{locale === "en" ? "Automatic Formatted Text Files" : "Berkas Teks Terpisah per Platform (Otomatis)"}</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {textPackageFiles.length} {locale === "en" ? "files ready" : "berkas siap unggah"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {textPackageFiles.map((tf, idx) => (
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

          {/* 3. Dual Dropzone: Video & Thumbnail dari PC/Laptop */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>💻</span>
                <span>{locale === "en" ? "Local Media Files from PC / Laptop" : "Unggah Media Lokal dari Komputer / Laptop"}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {locale === "en" ? "Optional (Video & Thumbnail)" : "Opsional (Video & Thumbnail)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dropzone 1: File Video dari PC */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <span>🎬</span>
                  <span>{locale === "en" ? "Final Video File (.mp4, .mov, .webm)" : "File Video Final (.mp4, .mov, .webm)"}</span>
                </label>
                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setVideoFile(file);
                  }}
                />

                {videoFile ? (
                  <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate">{videoFile.name}</p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">{formatBytes(videoFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => setVideoFile(null)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors text-xs"
                      title={locale === "en" ? "Remove video" : "Hapus file video"}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => videoInputRef.current?.click()}
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

              {/* Dropzone 2: Gambar Thumbnail dari PC */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <span>🖼️</span>
                  <span>{locale === "en" ? "Thumbnail Image (.png, .jpg, .webp)" : "Gambar Thumbnail (.png, .jpg, .webp)"}</span>
                </label>
                <input
                  type="file"
                  ref={thumbInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setThumbnailFile(file);
                  }}
                />

                {thumbnailFile ? (
                  <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/70 dark:bg-purple-950/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {thumbPreviewUrl && (
                        <img
                          src={thumbPreviewUrl}
                          alt="Thumbnail preview"
                          className="w-10 h-10 object-cover rounded-lg border border-purple-300 dark:border-purple-800 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate">{thumbnailFile.name}</p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">{formatBytes(thumbnailFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => setThumbnailFile(null)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors text-xs"
                      title={locale === "en" ? "Remove thumbnail" : "Hapus gambar thumbnail"}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => thumbInputRef.current?.click()}
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

          {/* 4. Indikator Progress & Error */}
          {isUploading && (
            <div className="space-y-2 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-700 dark:text-blue-300 animate-pulse">{progressStatus}</span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-blue-900/50 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
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
                {locale === "en"
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
                  <span>{locale === "en" ? "Open Folder in Google Drive" : "Buka Folder di Google Drive"}</span>
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
              disabled={isUploading || !driveConnected}
              onClick={handleUploadSubmit}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <span>☁️</span>
              <span>
                {isUploading
                  ? locale === "en"
                    ? "Uploading Package..."
                    : "Mengunggah Paket..."
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
