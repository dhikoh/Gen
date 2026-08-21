"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ForgotPasswordForm() {
  const t = useTranslations("ForgotPassword");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "id";
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || t("errorFallback") });
      } else {
        setMessage({ type: "success", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: t("systemError") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => router.push(`/${locale}/auth`)}
        className="flex items-center gap-1.5 text-xs font-semibold mb-6"
        style={{ color: "var(--pg-text-sub)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {t("backToLogin")}
      </button>

      {/* Header */}
      <div className="text-center mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl text-white mx-auto mb-3"
          style={{ background: "var(--pg-brand)", boxShadow: "0 4px 16px var(--pg-brand-glow)" }}
        >
          🔑
        </div>
        <h2 className="text-lg font-bold mb-1" style={{ color: "var(--pg-text)" }}>
          {t("title")}
        </h2>
        <p className="text-xs" style={{ color: "var(--pg-text-sub)" }}>
          {t("subtitle")}
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className="mb-5 p-4 rounded-xl text-sm font-medium pg-fade-in"
          style={{
            background: message.type === "success" ? "rgba(0,184,148,0.12)" : "rgba(225,112,85,0.12)",
            color: message.type === "success" ? "var(--pg-success)" : "var(--pg-danger)",
            boxShadow: "var(--pg-neu-sm)",
          }}
        >
          {message.type === "success" ? "✅" : "⚠️"} {message.text}
        </div>
      )}

      {/* Form */}
      <form autoComplete="off" onSubmit={handleSubmit}>
        <fieldset disabled={loading} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--pg-text-sub)" }}
              htmlFor="forgot-password-identifier"
            >
              {t("label")}
            </label>
            <input
              type="text"
              id="forgot-password-identifier"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-sm font-medium outline-none transition-all neu-input"
              placeholder={t("placeholder")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-white font-semibold flex items-center justify-center gap-2 mt-6 disabled:opacity-60 neu-btn-brand"
          >
            {loading ? (
              <span className="pg-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              "📩"
            )}
            {t("submit")}
          </button>
        </fieldset>
      </form>
    </div>
  );
}
