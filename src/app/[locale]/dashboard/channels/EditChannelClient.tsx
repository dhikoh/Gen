"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditChannelClient({ channel }: { channel: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    channelName: channel?.channelName || "",
    niche: channel?.niche || "",
    description: channel?.description || "",
    visualAesthetic: channel?.visualAesthetic || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/channels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Profil Channel berhasil diperbarui.");
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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Channel / Akun</label>
        <input 
          type="text"
          name="channelName"
          required
          value={formData.channelName}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Niche Topik</label>
        <input 
          type="text"
          name="niche"
          placeholder="Misal: Edukasi Bisnis, Review Gadget"
          value={formData.niche}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Deskripsi & Ciri Khas</label>
        <textarea 
          name="description"
          rows={3}
          placeholder="Jelaskan karakteristik konten yang biasa Anda buat"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Visual Aesthetic (Gaya Visual)</label>
        <input 
          type="text"
          name="visualAesthetic"
          placeholder="Misal: Minimalis, Cyberpunk, Cinematic"
          value={formData.visualAesthetic}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
        />
      </div>

      <div className="pt-4">
        <button 
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
