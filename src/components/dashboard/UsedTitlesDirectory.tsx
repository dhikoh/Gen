"use client";
import { useState, useEffect, useCallback } from "react";
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
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"VIDEO" | "IMAGE">("VIDEO");

  // Import modal
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const t = useTranslations("UsedTitles");

  const fetchTitles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/drafts/export?channelId=${channelId}&type=${type}&format=json&_t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setTitles(data.titles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [channelId, type]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/drafts/export?channelId=${channelId}&type=${type}&format=json&_t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (res.ok && !ignore) {
          const data = await res.json();
          setTitles(data.titles || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [channelId, type]);

  // ── Export handlers ──────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const a = document.createElement("a");
    a.href = `/api/drafts/export?channelId=${channelId}&type=${type}&format=csv`;
    a.download = `used-titles-${channelId}-${type.toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(
        titles.map((t) => t.title),
        null,
        2
      )
    )}`;
    const a = document.createElement("a");
    a.setAttribute("href", jsonString);
    a.setAttribute("download", `used-titles-${channelId}-${type.toLowerCase()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ── Import handler ───────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!importText.trim()) return toast.error(t("enterTitles"));
    let rawTitles: string[] = [];
    const trimmed = importText.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed))
          rawTitles = parsed.map((t) => String(t).trim()).filter(Boolean);
      } catch {
        rawTitles = trimmed
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    } else {
      rawTitles = trimmed
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    if (rawTitles.length === 0) return toast.error(t("noValidTitles"));
    setImporting(true);
    try {
      const res = await fetch("/api/drafts/import-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, type, titles: rawTitles }),
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
    } catch {
      toast.error(t("networkError"));
    }
    setImporting(false);
  };

  // ── Delete handler ───────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/used-titles/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("deleteSuccess"));
        setTitles((prev) => prev.filter((t) => t.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || t("deleteFailed"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Edit handlers ────────────────────────────────────────────────────────────

  const startEdit = (row: TitleInfo) => {
    setEditingId(row.id);
    setEditValue(row.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/used-titles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("editSuccess"));
        setTitles((prev) =>
          prev.map((row) => (row.id === id ? { ...row, title: trimmed } : row))
        );
        cancelEdit();
      } else {
        toast.error(data.error || t("editFailed"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────────

  const btnCls = "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors neu-btn";
  const actionBtnCls =
    "px-2 py-0.5 text-xs font-medium rounded transition-colors";

  return (
    <div className="neu-flat p-6 rounded-xl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className="text-lg font-bold" style={{ color: "var(--pg-text)" }}>
          {t("title")}
        </h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "VIDEO" | "IMAGE")}
            className="px-3 py-1.5 text-xs rounded-lg outline-none neu-input"
          >
            <option value="VIDEO">{t("videoDrafts")}</option>
            <option value="IMAGE">{t("imageDrafts")}</option>
          </select>
          <button
            onClick={handleExportCSV}
            className={btnCls}
            style={{ color: "var(--pg-text-sub)" }}
          >
            {t("exportCsv")}
          </button>
          <button
            onClick={handleExportJSON}
            className={btnCls}
            style={{ color: "var(--pg-text-sub)" }}
          >
            {t("exportJson")}
          </button>
          <button
            onClick={() => setImportModal(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-white neu-btn-brand"
          >
            {t("importTitles")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto max-h-96 rounded-xl"
        style={{ border: "1px solid var(--pg-shadow-dark)" }}
      >
        {loading ? (
          <div
            className="p-4 text-center text-sm"
            style={{ color: "var(--pg-text-muted)" }}
          >
            {t("loading")}
          </div>
        ) : titles.length === 0 ? (
          <div
            className="p-4 text-center text-sm"
            style={{ color: "var(--pg-text-muted)" }}
          >
            {t("noTitles")}
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead
              className="sticky top-0"
              style={{ background: "var(--pg-surface)" }}
            >
              <tr>
                <th
                  className="px-4 py-2 font-semibold"
                  style={{ color: "var(--pg-text-sub)" }}
                >
                  {t("colTitle")}
                </th>
                <th
                  className="px-4 py-2 font-semibold w-28"
                  style={{ color: "var(--pg-text-sub)" }}
                >
                  {t("colDate")}
                </th>
                <th
                  className="px-4 py-2 font-semibold text-right w-28"
                  style={{ color: "var(--pg-text-sub)" }}
                >
                  {t("colActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {titles.map((tData) => (
                <tr
                  key={tData.id}
                  className="transition-colors"
                  style={{ borderTop: "1px solid var(--pg-shadow-dark)" }}
                >
                  {/* Title cell — editable inline */}
                  <td
                    className="px-4 py-2 max-w-md"
                    style={{ color: "var(--pg-text)" }}
                  >
                    {editingId === tData.id ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(tData.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="w-full px-2 py-0.5 text-sm rounded outline-none neu-input"
                        style={{ color: "var(--pg-text)" }}
                      />
                    ) : (
                      <span
                        className="truncate block max-w-md"
                        title={tData.title}
                      >
                        {tData.title || t("untitled")}
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td
                    className="px-4 py-2 whitespace-nowrap"
                    style={{ color: "var(--pg-text-muted)" }}
                  >
                    {new Date(tData.createdAt).toLocaleDateString("id-ID")}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-2 text-right">
                    {editingId === tData.id ? (
                      <span className="flex justify-end gap-1">
                        <button
                          onClick={() => handleSaveEdit(tData.id)}
                          disabled={savingEdit || !editValue.trim()}
                          className={`${actionBtnCls} text-white neu-btn-brand disabled:opacity-50`}
                        >
                          {savingEdit ? "…" : t("saveEdit")}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className={`${actionBtnCls} neu-btn`}
                          style={{ color: "var(--pg-text-sub)" }}
                        >
                          {t("cancelEdit")}
                        </button>
                      </span>
                    ) : (
                      <span className="flex justify-end gap-1">
                        <button
                          onClick={() => startEdit(tData)}
                          className={`${actionBtnCls} neu-btn`}
                          style={{ color: "var(--pg-brand)" }}
                          title={t("editTitle")}
                        >
                          {t("edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(tData.id)}
                          disabled={deletingId === tData.id}
                          className={`${actionBtnCls} neu-btn disabled:opacity-50`}
                          style={{ color: "var(--pg-danger, #e53e3e)" }}
                          title={t("delete")}
                        >
                          {deletingId === tData.id ? "…" : t("delete")}
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Import Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="neu-flat rounded-xl p-6 w-full max-w-lg">
            <h3 className="font-bold text-lg mb-4" style={{ color: "var(--pg-text)" }}>
              {t("importModalTitle", { type })}
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--pg-text-sub)" }}>
              {t("importDesc")}
            </p>
            <textarea
              className="w-full h-48 p-3 text-sm mb-4 font-mono outline-none resize-none neu-input rounded-lg"
              placeholder={
                '[\n  "China\'s Flood Just Unleashed a Literal Snake Nightmare",\n  "This Animal Gets Drunk on Purpose — And Scientists Are Jealous"\n]'
              }
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setImportModal(false)}
                className={btnCls}
                style={{ color: "var(--pg-text-sub)" }}
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 neu-btn-brand"
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
