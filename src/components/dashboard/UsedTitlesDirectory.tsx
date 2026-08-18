"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface UsedTitlesDirectoryProps {
  channelId: string;
}

interface TitleInfo {
  title: string;
  type: string;
  createdAt: string;
  id: string;
}

export default function UsedTitlesDirectory({ channelId }: UsedTitlesDirectoryProps) {
  const [titles, setTitles] = useState<TitleInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"VIDEO" | "IMAGE">("VIDEO");
  
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  const fetchTitles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drafts/export?channelId=${channelId}&type=${type}&format=json`);
      if (res.ok) {
        const data = await res.json();
        setTitles(data.titles || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTitles();
  }, [channelId, type]);

  const handleExportCSV = () => {
    window.location.href = `/api/drafts/export?channelId=${channelId}&type=${type}&format=csv`;
  };

  const handleImport = async () => {
    if (!importText.trim()) return toast.error("Please enter some titles");
    const rawTitles = importText.split("\n").map(t => t.trim()).filter(Boolean);
    if (rawTitles.length === 0) return toast.error("No valid titles found");
    
    setImporting(true);
    try {
      const res = await fetch("/api/drafts/import-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          type,
          titles: rawTitles
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Imported ${data.importedCount} new titles`);
        setImportModal(false);
        setImportText("");
        fetchTitles();
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch (e) {
      toast.error("Network error");
    }
    setImporting(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 glass-panel">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Used Titles Directory</h3>
        <div className="flex gap-2">
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as "VIDEO" | "IMAGE")}
            className="px-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md"
          >
            <option value="VIDEO">Video Drafts</option>
            <option value="IMAGE">Image Drafts</option>
          </select>
          <button 
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            Export CSV
          </button>
          <button 
            onClick={() => setImportModal(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Import Titles
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-96 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        {loading ? (
          <div className="p-4 text-center text-sm text-zinc-500">Loading...</div>
        ) : titles.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-500">No titles found for this category.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 sticky top-0">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium w-32">Date</th>
                <th className="px-4 py-2 font-medium text-right w-24">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {titles.map(t => (
                <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-2 text-zinc-900 dark:text-white truncate max-w-md" title={t.title}>
                    {t.title || "Untitled"}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{new Date(t.createdAt).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-2 text-right">
                    <a href={`/dashboard/drafts/${t.id}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-bold text-lg mb-4">Import Titles ({type})</h3>
            <p className="text-sm text-zinc-500 mb-4">Paste multiple titles here, one per line. Duplicates will be ignored. Max 200 titles per request.</p>
            <textarea 
              className="w-full h-48 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm mb-4"
              placeholder="Title 1&#10;Title 2&#10;..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setImportModal(false)}
                className="px-4 py-2 text-sm text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
