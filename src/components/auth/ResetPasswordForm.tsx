"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ResetPasswordForm() {
  const t = useTranslations("ResetPassword");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage({ type: "error", text: t("tokenMissing") });
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("passwordMismatch") });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || t("errorFallback") });
      } else {
        setMessage({ type: "success", text: data.message });
        setTimeout(() => {
          router.push(`/${document.documentElement.lang || "id"}/auth`);
        }, 2000);
      }
    } catch {
      setMessage({ type: "error", text: t("systemError") });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 text-sm font-medium outline-none transition-all neu-input pr-10";
  const labelCls = "block text-xs font-semibold mb-1.5";

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto p-6 neu-flat rounded-xl text-center">
        <p className="mb-4" style={{ color: 'var(--pg-danger)' }}>{message?.text}</p>
        <button
          onClick={() => router.push(`/${document.documentElement.lang || "id"}/auth`)}
          className="text-sm font-semibold"
          style={{ color: 'var(--pg-brand)' }}
        >
          {t("backToLogin")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 neu-flat rounded-xl">
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--pg-text)' }}>{t("title")}</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--pg-text-sub)' }}>{t("subtitle")}</p>

      {message && (
        <div
          className="mb-6 p-4 rounded-xl text-sm font-medium pg-fade-in"
          style={{
            background: message.type === "success" ? 'rgba(0,184,148,0.12)' : 'rgba(225,112,85,0.12)',
            color: message.type === "success" ? 'var(--pg-success)' : 'var(--pg-danger)',
            boxShadow: 'var(--pg-neu-sm)',
          }}
        >
          {message.text}
        </div>
      )}

      <form autoComplete="off" onSubmit={handleSubmit}>
        <fieldset disabled={loading || message?.type === "success"} className="space-y-4">
          <div>
            <label className={labelCls} style={{ color: 'var(--pg-text)' }}>
              {t("labelNew")}
            </label>
            <div className="relative">
              <input
                id="reset-new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: 'var(--pg-brand)' }}
              >
                {showPassword ? t("hide") : t("show")}
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls} style={{ color: 'var(--pg-text)' }}>
              {t("labelConfirm")}
            </label>
            <input
              id="reset-confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 text-sm font-medium outline-none transition-all neu-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-white font-semibold flex items-center justify-center gap-2 mt-6 disabled:opacity-60 neu-btn-brand"
          >
            {loading && (
              <span className="pg-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            )}
            {t("submit")}
          </button>
        </fieldset>
      </form>
    </div>
  );
}
