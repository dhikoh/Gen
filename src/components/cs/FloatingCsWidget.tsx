"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

interface CsSettings {
  csMode: "DIRECT_WHATSAPP" | "DIRECT_EMAIL" | "TICKET";
  csWhatsappNumber: string | null;
  csEmail: string | null;
  csOperatingHours: string | null;
  csWidgetEnabled: boolean;
}

export default function FloatingCsWidget() {
  const t = useTranslations("Support");
  const { data: session } = useSession();

  const [settings, setSettings] = useState<CsSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/support/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error("Failed to fetch CS settings:", err));
  }, []);

  if (!settings || !settings.csWidgetEnabled) {
    return null;
  }

  const handleWidgetClick = () => {
    if (settings.csMode === "DIRECT_WHATSAPP" && settings.csWhatsappNumber) {
      const cleanNumber = settings.csWhatsappNumber.replace(/\D/g, "");
      const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent("Halo CS Prompt Gen, saya butuh bantuan.")}`;
      window.open(waUrl, "_blank");
      return;
    }

    if (settings.csMode === "DIRECT_EMAIL" && settings.csEmail) {
      const mailUrl = `mailto:${settings.csEmail}?subject=${encodeURIComponent("Bantuan Prompt Gen")}`;
      window.open(mailUrl, "_blank");
      return;
    }

    setIsOpen(!isOpen);
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          guestName: session ? undefined : guestName,
          guestEmail: session ? undefined : guestEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat tiket.");
      } else {
        setSuccess(true);
        setSubject("");
        setMessage("");
        setGuestName("");
        setGuestEmail("");
      }
    } catch (err) {
      setError("Kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Slide up Ticket Modal */}
      {isOpen && settings.csMode === "TICKET" && (
        <div className="mb-4 w-80 sm:w-96 glass-panel rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-5 backdrop-blur-lg animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base flex items-center gap-2">
                <span>💬</span> {t("title")}
              </h3>
              {settings.csOperatingHours && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  🕒 {settings.csOperatingHours}
                </p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {success ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 text-xl">
                ✓
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                {t("ticketCreated")}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Tim kami akan merespons pesan Anda secepatnya.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Kirim Tiket Lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-3">
              {error && (
                <div className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              {!session && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("guestName")}
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Nama Anda"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("guestEmail")}
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("subject")}
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ringkasan masalah..."
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("message")}
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail kendala atau pertanyaan Anda..."
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <span className="inline-block animate-spin mr-1 border-2 border-white/20 border-t-white rounded-full w-3.5 h-3.5" />
                ) : (
                  t("createTicket")
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Floating Action Trigger Button */}
      <button
        onClick={handleWidgetClick}
        aria-label="Customer Support Widget"
        className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95"
      >
        <span className="text-xl">💬</span>
        <span className="text-sm font-semibold hidden sm:inline">
          {settings.csMode === "DIRECT_WHATSAPP"
            ? "WhatsApp CS"
            : settings.csMode === "DIRECT_EMAIL"
            ? "Email CS"
            : "Customer Service"}
        </span>
      </button>
    </div>
  );
}
