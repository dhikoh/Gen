"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

interface AppSettings {
  heroTitle: string | null;
  heroSubtitle: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankAccountName?: string | null;
  csMode?: "DIRECT_WHATSAPP" | "DIRECT_EMAIL" | "TICKET" | string | null;
  csWhatsappNumber?: string | null;
  csEmail?: string | null;
  csOperatingHours?: string | null;
  csWidgetEnabled?: boolean | null;
}

interface PromptSettingsData {
  videoSystemInstruction?: string | null;
  imageSystemInstruction?: string | null;
  defaultSpeechRate?: string | null;
  defaultNegativePrompt?: string | null;
  bannedWords?: string[] | string | unknown;
}

export default function AdminSettingsClient({
  settings,
  promptSettings
}: {
  settings: AppSettings | null;
  promptSettings?: PromptSettingsData | null;
}) {
  const router = useRouter();
  const t = useTranslations("AdminSettings");
  const st = useTranslations("Support");
  const [activeTab, setActiveTab] = useState<"general" | "prompt">("general");
  const [loading, setLoading] = useState(false);

  // Form State for AppSettings
  const [appFormData, setAppFormData] = useState({
    heroTitle: settings?.heroTitle || "",
    heroSubtitle: settings?.heroSubtitle || "",
    bankName: settings?.bankName || "",
    bankAccountNo: settings?.bankAccountNo || "",
    bankAccountName: settings?.bankAccountName || "",
    csMode: settings?.csMode || "TICKET",
    csWhatsappNumber: settings?.csWhatsappNumber || "",
    csEmail: settings?.csEmail || "",
    csOperatingHours: settings?.csOperatingHours || "Senin - Jumat, 09:00 - 17:00 WIB",
    csWidgetEnabled: settings?.csWidgetEnabled ?? true,
  });

  // Form State for PromptSettings
  const initialBannedWordsStr = Array.isArray(promptSettings?.bannedWords)
    ? promptSettings.bannedWords.join(", ")
    : "";

  const [promptFormData, setPromptFormData] = useState({
    videoSystemInstruction: promptSettings?.videoSystemInstruction || "",
    imageSystemInstruction: promptSettings?.imageSystemInstruction || "",
    defaultSpeechRate: promptSettings?.defaultSpeechRate || "medium",
    defaultNegativePrompt: promptSettings?.defaultNegativePrompt || "",
    bannedWords: initialBannedWordsStr,
  });

  const handleAppChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAppFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setPromptFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appFormData)
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(t("updateSuccess"));
        router.refresh();
      } else {
        toast.error(data.error || t("updateFail"));
      }
    } catch (err) {
      toast.error(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prompt-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promptFormData)
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(t("promptUpdateSuccess"));
        router.refresh();
      } else {
        toast.error(data.error || t("updateFail"));
      }
    } catch (err) {
      toast.error(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-4">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "general"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          {t("tabGeneral")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prompt")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "prompt"
              ? "border-purple-500 text-purple-600 dark:text-purple-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          {t("tabPrompt")}
        </button>
      </div>

      {/* Tab 1: General & Bank Settings */}
      {activeTab === "general" && (
        <form autoComplete="off" onSubmit={handleAppSubmit} className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 space-y-6 border border-zinc-200 dark:border-zinc-800 glass-panel">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t("landingContent")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("heroTitle")}</label>
                <input
                  type="text"
                  name="heroTitle"
                  required
                  value={appFormData.heroTitle}
                  onChange={handleAppChange}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("heroSubtitle")}</label>
                <textarea
                  name="heroSubtitle"
                  rows={3}
                  required
                  value={appFormData.heroSubtitle}
                  onChange={handleAppChange}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t("bankAccountTitle")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("bankName")}</label>
                <input
                  type="text"
                  name="bankName"
                  value={appFormData.bankName}
                  onChange={handleAppChange}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("bankAccountNo")}</label>
                <input
                  type="text"
                  name="bankAccountNo"
                  value={appFormData.bankAccountNo}
                  onChange={handleAppChange}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("bankAccountName")}</label>
                <input
                  type="text"
                  name="bankAccountName"
                  value={appFormData.bankAccountName}
                  onChange={handleAppChange}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{st("csSettings")}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{st("csMode")}</label>
                  <select
                    name="csMode"
                    value={appFormData.csMode}
                    onChange={(e) => setAppFormData(prev => ({ ...prev, csMode: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white text-sm"
                  >
                    <option value="TICKET">Sistem Tiket Internal (Default)</option>
                    <option value="DIRECT_WHATSAPP">Direct WhatsApp</option>
                    <option value="DIRECT_EMAIL">Direct Email</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{st("csOperatingHours")}</label>
                  <input
                    type="text"
                    name="csOperatingHours"
                    value={appFormData.csOperatingHours}
                    onChange={handleAppChange}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {appFormData.csMode === "DIRECT_WHATSAPP" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{st("csWhatsappNumber")}</label>
                  <input
                    type="text"
                    name="csWhatsappNumber"
                    value={appFormData.csWhatsappNumber}
                    onChange={handleAppChange}
                    placeholder="628123456789"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white text-sm"
                  />
                </div>
              )}

              {appFormData.csMode === "DIRECT_EMAIL" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{st("csEmail")}</label>
                  <input
                    type="email"
                    name="csEmail"
                    value={appFormData.csEmail}
                    onChange={handleAppChange}
                    placeholder="support@promptgen.com"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white text-sm"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="csWidgetEnabled"
                  checked={appFormData.csWidgetEnabled}
                  onChange={(e) => setAppFormData(prev => ({ ...prev, csWidgetEnabled: e.target.checked }))}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="csWidgetEnabled" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  {st("csWidgetEnabled")}
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 neu-flat"
            >
              {loading ? t("saving") : t("saveSettings")}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Prompt Settings */}
      {activeTab === "prompt" && (
        <form autoComplete="off" onSubmit={handlePromptSubmit} className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 space-y-6 border border-zinc-200 dark:border-zinc-800 glass-panel">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t("promptSettingsTitle")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("videoSystemInstruction")}</label>
                <textarea
                  name="videoSystemInstruction"
                  rows={4}
                  value={promptFormData.videoSystemInstruction}
                  onChange={handlePromptChange}
                  placeholder="Tambahkan instruksi sistem tambahan untuk Video Master Prompt generator..."
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white text-sm"
                />
                <p className="text-xs text-zinc-500 mt-1">{t("videoSystemInstructionHelp")}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("imageSystemInstruction")}</label>
                <textarea
                  name="imageSystemInstruction"
                  rows={4}
                  value={promptFormData.imageSystemInstruction}
                  onChange={handlePromptChange}
                  placeholder="Tambahkan instruksi sistem tambahan untuk Image Prompt generator..."
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white text-sm"
                />
                <p className="text-xs text-zinc-500 mt-1">{t("imageSystemInstructionHelp")}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("defaultSpeechRate")}</label>
                  <select
                    name="defaultSpeechRate"
                    value={promptFormData.defaultSpeechRate}
                    onChange={handlePromptChange}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white text-sm"
                  >
                    <option value="slow">Slow</option>
                    <option value="medium">Medium</option>
                    <option value="fast">Fast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("defaultNegativePrompt")}</label>
                  <input
                    type="text"
                    name="defaultNegativePrompt"
                    value={promptFormData.defaultNegativePrompt}
                    onChange={handlePromptChange}
                    placeholder="blurry, distorted, low quality, bad anatomy"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("bannedWords")}</label>
                <textarea
                  name="bannedWords"
                  rows={3}
                  value={promptFormData.bannedWords}
                  onChange={handlePromptChange}
                  placeholder="judi, slot, sara, nsfw, porn"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white text-sm"
                />
                <p className="text-xs text-zinc-500 mt-1">{t("bannedWordsHelp")}</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 neu-flat"
            >
              {loading ? t("saving") : t("saveSettings")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
