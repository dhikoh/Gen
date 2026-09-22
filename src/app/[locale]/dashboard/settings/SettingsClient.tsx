"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

interface TtsKeyInfo {
  id: string;
  label: string | null;
  maskedKey: string;
  keyFingerprint: string;
  isActive: boolean;
  priority: number;
  lastUsedAt: string | null;
  lastErrorAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  totalSuccessCount: number;
  totalFailureCount: number;
  createdAt: string;
}

export default function SettingsClient() {
  const t = useTranslations("Settings");
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  // ── TTS API Key state ──
  const [ttsKeys, setTtsKeys] = useState<TtsKeyInfo[]>([]);
  const [ttsLoading, setTtsLoading] = useState(true);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [addingKey, setAddingKey] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/user/tts-keys");
      const data = await res.json();
      if (data.success) setTtsKeys(data.keys || []);
    } catch {} finally { setTtsLoading(false); }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingKey(true);
    try {
      const res = await fetch("/api/user/tts-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: newKeyValue, label: newKeyLabel || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(t("ttsKeyAdded"));
        setNewKeyValue("");
        setNewKeyLabel("");
        fetchKeys();
      } else {
        toast.error(data.error || t("ttsKeyAddFail"));
      }
    } catch { toast.error(t("generalError")); } finally { setAddingKey(false); }
  };

  const handleToggleKey = async (key: TtsKeyInfo) => {
    try {
      const res = await fetch(`/api/user/tts-keys/${key.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !key.isActive }),
      });
      if (res.ok) { fetchKeys(); toast.success(!key.isActive ? t("ttsKeyActivated") : t("ttsKeyDeactivated")); }
    } catch { toast.error(t("generalError")); }
  };

  const handleDeleteKey = async (key: TtsKeyInfo) => {
    if (!confirm(t("ttsKeyDeleteConfirm"))) return;
    try {
      const res = await fetch(`/api/user/tts-keys/${key.id}`, { method: "DELETE" });
      if (res.ok) { fetchKeys(); toast.success(t("ttsKeyDeleted")); }
    } catch { toast.error(t("generalError")); }
  };

  const handleMovePriority = async (key: TtsKeyInfo, direction: "up" | "down") => {
    const idx = ttsKeys.findIndex(k => k.id === key.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ttsKeys.length) return;
    const swapKey = ttsKeys[swapIdx];
    if (!swapKey) return;
    try {
      await Promise.all([
        fetch(`/api/user/tts-keys/${key.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority: swapKey.priority }),
        }),
        fetch(`/api/user/tts-keys/${swapKey.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority: key.priority }),
        }),
      ]);
      fetchKeys();
    } catch { toast.error(t("generalError")); }
  };

  const handleTestKey = async (key: TtsKeyInfo) => {
    setTestingKeyId(key.id);
    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Halo, ini pengujian suara.", voice: "Kore", model: "gemini-2.5-flash-preview-tts" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t("ttsKeyTestSuccess"));
      } else {
        toast.error(data.error || t("ttsKeyTestFail"));
      }
    } catch { toast.error(t("generalError")); } finally { setTestingKeyId(null); }
  };

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("ttsJustNow");
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMessage(t("profileUpdatedSuccess"));
      } else {
        setProfileMessage(data.error || t("profileUpdateFail"));
      }
    } catch {
      setProfileMessage(t("generalError"));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage("");
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage(t("passwordUpdatedSuccess"));
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordMessage(data.error || t("passwordUpdateFail"));
      }
    } catch {
      setPasswordMessage(t("generalError"));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <section className="pg-surface border pg-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold pg-text-heading mb-4">{t("profileTitle")}</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium pg-text-sub mb-1">{t("newNameLabel")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border pg-border rounded-lg bg-transparent pg-text-heading focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("newNamePlaceholder")}
              required
            />
          </div>
          <button
            type="submit"
            disabled={profileLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {profileLoading ? t("savingProfile") : t("saveProfile")}
          </button>
          {profileMessage && <p className="text-sm text-green-600 dark:text-green-400 mt-2">{profileMessage}</p>}
        </form>
      </section>

      {/* Password Section */}
      <section className="pg-surface border pg-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold pg-text-heading mb-4">{t("changePasswordTitle")}</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium pg-text-sub mb-1">{t("currentPasswordLabel")}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border pg-border rounded-lg bg-transparent pg-text-heading focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium pg-text-sub mb-1">{t("newPasswordLabel")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border pg-border rounded-lg bg-transparent pg-text-heading focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {passwordLoading ? t("savingPassword") : t("changePassword")}
          </button>
          {passwordMessage && <p className="text-sm pg-text-sub mt-2">{passwordMessage}</p>}
        </form>
      </section>

      {/* ── Voice Studio API Key Manager ─────────────────────────── */}
      <section className="pg-surface border pg-border rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-xl font-semibold pg-text-heading flex items-center gap-2">
            🎙️ {t("ttsApiKeysTitle")}
          </h2>
          <p className="text-sm pg-text-muted mt-1">{t("ttsApiKeysDesc")}</p>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
          >
            🔗 {t("ttsGetKeyLink")}
          </a>
        </div>

        {/* Key List */}
        {ttsLoading ? (
          <p className="text-sm pg-text-muted">{t("ttsLoading")}</p>
        ) : ttsKeys.length === 0 ? (
          <div className="text-center py-6 rounded-lg pg-surface-dim">
            <p className="text-3xl mb-2">🔑</p>
            <p className="text-sm pg-text-muted">{t("ttsNoKeys")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ttsKeys.map((key, idx) => (
              <div
                key={key.id}
                className={`rounded-lg p-4 border transition-colors ${
                  key.isActive
                    ? "pg-surface-dim pg-border"
                    : "bg-slate-100/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/30 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono pg-text-heading">{key.maskedKey}</span>
                      {key.label && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {key.label}
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        key.isActive
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      }`}>
                        {key.isActive ? t("ttsActive") : t("ttsInactive")}
                      </span>
                      <span className="text-[10px] pg-text-muted">#{idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] pg-text-muted flex-wrap">
                      <span>✅ {key.totalSuccessCount}</span>
                      <span>❌ {key.totalFailureCount}</span>
                      <span>{t("ttsLastUsed")}: {formatRelativeTime(key.lastUsedAt)}</span>
                    </div>
                    {key.lastErrorMessage && (
                      <p className="text-[10px] text-red-500 dark:text-red-400 truncate max-w-xs" title={key.lastErrorMessage}>
                        ⚠️ {key.lastErrorCode}: {key.lastErrorMessage}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => handleMovePriority(key, "up")} disabled={idx === 0}
                      className="text-xs px-1.5 py-1 rounded pg-surface-dim hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors" title={t("ttsMoveUp")}>▲</button>
                    <button type="button" onClick={() => handleMovePriority(key, "down")} disabled={idx === ttsKeys.length - 1}
                      className="text-xs px-1.5 py-1 rounded pg-surface-dim hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors" title={t("ttsMoveDown")}>▼</button>
                    <button type="button" onClick={() => handleToggleKey(key)}
                      className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                        key.isActive
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200"
                          : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200"
                      }`}>
                      {key.isActive ? t("ttsDeactivate") : t("ttsActivate")}
                    </button>
                    <button type="button" onClick={() => handleTestKey(key)} disabled={testingKeyId === key.id || !key.isActive}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 disabled:opacity-40 transition-colors">
                      {testingKeyId === key.id ? t("ttsTesting") : t("ttsTestKey")}
                    </button>
                    <button type="button" onClick={() => handleDeleteKey(key)}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors">
                      {t("ttsDeleteKey")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Key Form */}
        <form onSubmit={handleAddKey} className="space-y-3 pt-3 border-t pg-border">
          <h3 className="text-sm font-semibold pg-text-heading">{t("ttsAddKeyTitle")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <div>
              <label className="block text-xs font-medium pg-text-sub mb-1">{t("ttsKeyLabelField")}</label>
              <input
                type="text"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                placeholder={t("ttsKeyLabelPlaceholder")}
                className="w-full px-3 py-2 text-sm border pg-border rounded-lg bg-transparent pg-text-heading focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium pg-text-sub mb-1">{t("ttsApiKeyField")} *</label>
              <input
                type="password"
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-sm border pg-border rounded-lg bg-transparent pg-text-heading focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addingKey || !newKeyValue.trim()}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {addingKey ? t("ttsValidating") : t("ttsAddKeyBtn")}
          </button>
        </form>
      </section>
    </div>
  );
}
