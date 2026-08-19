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
      if (res.ok) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const loadTicketDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedTicket(data.ticket);
      }
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

      if (res.ok) {
        setReplyBody("");
        await loadTicketDetail(selectedTicket.id);
        await fetchTickets();
      }
    } catch (err) {
      console.error("Failed to send admin reply:", err);
    } finally {
      setReplying(false);
    }
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

      if (res.ok) {
        await loadTicketDetail(selectedTicket.id);
        await fetchTickets();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const repliedCount = tickets.filter((t) => t.status === "REPLIED").length;
  const closedCount = tickets.filter((t) => t.status === "CLOSED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Manajemen Tiket Support</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Verifikasi dan balasan tiket bantuan pengguna Prompt Gen secara terpusat.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10">
          <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wider">Tiket Baru (Open)</div>
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">{openCount}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10">
          <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold uppercase tracking-wider">Telah Dibalas (Replied)</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{repliedCount}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10">
          <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold uppercase tracking-wider">Selesai (Closed)</div>
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{closedCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        {["ALL", "OPEN", "REPLIED", "CLOSED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === st
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {st === "ALL" ? "Semua Tiket" : t(`status${st}` as any)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List Column */}
        <div className="lg:col-span-1 glass-panel rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 space-y-3 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-500 animate-pulse">Memuat tiket...</div>
          ) : tickets.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">Tidak ada tiket sesuai filter.</div>
          ) : (
            tickets.map((ticket) => {
              const badge = getTicketStatusBadge(ticket.status);
              const isSelected = selectedTicket?.id === ticket.id;
              const senderName = ticket.user?.name || ticket.guestName || "Guest User";
              const senderEmail = ticket.user?.email || ticket.guestEmail || "-";

              return (
                <div
                  key={ticket.id}
                  onClick={() => loadTicketDetail(ticket.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-white truncate max-w-[180px]">
                      {ticket.subject}
                    </h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                      {t(badge.labelKey as any)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 truncate">{senderName} ({senderEmail})</p>
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2">
                    <span>#{ticket.id.slice(-6)}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Conversation Thread Column */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[500px] max-h-[75vh]">
          {selectedTicket ? (
            <>
              {/* Thread Header */}
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{selectedTicket.subject}</h2>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        getTicketStatusBadge(selectedTicket.status).className
                      }`}
                    >
                      {t(getTicketStatusBadge(selectedTicket.status).labelKey as any)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Pengirim: <strong className="text-zinc-700 dark:text-zinc-300">{selectedTicket.user?.name || selectedTicket.guestName || "Guest"}</strong> ({selectedTicket.user?.email || selectedTicket.guestEmail || "-"})
                    • #{selectedTicket.id}
                  </p>
                </div>

                {/* Admin Status Actions */}
                <div className="flex items-center gap-2">
                  {selectedTicket.status !== "CLOSED" ? (
                    <button
                      onClick={() => handleUpdateStatus("CLOSED")}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                    >
                      {t("closeTicket")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus("OPEN")}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                    >
                      {t("reopenTicket")}
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2 custom-scrollbar">
                {selectedTicket.messages?.map((msg) => {
                  const isAdmin = msg.senderRole === "SUPERADMIN";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          isAdmin
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-tl-none border border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold opacity-80">
                            {isAdmin ? "👨‍💼 Anda (Superadmin)" : `👤 ${selectedTicket.user?.name || selectedTicket.guestName || "User"}`}
                          </span>
                          <span className="text-[10px] opacity-60">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
                <input
                  type="text"
                  required
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Ketik balasan resmi admin di sini..."
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
                <button
                  type="submit"
                  disabled={replying}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center"
                >
                  {replying ? (
                    <span className="inline-block animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4" />
                  ) : (
                    t("sendMsg")
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">
              <span className="text-4xl mb-2">💬</span>
              <p>Pilih tiket dari daftar di sebelah kiri untuk merespons.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
