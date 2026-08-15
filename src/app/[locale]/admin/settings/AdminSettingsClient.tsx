"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettingsClient({ settings }: { settings: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    heroTitle: settings?.heroTitle || "",
    heroSubtitle: settings?.heroSubtitle || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Pengaturan sistem berhasil diperbarui.");
        router.refresh();
      } else {
        alert(data.error || "Gagal menyimpan perubahan");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 space-y-6 max-w-2xl border border-zinc-200 dark:border-zinc-800">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Judul Hero (Landing Page)</label>
        <input 
          type="text"
          name="heroTitle"
          required
          value={formData.heroTitle}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sub-judul Hero</label>
        <textarea 
          name="heroSubtitle"
          rows={3}
          required
          value={formData.heroSubtitle}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
        />
      </div>

      <div className="pt-4">
        <button 
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
