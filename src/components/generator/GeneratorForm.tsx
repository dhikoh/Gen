"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GeneratorForm() {
  const router = useRouter();
  const [type, setType] = useState<"VIDEO" | "IMAGE">("VIDEO");
  const [topic, setTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, topic, additionalContext })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal membuat prompt.");
      } else {
        // Pretty print the JSON output
        setResult(JSON.stringify(data.data, null, 2));
        
        // Optional: you could refresh the router if you want to update usage stats in a sidebar
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Kolom Form Input */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 h-fit">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Parameter Konten</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate}>
          <fieldset disabled={loading} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Jenis Prompt
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "VIDEO" | "IMAGE")}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white appearance-none"
              >
                <option value="VIDEO">Konten Video (TikTok, Reels, Shorts)</option>
                <option value="IMAGE">Konten Gambar (Midjourney, DALL-E)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Topik Utama
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                placeholder="Misal: Cara cepat belajar Next.js untuk pemula"
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Konteks Tambahan (Opsional)
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Detail spesifik, gaya bahasa, atau audiens target..."
                rows={4}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center mt-6"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-2 border-2 border-white/20 border-t-white rounded-full w-5 h-5" />
                  Memproses AI...
                </>
              ) : (
                "Generate Prompt"
              )}
            </button>
          </fieldset>
        </form>
      </div>

      {/* Kolom Hasil */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Hasil Generate</h2>
          {result && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Tersimpan di Draft
            </span>
          )}
        </div>
        
        <div className="flex-1 relative border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-950">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
              <div className="w-10 h-10 border-4 border-zinc-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="animate-pulse">Mesin AI sedang berpikir...</p>
            </div>
          ) : result ? (
            <textarea
              readOnly
              value={result}
              className="w-full h-full p-4 bg-transparent text-sm font-mono text-zinc-800 dark:text-zinc-200 outline-none resize-none"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm p-8 text-center">
              Hasil prompt akan muncul di sini setelah Anda menekan tombol Generate.
            </div>
          )}
        </div>

        {result && (
          <div className="mt-4 flex justify-end space-x-3">
            <button 
              onClick={() => navigator.clipboard.writeText(result)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 transition-colors"
            >
              Salin Teks
            </button>
            <button 
              onClick={() => router.push("/id/dashboard/drafts")}
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-md transition-colors"
            >
              Lihat di Draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
