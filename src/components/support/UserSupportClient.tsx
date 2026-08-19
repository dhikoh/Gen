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
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export default function UserSupportClient() {
  const t = useTranslations("Support");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);

  // New ticket modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
      console.error("Failed to send reply:", err);
    } finally {
      setReplying(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newSubject,
          message: newMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat tiket.");
      } else {
        setShowNewModal(false);
        setNewSubject("");
        setNewMessage("");
        await fetchTickets();
      }
    } catch (err) {
      setError("Kesalahan jaringan.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("desc")}</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-all shadow-sm flex items-center gap-2"
        >
          {t("createTicket")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List Column */}
        <div className="lg:col-span-1 glass-panel rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 space-y-3 max-h-[75vh] overflow-y-auto">
          <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider px-2">
            Daftar Tiket ({tickets.length})
          </h2>

          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-500 animate-pulse">Memuat tiket...</div>
          ) : tickets.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">{t("noTickets")}</div>
          ) : (
            tickets.map((ticket) => {
              const badge = getTicketStatusBadge(ticket.status);
              const isSelected = selectedTicket?.id === ticket.id;
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
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-white truncate max-w-[200px]">
                      {ticket.subject}
                    </h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                      {t(badge.labelKey as any)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400">
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
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start">
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
                    ID Tiket: #{selectedTicket.id} • Dibuat: {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2 custom-scrollbar">
                {selectedTicket.messages?.map((msg) => {
                  const isAdmin = msg.senderRole === "SUPERADMIN";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          isAdmin
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-tl-none border border-zinc-200 dark:border-zinc-700"
                            : "bg-blue-600 text-white rounded-tr-none"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold opacity-80">
                            {isAdmin ? "👨‍💼 Admin Support" : "👤 Anda"}
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
              {selectedTicket.status === "CLOSED" ? (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  🔒 Tiket ini telah ditutup oleh Admin.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={t("replyPlaceholder")}
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
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">
              <span className="text-4xl mb-2">💬</span>
              <p>Pilih tiket dari daftar di sebelah kiri untuk melihat percakapan.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{t("createTicket")}</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("subject")}
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Misal: Kendala pembayaran via transfer manual"
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("message")}
                </label>
                <textarea
                  required
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Jelaskan kendala Anda secara rinci..."
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? (
                    <span className="inline-block animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4" />
                  ) : (
                    "Kirim Tiket"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
