"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface UsedTitlesDirectoryProps {
  channelId: string;
  channelName?: string;
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
  
  const t = useTranslations("UsedTitles");

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

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(titles.map(t => t.title), null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `used-titles-${channelId}-${type.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = async () => {
    if (!importText.trim()) return toast.error(t("enterTitles"));
    
    let rawTitles: string[] = [];
    const trimmed = importText.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          rawTitles = parsed.map(t => String(t).trim()).filter(Boolean);
        }
      } catch {
        rawTitles = trimmed.split("\n").map(t => t.trim()).filter(Boolean);
      }
    } else {
      rawTitles = trimmed.split("\n").map(t => t.trim()).filter(Boolean);
    }

    if (rawTitles.length === 0) return toast.error(t("noValidTitles"));
    
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
        toast.success(t("importSuccess", { count: data.importedCount }));
        setImportModal(false);
        setImportText("");
        fetchTitles();
      } else {
        toast.error(data.error || t("importFailed"));
      }
    } catch (e) {
      toast.error(t("networkError"));
    }
    setImporting(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 glass-panel">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t("title")}</h3>
        <div className="flex gap-2">
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as "VIDEO" | "IMAGE")}
            className="px-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md"
          >
            <option value="VIDEO">{t("videoDrafts")}</option>
            <option value="IMAGE">{t("imageDrafts")}</option>
          </select>
          <button 
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            {t("exportCsv")}
          </button>
          <button 
            onClick={handleExportJSON}
            className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            {t("exportJson")}
          </button>
          <button 
            onClick={() => setImportModal(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t("importTitles")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-96 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        {loading ? (
          <div className="p-4 text-center text-sm text-zinc-500">{t("loading")}</div>
        ) : titles.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-500">{t("noTitles")}</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 sticky top-0">
              <tr>
                <th className="px-4 py-2 font-medium">{t("colTitle")}</th>
                <th className="px-4 py-2 font-medium w-32">{t("colDate")}</th>
                <th className="px-4 py-2 font-medium text-right w-24">{t("colLink")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {titles.map(tData => (
                <tr key={tData.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-2 text-zinc-900 dark:text-white truncate max-w-md" title={tData.title}>
                    {tData.title || t("untitled")}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{new Date(tData.createdAt).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-2 text-right">
                    <a href={`/dashboard/drafts/${tData.id}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{t("view")}</a>
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
            <h3 className="font-bold text-lg mb-4">{t("importModalTitle", { type })}</h3>
            <p className="text-sm text-zinc-500 mb-4">{t("importDesc")}</p>
            <textarea 
              className="w-full h-48 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm mb-4 font-mono"
              placeholder={'[\n  "China\'s Flood Just Unleashed a Literal Snake Nightmare",\n  "This Animal Gets Drunk on Purpose — And Scientists Are Jealous"\n]'}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setImportModal(false)}
                className="px-4 py-2 text-sm text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded"
              >
                {t("cancel")}
              </button>
              <button 
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
              >
                {importing ? t("importing") : t("import")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
