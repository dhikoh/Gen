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
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (res.ok) setTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
    } catch (err) { console.error("Failed to send reply:", err); }
    finally { setReplying(false); }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setError(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: newSubject, message: newMessage }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("ticketCreateFail")); }
      else { setShowNewModal(false); setNewSubject(""); setNewMessage(""); await fetchTickets(); }
    } catch { setError(t("ticketCreateFail")); }
    finally { setCreating(false); }
  };

  const panelCls = "neu-flat rounded-xl border";
  const inputCls = "flex-1 px-4 py-2.5 text-sm outline-none neu-input";
  const dividerStyle = { borderColor: 'var(--pg-shadow-dark)' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pg-text)' }}>{t("title")}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--pg-text-sub)' }}>{t("desc")}</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="neu-btn-brand px-4 py-2 text-white font-medium rounded-lg text-sm flex items-center gap-2">
          {t("createTicket")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className={`${panelCls} p-4 space-y-3 max-h-[75vh] overflow-y-auto lg:col-span-1`}>
          <h2 className="text-xs font-bold uppercase tracking-wider px-2" style={{ color: 'var(--pg-text-sub)' }}>
            {t("ticketListHeader")} ({tickets.length})
          </h2>
          {loading ? (
            <div className="py-8 text-center text-sm animate-pulse" style={{ color: 'var(--pg-text-muted)' }}>{t("loadingTickets")}</div>
          ) : tickets.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: 'var(--pg-text-muted)' }}>{t("noTickets")}</div>
          ) : tickets.map((ticket) => {
            const badge = getTicketStatusBadge(ticket.status);
            const isSelected = selectedTicket?.id === ticket.id;
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
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="font-semibold text-sm truncate max-w-[200px]" style={{ color: 'var(--pg-text)' }}>{ticket.subject}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                    {t(badge.labelKey as Parameters<typeof t>[0])}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]" style={{ color: 'var(--pg-text-muted)' }}>
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
              <div className="pb-4 mb-4 flex justify-between items-start" style={{ borderBottom: '1px solid var(--pg-shadow-dark)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--pg-text)' }}>{selectedTicket.subject}</h2>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getTicketStatusBadge(selectedTicket.status).className}`}>
                      {t(getTicketStatusBadge(selectedTicket.status).labelKey as Parameters<typeof t>[0])}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--pg-text-muted)' }}>
                    ID Tiket: #{selectedTicket.id} • Dibuat: {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
                {selectedTicket.messages?.map((msg) => {
                  const isAdmin = msg.senderRole === "SUPERADMIN";
                  return (
                    <div key={msg.id} className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isAdmin ? "rounded-tl-none" : "rounded-tr-none bg-[var(--pg-brand)] text-white"}`}
                        style={isAdmin ? { background: 'var(--pg-surface)', border: '1px solid var(--pg-shadow-dark)', color: 'var(--pg-text)' } : {}}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold opacity-80">{isAdmin ? "👨‍💼 Admin Support" : "👤 Anda"}</span>
                          <span className="text-[10px] opacity-60">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTicket.status === "CLOSED" ? (
                <div className="pt-4 text-center text-xs" style={{ borderTop: '1px solid var(--pg-shadow-dark)', color: 'var(--pg-text-muted)', ...dividerStyle }}>
                  🔒 {t("ticketClosedMsg")}
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="pt-4 flex gap-2" style={{ borderTop: '1px solid var(--pg-shadow-dark)' }}>
                  <input type="text" required value={replyBody} onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={t("replyPlaceholder")} className={`${inputCls} rounded-lg`} />
                  <button type="submit" disabled={replying} className="neu-btn-brand px-5 py-2.5 text-white font-medium rounded-lg text-sm disabled:opacity-50 flex items-center">
                    {replying ? <span className="pg-spin inline-block border-2 border-white/20 border-t-white rounded-full w-4 h-4" /> : t("sendMsg")}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-sm" style={{ color: 'var(--pg-text-muted)' }}>
              <span className="text-4xl mb-2">💬</span>
              <p>{t("selectTicketHint")}</p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neu-flat rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid var(--pg-shadow-dark)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--pg-text)' }}>{t("createTicket")}</h3>
              <button onClick={() => setShowNewModal(false)} className="text-lg leading-none" style={{ color: 'var(--pg-text-muted)' }}>✕</button>
            </div>
            {error && (
              <div className="p-3 text-xs rounded-lg" style={{ background: 'rgba(225,112,85,0.12)', color: 'var(--pg-danger)' }}>{error}</div>
            )}
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--pg-text)' }}>{t("subject")}</label>
                <input type="text" required value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Misal: Kendala pembayaran via transfer manual"
                  className="w-full px-4 py-2 text-sm outline-none neu-input rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--pg-text)' }}>{t("message")}</label>
                <textarea required rows={4} value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Jelaskan kendala Anda secara rinci..."
                  className="w-full px-4 py-2 text-sm outline-none resize-none neu-input rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors neu-btn" style={{ color: 'var(--pg-text-sub)' }}>
                  {t("cancel")}
                </button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2 text-white font-medium rounded-lg text-sm disabled:opacity-50 flex items-center gap-2 neu-btn-brand">
                  {creating ? <span className="pg-spin inline-block border-2 border-white/20 border-t-white rounded-full w-4 h-4" /> : t("sendTicket")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
