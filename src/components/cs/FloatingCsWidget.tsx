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
  const t = useTranslations("CsWidget");
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
        setError(data.error || t("ticketCreateFail"));
      } else {
        setSuccess(true);
        setSubject(""); setMessage(""); setGuestName(""); setGuestEmail("");
      }
    } catch {
      setError(t("ticketCreateFail"));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-1.5 text-xs rounded-lg outline-none neu-input";
  const labelCls = "block text-xs font-medium mb-1";

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50">
      {/* Ticket Modal */}
      {isOpen && settings.csMode === "TICKET" && (
        <div className="mb-4 w-80 sm:w-96 neu-flat rounded-2xl p-5 pg-fade-in">
          <div className="flex justify-between items-center pb-3 mb-4" style={{ borderBottom: '1px solid var(--pg-shadow-dark)' }}>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--pg-text)' }}>
                <span>💬</span> {t("title")}
              </h3>
              {settings.csOperatingHours && (
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--pg-text-sub)' }}>
                  🕒 {settings.csOperatingHours}
                </p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-lg leading-none transition-colors"
              style={{ color: 'var(--pg-text-muted)' }}
            >
              ✕
            </button>
          </div>

          {success ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl"
                style={{ background: 'rgba(0,184,148,0.15)', color: 'var(--pg-success)' }}>
                ✓
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--pg-text)' }}>{t("successTitle")}</p>
              <p className="text-xs mb-4" style={{ color: 'var(--pg-text-sub)' }}>{t("successDesc")}</p>
              <button
                onClick={() => setSuccess(false)}
                className="text-xs font-semibold"
                style={{ color: 'var(--pg-brand)' }}
              >
                {t("sendAnotherTicket")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-3">
              {error && (
                <div className="p-2.5 text-xs rounded-lg" style={{ background: 'rgba(225,112,85,0.12)', color: 'var(--pg-danger)' }}>
                  {error}
                </div>
              )}
              {!session && (
                <>
                  <div>
                    <label className={labelCls} style={{ color: 'var(--pg-text-sub)' }}>{t("guestName")}</label>
                    <input type="text" required value={guestName} onChange={(e) => setGuestName(e.target.value)}
                      placeholder={t("namePlaceholder")} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: 'var(--pg-text-sub)' }}>{t("guestEmail")}</label>
                    <input type="email" required value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder={t("emailPlaceholder")} className={inputCls} />
                  </div>
                </>
              )}
              <div>
                <label className={labelCls} style={{ color: 'var(--pg-text-sub)' }}>{t("subject")}</label>
                <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("subjectPlaceholder")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--pg-text-sub)' }}>{t("message")}</label>
                <textarea required rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("messagePlaceholder")} className={`${inputCls} resize-none`} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 text-white font-medium rounded-lg text-xs disabled:opacity-50 flex items-center justify-center neu-btn-brand"
              >
                {loading
                  ? <span className="pg-spin inline-block mr-1 border-2 border-white/20 border-t-white rounded-full w-3.5 h-3.5" />
                  : t("submitBtn")}
              </button>
            </form>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={handleWidgetClick}
        aria-label="Customer Support Widget"
        className="flex items-center gap-2.5 px-4 py-3 text-white font-medium rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 neu-btn-brand"
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
