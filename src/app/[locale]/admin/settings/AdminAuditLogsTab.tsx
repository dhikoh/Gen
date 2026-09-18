"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface AuditLogItem {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  ip?: string | null;
  createdAt: string;
}

export default function AdminAuditLogsTab() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchLogs() {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: "10",
        });
        if (filterAction.trim()) query.set("action", filterAction.trim());

        const res = await fetch(`/api/admin/audit-logs?${query.toString()}`);
        if (!res.ok) throw new Error("Failed to load audit logs");
        const data = await res.json();
        if (!ignore) {
          setLogs(data.logs || []);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Audit log load error:", err);
          toast.error("Gagal memuat log audit");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchLogs();
    return () => {
      ignore = true;
    };
  }, [page, filterAction]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold pg-text-heading">Riwayat Audit Sistem</h2>
          <p className="text-sm pg-text-muted mt-1">
            Catatan kronologis seluruh aksi krusial admin untuk transparansi dan akuntabilitas.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Cari aksi (mis: PLAN, USER)..."
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setPage(1);
            }}
            className="neu-input text-sm px-3 py-1.5 w-full sm:w-56"
          />
        </div>
      </div>

      <div className="neu-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b pg-border bg-[var(--pg-surface-dim)]/50 text-xs font-semibold uppercase pg-text-muted">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Aktor</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y pg-divide">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center pg-text-muted">
                    Memuat riwayat audit...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center pg-text-muted">
                    Belum ada log audit yang tercatat.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--pg-surface-dim)]/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs pg-text-muted">
                      {new Date(log.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--pg-brand-light)] text-[var(--pg-brand)] border border-[var(--pg-brand)]/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono pg-text-sub">
                      {log.actorId.slice(0, 10)}...
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs pg-text-sub">
                      {log.targetType} {log.targetId ? `(${log.targetId.slice(0, 8)}...)` : ""}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono pg-text-muted">
                      {log.ip || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs text-[var(--pg-brand)] hover:underline font-medium"
                      >
                        Lihat Data
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t pg-border text-xs">
            <span className="pg-text-muted">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="neu-btn px-2.5 py-1 text-xs disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="neu-btn px-2.5 py-1 text-xs disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="pg-surface rounded-2xl border pg-border max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pg-border pb-3">
              <h3 className="font-bold text-base pg-text-heading">
                Detail Log: {selectedLog.action}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-sm pg-text-muted hover:pg-text-heading"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold pg-text-sub">Target:</span>{" "}
                <span className="pg-text-muted">{selectedLog.targetType} ({selectedLog.targetId || "N/A"})</span>
              </div>
              <div>
                <span className="font-semibold pg-text-sub">Waktu:</span>{" "}
                <span className="pg-text-muted">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
              {selectedLog.beforeData ? (
                <div>
                  <span className="font-semibold pg-text-sub block mb-1">Data Sebelumnya:</span>
                  <pre className="p-2 rounded bg-[var(--pg-surface-dim)] overflow-x-auto text-[11px] font-mono text-xs">
                    {JSON.stringify(selectedLog.beforeData, null, 2)}
                  </pre>
                </div>
              ) : null}
              {selectedLog.afterData ? (
                <div>
                  <span className="font-semibold pg-text-sub block mb-1">Data Sesudahnya:</span>
                  <pre className="p-2 rounded bg-[var(--pg-surface-dim)] overflow-x-auto text-[11px] font-mono text-xs">
                    {JSON.stringify(selectedLog.afterData, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="pt-3 border-t pg-border flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="neu-btn px-4 py-1.5 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
