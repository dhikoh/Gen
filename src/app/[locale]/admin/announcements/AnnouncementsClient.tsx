"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  createdAt: string;
  user?: { name: string; email: string };
}

export default function AnnouncementsClient() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [target, setTarget] = useState<"ALL" | "PLAN" | "USER">("ALL");
  const [targetPlanCode, setTargetPlanCode] = useState("STANDARD");
  const [targetUserId, setTargetUserId] = useState("");

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch {
      toast.error("Gagal memuat histori pengumuman.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Judul dan Pesan wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          link: link.trim() || undefined,
          target,
          targetPlanCode: target === "PLAN" ? targetPlanCode : undefined,
          targetUserId: target === "USER" ? targetUserId.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengirim pengumuman.");
      }

      toast.success(data.message || "Pengumuman berhasil dikirim!");
      setTitle("");
      setMessage("");
      setLink("");
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Broadcast Pengumuman Sistem
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Kirim notifikasi in-app kepada seluruh pengguna atau kelompok pengguna tertentu secara langsung.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Buat Pengumuman Baru
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Judul Pengumuman *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pembaruan Fitur Prompt Gen v2.0 Telah Rilis!"
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Pesan Pengumuman *
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan isi pengumuman secara rinci..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Target Penerima
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as any)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Pengguna</option>
                <option value="PLAN">Pengguna Plan Spesifik</option>
                <option value="USER">Pengguna Tunggal (User ID)</option>
              </select>
            </div>

            {target === "PLAN" && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Pilih Paket Plan
                </label>
                <select
                  value={targetPlanCode}
                  onChange={(e) => setTargetPlanCode(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DEMO">Demo 3 Hari</option>
                  <option value="STANDARD">Standard</option>
                  <option value="PRO">Pro</option>
                  <option value="ULTRA">Ultra</option>
                </select>
              </div>
            )}

            {target === "USER" && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  User ID Spesifik
                </label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Masukkan CUID User"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tautan Opsional (URL Link)
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/dashboard/generator atau https://..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {submitting ? "Mengirim Pengumuman..." : "Kirim Broadcast Pengumuman"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Histori Pengumuman Terakhir
        </h2>
        {loading ? (
          <div className="py-8 text-center text-zinc-500">Memuat pengumuman...</div>
        ) : announcements.length === 0 ? (
          <div className="py-8 text-center text-zinc-500">Belum ada pengumuman yang dikirim.</div>
        ) : (
          <div className="space-y-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {announcements.map((item) => (
              <div key={item.id} className="pt-4 first:pt-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
                  <span className="text-xs text-zinc-400">
                    {new Date(item.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line">
                  {item.message}
                </p>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1"
                  >
                    Tautan: {item.link}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
