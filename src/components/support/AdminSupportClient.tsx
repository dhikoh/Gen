"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { getTicketStatusBadge } from "@/lib/enumMapping";

interface Message {
  id: string;
  senderRole: string;
  body: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: "OPEN" | "REPLIED" | "CLOSED";
  guestName?: string | null;
  guestEmail?: string | null;
  user?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export default function AdminSupportClient() {
  const t = useTranslations("Support");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const url = statusFilter === "ALL" ? "/api/support/tickets" : `/api/support/tickets?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch admin tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const loadTicketDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      const data = await res.json();
      if (res.ok) setSelectedTicket(data.ticket);
    } catch (err) {
      console.error("Failed to load ticket detail:", err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyBody.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      if (res.ok) { setReplyBody(""); await loadTicketDetail(selectedTicket.id); await fetchTickets(); }
    } catch (err) { console.error("Failed to send admin reply:", err); }
    finally { setReplying(false); }
  };

  const handleUpdateStatus = async (newStatus: "OPEN" | "REPLIED" | "CLOSED") => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { await loadTicketDetail(selectedTicket.id); await fetchTickets(); }
    } catch (err) { console.error("Failed to update status:", err); }
    finally { setUpdatingStatus(false); }
  };

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const repliedCount = tickets.filter((t) => t.status === "REPLIED").length;
  const closedCount = tickets.filter((t) => t.status === "CLOSED").length;

  const panelCls = "neu-flat rounded-xl";
  const divider = { borderTop: '1px solid var(--pg-shadow-dark)' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--pg-text)' }}>Manajemen Tiket Support</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--pg-text-sub)' }}>
          Verifikasi dan balasan tiket bantuan pengguna Prompt Gen secara terpusat.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Tiket Baru (Open)', count: openCount, color: 'var(--pg-warn)' },
          { label: 'Telah Dibalas (Replied)', count: repliedCount, color: 'var(--pg-brand)' },
          { label: 'Selesai (Closed)', count: closedCount, color: 'var(--pg-success)' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`${panelCls} p-4`}>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: 'var(--pg-text)' }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 pb-2" style={{ borderBottom: '1px solid var(--pg-shadow-dark)' }}>
        {["ALL", "OPEN", "REPLIED", "CLOSED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: statusFilter === st ? 'var(--pg-brand)' : 'transparent',
              color: statusFilter === st ? '#fff' : 'var(--pg-text-sub)',
            }}
          >
            {st === "ALL" ? "Semua Tiket" : t(`status${st}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className={`${panelCls} p-4 space-y-3 max-h-[75vh] overflow-y-auto lg:col-span-1`}>
          {loading ? (
            <div className="py-8 text-center text-sm animate-pulse" style={{ color: 'var(--pg-text-muted)' }}>Memuat tiket...</div>
          ) : tickets.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--pg-text-muted)' }}>Tidak ada tiket sesuai filter.</div>
          ) : tickets.map((ticket) => {
            const badge = getTicketStatusBadge(ticket.status);
            const isSelected = selectedTicket?.id === ticket.id;
            const senderName = ticket.user?.name || ticket.guestName || "Guest User";
            const senderEmail = ticket.user?.email || ticket.guestEmail || "-";
            return (
              <div
                key={ticket.id}
                onClick={() => loadTicketDetail(ticket.id)}
                className="p-3.5 rounded-xl border transition-all cursor-pointer"
                style={{
                  borderColor: isSelected ? 'var(--pg-brand)' : 'var(--pg-shadow-dark)',
                  background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-sm truncate max-w-[180px]" style={{ color: 'var(--pg-text)' }}>{ticket.subject}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                    {t(badge.labelKey as Parameters<typeof t>[0])}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--pg-text-sub)' }}>{senderName} ({senderEmail})</p>
                <div className="flex justify-between items-center text-[10px] mt-2" style={{ color: 'var(--pg-text-muted)' }}>
                  <span>#{ticket.id.slice(-6)}</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thread */}
        <div className={`${panelCls} p-6 flex flex-col min-h-[500px] max-h-[75vh] lg:col-span-2`}>
          {selectedTicket ? (
            <>
              <div className="pb-4 mb-4 flex justify-between items-start gap-4" style={divider}>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--pg-text)' }}>{selectedTicket.subject}</h2>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getTicketStatusBadge(selectedTicket.status).className}`}>
                      {t(getTicketStatusBadge(selectedTicket.status).labelKey as Parameters<typeof t>[0])}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--pg-text-muted)' }}>
                    Pengirim: <strong style={{ color: 'var(--pg-text-sub)' }}>{selectedTicket.user?.name || selectedTicket.guestName || "Guest"}</strong> ({selectedTicket.user?.email || selectedTicket.guestEmail || "-"})
                    • #{selectedTicket.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTicket.status !== "CLOSED" ? (
                    <button onClick={() => handleUpdateStatus("CLOSED")} disabled={updatingStatus}
                      className="px-3 py-1.5 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
                      style={{ background: 'var(--pg-success)' }}>
                      {t("closeTicket")}
                    </button>
                  ) : (
                    <button onClick={() => handleUpdateStatus("OPEN")} disabled={updatingStatus}
                      className="px-3 py-1.5 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
                      style={{ background: 'var(--pg-warn)' }}>
                      {t("reopenTicket")}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
                {selectedTicket.messages?.map((msg) => {
                  const isAdmin = msg.senderRole === "SUPERADMIN";
                  return (
                    <div key={msg.id} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isAdmin ? "bg-[var(--pg-brand)] text-white rounded-tr-none" : "rounded-tl-none"}`}
                        style={!isAdmin ? { background: 'var(--pg-surface)', border: '1px solid var(--pg-shadow-dark)', color: 'var(--pg-text)' } : {}}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold opacity-80">
                            {isAdmin ? "👨‍💼 Anda (Superadmin)" : `👤 ${selectedTicket.user?.name || selectedTicket.guestName || "User"}`}
                          </span>
                          <span className="text-[10px] opacity-60">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendReply} className="pt-4 flex gap-2" style={divider}>
                <input type="text" required value={replyBody} onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Ketik balasan resmi admin di sini..."
                  className="flex-1 px-4 py-2.5 text-sm outline-none neu-input rounded-lg" />
                <button type="submit" disabled={replying}
                  className="px-5 py-2.5 text-white font-medium rounded-lg text-sm disabled:opacity-50 flex items-center neu-btn-brand">
                  {replying ? <span className="pg-spin inline-block border-2 border-white/20 border-t-white rounded-full w-4 h-4" /> : t("sendMsg")}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-sm" style={{ color: 'var(--pg-text-muted)' }}>
              <span className="text-4xl mb-2">💬</span>
              <p>Pilih tiket dari daftar di sebelah kiri untuk merespons.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
