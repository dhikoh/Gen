"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface AnnouncementItem {
  broadcastGroupId: string | null;
  title: string;
  message: string;
  link?: string | null;
  createdAt: string;
  recipientCount: number;
}

export default function AnnouncementsClient() {
  const t = useTranslations("Announcements");

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [target, setTarget] = useState<"ALL" | "PLAN" | "USER" | "STATUS">("ALL");
  const [targetPlanCode, setTargetPlanCode] = useState("STANDARD");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetStatus, setTargetStatus] = useState("ACTIVE");

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch {
      toast.error(t("errorLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error(t("errorRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          link: link.trim() || undefined,
          target,
          targetPlanCode: target === "PLAN" ? targetPlanCode : undefined,
          targetUserId: target === "USER" ? targetUserId.trim() : undefined,
          targetStatus: target === "STATUS" ? targetStatus : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t("errorSendFailed"));
      }

      toast.success(t("successSent"));
      setTitle("");
      setMessage("");
      setLink("");
      fetchAnnouncements();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || t("errorOccurred"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("pageTitle")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("pageDesc")}</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t("createTitle")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("labelTitle")}
            </label>
            <input
              type="text"
              id="announcement-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("labelMessage")}
            </label>
            <textarea
              id="announcement-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("messagePlaceholder")}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("labelTarget")}
              </label>
              <select
                id="announcement-target"
                value={target}
                onChange={(e) => setTarget(e.target.value as "ALL" | "PLAN" | "USER" | "STATUS")}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">{t("targetAll")}</option>
                <option value="PLAN">{t("targetPlan")}</option>
                <option value="USER">{t("targetUser")}</option>
                <option value="STATUS">Berdasarkan Status</option>
              </select>
            </div>

            {target === "PLAN" && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("labelPlan")}
                </label>
                <select
                  value={targetPlanCode}
                  onChange={(e) => setTargetPlanCode(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DEMO">Demo 3 Hari</option>
                  <option value="STANDARD">Standard</option>
                  <option value="PRO">Pro</option>
                  <option value="ULTRA">Ultra</option>
                </select>
              </div>
            )}

            {target === "USER" && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("labelUserId")}
                </label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder={t("userIdPlaceholder")}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {target === "STATUS" && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Status Langganan
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Active (Aktif)</option>
                  <option value="INACTIVE">Inactive (Belum Pernah Beli)</option>
                  <option value="EXPIRED">Expired (Kedaluwarsa)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("labelLink")}
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={t("linkPlaceholder")}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {submitting ? t("submitSending") : t("submit")}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t("historyTitle")}</h2>
        {loading ? (
          <div className="py-8 text-center text-zinc-500">{t("loading")}</div>
        ) : announcements.length === 0 ? (
          <div className="py-8 text-center text-zinc-500">{t("empty")}</div>
        ) : (
          <div className="space-y-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {announcements.map((item, idx) => (
              <div key={item.broadcastGroupId || idx} className="pt-4 first:pt-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block">
                      {new Date(item.createdAt).toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {item.recipientCount} {t("recipients")}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line">{item.message}</p>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1"
                  >
                    {t("linkLabel")} {item.link}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
