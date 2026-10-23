"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

interface ChannelConnectionsClientProps {
  channelId: string;
  channelName: string;
}

interface ConnectionStatus {
  channelId: string;
  channelName: string;
  google: {
    connected: boolean;
    email?: string | null;
    driveFolderId?: string | null;
    driveFolderName?: string | null;
    youtubeChannelId?: string | null;
    youtubeChannelTitle?: string | null;
  };
  meta: {
    connected: boolean;
    fbPageId?: string | null;
    fbPageName?: string | null;
    igUserId?: string | null;
    igUsername?: string | null;
  };
}

export default function ChannelConnectionsClient({
  channelId,
  channelName,
}: ChannelConnectionsClientProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);
  const [disconnectingMeta, setDisconnectingMeta] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/channels/${channelId}/connections/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed fetching channel connections:", err);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle URL query feedback
  useEffect(() => {
    const connSuccess = searchParams.get("conn_success");
    const connError = searchParams.get("conn_error");

    if (connSuccess === "google_connected") {
      toast.success("Akun Google & Folder Drive channel berhasil terhubung!");
      fetchStatus();
    } else if (connError) {
      toast.error(`Gagal menghubungkan akun: ${connError}`);
    }
  }, [searchParams, fetchStatus]);

  const handleDisconnectGoogle = async () => {
    if (!confirm("Apakah Anda yakin ingin memutuskan integrasi Google Drive & YouTube untuk channel ini?")) {
      return;
    }
    try {
      setDisconnectingGoogle(true);
      const res = await fetch(`/api/channels/${channelId}/connections/google/disconnect`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal memutuskan koneksi");
      toast.success("Koneksi Google berhasil diputuskan.");
      await fetchStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  const handleDisconnectMeta = async () => {
    if (!confirm("Apakah Anda yakin ingin memutuskan integrasi Meta (Facebook & Instagram) untuk channel ini?")) {
      return;
    }
    try {
      setDisconnectingMeta(true);
      const res = await fetch(`/api/channels/${channelId}/connections/meta/disconnect`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal memutuskan koneksi");
      toast.success("Koneksi Meta berhasil diputuskan.");
      await fetchStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setDisconnectingMeta(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold pg-text-heading flex items-center gap-2">
          <span>🔗</span>
          <span>Integrasi Cloud Storage & Media Sosial Channel</span>
        </h3>
        <p className="text-xs pg-text-sub mt-0.5">
          Setiap profil channel memiliki koneksi akun mandiri. Video hasil generate akan disimpan dan diposting ke akun khusus channel ini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── KARTU GOOGLE ECOSYSTEM ── */}
        <div className="p-4 rounded-xl border pg-border bg-[var(--pg-surface)] hover:border-blue-400/40 transition-all flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <div>
                  <h4 className="text-sm font-bold pg-text-heading flex items-center gap-1.5">
                    Google Drive & YouTube
                  </h4>
                  <p className="text-[11px] pg-text-sub">Penyimpanan aset & channel video YouTube</p>
                </div>
              </div>
              {loading ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 animate-pulse">
                  Memeriksa...
                </span>
              ) : status?.google.connected ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Terhubung
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                  Belum Terhubung
                </span>
              )}
            </div>

            {status?.google.connected && (
              <div className="space-y-2 py-2 text-xs border-t pg-border">
                {status.google.email && (
                  <div className="flex items-center justify-between">
                    <span className="pg-text-sub">Akun Gmail:</span>
                    <span className="font-mono font-medium pg-text-heading truncate max-w-[180px]">
                      {status.google.email}
                    </span>
                  </div>
                )}
                {status.google.driveFolderName && (
                  <div className="flex items-center justify-between">
                    <span className="pg-text-sub">Folder Drive:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[180px]">
                      📂 {status.google.driveFolderName}
                    </span>
                  </div>
                )}
                {status.google.youtubeChannelTitle && (
                  <div className="flex items-center justify-between">
                    <span className="pg-text-sub">YouTube Channel:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400 truncate max-w-[180px]">
                      ▶️ {status.google.youtubeChannelTitle}
                    </span>
                  </div>
                )}
              </div>
            )}

            {!status?.google.connected && (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                Hubungkan akun Google channel ini untuk mengaktifkan backup video otomatis ke folder khusus dan fitur 1-Tombol Auto Upload ke YouTube.
              </p>
            )}
          </div>

          <div className="pt-3 border-t pg-border flex items-center justify-end gap-2">
            {status?.google.connected ? (
              <button
                type="button"
                onClick={handleDisconnectGoogle}
                disabled={disconnectingGoogle}
                className="px-3 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium transition-colors disabled:opacity-50"
              >
                {disconnectingGoogle ? "Memutuskan..." : "Putuskan Koneksi"}
              </button>
            ) : (
              <a
                href={`/api/auth/google-drive?channelId=${channelId}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors"
              >
                <span>🔑</span>
                <span>Hubungkan Akun Google</span>
              </a>
            )}
          </div>
        </div>

        {/* ── KARTU META ECOSYSTEM (FB & IG) ── */}
        <div className="p-4 rounded-xl border pg-border bg-[var(--pg-surface)] hover:border-purple-400/40 transition-all flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📸</span>
                <div>
                  <h4 className="text-sm font-bold pg-text-heading flex items-center gap-1.5">
                    Meta (Facebook & Instagram)
                  </h4>
                  <p className="text-[11px] pg-text-sub">Fanpage Facebook & Instagram Reels / Feed</p>
                </div>
              </div>
              {loading ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 animate-pulse">
                  Memeriksa...
                </span>
              ) : status?.meta.connected ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Terhubung
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                  Belum Terhubung
                </span>
              )}
            </div>

            {status?.meta.connected && (
              <div className="space-y-2 py-2 text-xs border-t pg-border">
                {status.meta.fbPageName && (
                  <div className="flex items-center justify-between">
                    <span className="pg-text-sub">Facebook Page:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[180px]">
                      📘 {status.meta.fbPageName}
                    </span>
                  </div>
                )}
                {status.meta.igUsername && (
                  <div className="flex items-center justify-between">
                    <span className="pg-text-sub">Instagram:</span>
                    <span className="font-semibold text-pink-600 dark:text-pink-400 truncate max-w-[180px]">
                      📸 @{status.meta.igUsername}
                    </span>
                  </div>
                )}
              </div>
            )}

            {!status?.meta.connected && (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                Hubungkan Fanpage Facebook & Instagram Business channel ini untuk auto-posting konten Reels dan Feed secara otomatis.
              </p>
            )}
          </div>

          <div className="pt-3 border-t pg-border flex items-center justify-end gap-2">
            {status?.meta.connected ? (
              <button
                type="button"
                onClick={handleDisconnectMeta}
                disabled={disconnectingMeta}
                className="px-3 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium transition-colors disabled:opacity-50"
              >
                {disconnectingMeta ? "Memutuskan..." : "Putuskan Koneksi"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  toast("Integrasi Meta App sedang dipersiapkan (menunggu App ID & Secret Meta Developer)", {
                    icon: "ℹ️",
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-semibold shadow-xs transition-all"
              >
                <span>📘</span>
                <span>Hubungkan Akun Meta</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
