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
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchTitles(); }, [channelId, type]);

  const handleExportCSV = () => {
    window.location.href = `/api/drafts/export?channelId=${channelId}&type=${type}&format=csv`;
  };

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(titles.map(t => t.title), null, 2)
    )}`;
    const a = document.createElement("a");
    a.setAttribute("href", jsonString);
    a.setAttribute("download", `used-titles-${channelId}-${type.toLowerCase()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImport = async () => {
    if (!importText.trim()) return toast.error(t("enterTitles"));
    let rawTitles: string[] = [];
    const trimmed = importText.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) rawTitles = parsed.map(t => String(t).trim()).filter(Boolean);
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
        body: JSON.stringify({ channelId, type, titles: rawTitles })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("importSuccess", { count: data.importedCount }));
        setImportModal(false); setImportText(""); fetchTitles();
      } else {
        toast.error(data.error || t("importFailed"));
      }
    } catch { toast.error(t("networkError")); }
    setImporting(false);
  };

  const btnCls = "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors neu-btn";

  return (
    <div className="neu-flat p-6 rounded-xl">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className="text-lg font-bold" style={{ color: 'var(--pg-text)' }}>{t("title")}</h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "VIDEO" | "IMAGE")}
            className="px-3 py-1.5 text-xs rounded-lg outline-none neu-input"
          >
            <option value="VIDEO">{t("videoDrafts")}</option>
            <option value="IMAGE">{t("imageDrafts")}</option>
          </select>
          <button onClick={handleExportCSV} className={btnCls} style={{ color: 'var(--pg-text-sub)' }}>{t("exportCsv")}</button>
          <button onClick={handleExportJSON} className={btnCls} style={{ color: 'var(--pg-text-sub)' }}>{t("exportJson")}</button>
          <button onClick={() => setImportModal(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-white neu-btn-brand">
            {t("importTitles")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-96 rounded-xl" style={{ border: '1px solid var(--pg-shadow-dark)' }}>
        {loading ? (
          <div className="p-4 text-center text-sm" style={{ color: 'var(--pg-text-muted)' }}>{t("loading")}</div>
        ) : titles.length === 0 ? (
          <div className="p-4 text-center text-sm" style={{ color: 'var(--pg-text-muted)' }}>{t("noTitles")}</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0" style={{ background: 'var(--pg-surface)' }}>
              <tr>
                <th className="px-4 py-2 font-semibold" style={{ color: 'var(--pg-text-sub)' }}>{t("colTitle")}</th>
                <th className="px-4 py-2 font-semibold w-32" style={{ color: 'var(--pg-text-sub)' }}>{t("colDate")}</th>
                <th className="px-4 py-2 font-semibold text-right w-24" style={{ color: 'var(--pg-text-sub)' }}>{t("colLink")}</th>
              </tr>
            </thead>
            <tbody>
              {titles.map(tData => (
                <tr key={tData.id} className="transition-colors" style={{ borderTop: '1px solid var(--pg-shadow-dark)' }}>
                  <td className="px-4 py-2 truncate max-w-md" style={{ color: 'var(--pg-text)' }} title={tData.title}>
                    {tData.title || t("untitled")}
                  </td>
                  <td className="px-4 py-2" style={{ color: 'var(--pg-text-muted)' }}>{new Date(tData.createdAt).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-2 text-right">
                    <a href={`/dashboard/drafts/${tData.id}`} target="_blank" rel="noreferrer"
                      className="text-xs font-semibold" style={{ color: 'var(--pg-brand)' }}>{t("view")}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="neu-flat rounded-xl p-6 w-full max-w-lg">
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--pg-text)' }}>{t("importModalTitle", { type })}</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--pg-text-sub)' }}>{t("importDesc")}</p>
            <textarea
              className="w-full h-48 p-3 text-sm mb-4 font-mono outline-none resize-none neu-input rounded-lg"
              placeholder={'[\n  "China\'s Flood Just Unleashed a Literal Snake Nightmare",\n  "This Animal Gets Drunk on Purpose — And Scientists Are Jealous"\n]'}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setImportModal(false)} className={btnCls} style={{ color: 'var(--pg-text-sub)' }}>
                {t("cancel")}
              </button>
              <button onClick={handleImport} disabled={importing}
                className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 neu-btn-brand">
                {importing ? t("importing") : t("import")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
