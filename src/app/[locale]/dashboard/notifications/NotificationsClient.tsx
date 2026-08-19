"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsClient() {
  const t = useTranslations("Notifications");
  const params = useParams();
  const locale = (params?.locale as string) || "id";
  const router = useRouter();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedDays, setSelectedDays] = useState<string>("0");
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        ...(filter === "unread" ? { unreadOnly: "true" } : {}),
        ...(selectedType !== "ALL" ? { type: selectedType } : {}),
        ...(selectedDays !== "0" ? { days: selectedDays } : {}),
      });
      const res = await fetch(`/api/notifications?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter, selectedType, selectedDays, page]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (unreadCount > 0) {
        document.title = `(${unreadCount}) Notifikasi - Prompt Gen`;
      } else {
        document.title = `Notifikasi - Prompt Gen`;
      }
    }
  }, [unreadCount]);

  const handleMarkAsRead = async (id: string, link: string | null) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        router.push(`/${locale}${link.startsWith("/") ? link : "/" + link}`);
      }
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {unreadCount > 0
              ? `${unreadCount} ${t("unread")}`
              : t("empty")}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 hover:bg-blue-100 rounded-lg transition-colors"
          >
            {t("markAllAsRead")}
          </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
            className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
              filter === "all"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t("filterAll")}
          </button>
          <button
            onClick={() => {
              setFilter("unread");
              setPage(1);
            }}
            className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
              filter === "unread"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t("filterUnread")} ({unreadCount})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
            >
              <option value="ALL">Semua Jenis Notifikasi</option>
              <option value="SYSTEM_ANNOUNCEMENT">Pengumuman Sistem</option>
              <option value="PAYMENT_APPROVED">Pembayaran Disetujui</option>
              <option value="PAYMENT_REJECTED">Pembayaran Ditolak</option>
              <option value="REGISTRATION_APPROVED">Registrasi Disetujui</option>
              <option value="SUPPORT_TICKET_REPLIED">Jawaban Tiket Support</option>
              <option value="SUBSCRIPTION_EXPIRING_SOON">Langganan Segera Expired</option>
              <option value="SUBSCRIPTION_EXPIRED">Langganan Expired</option>
            </select>
          </div>

          <div>
            <select
              value={selectedDays}
              onChange={(e) => {
                setSelectedDays(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
            >
              <option value="0">Semua Waktu</option>
              <option value="7">7 Hari Terakhir</option>
              <option value="30">30 Hari Terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-zinc-500">Memuat notifikasi...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500">{t("empty")}</div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item.id, item.link)}
              className={`p-5 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-start justify-between gap-4 ${
                !item.isRead ? "bg-blue-50/30 dark:bg-blue-950/20" : ""
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!item.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
                  )}
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.message}</p>
                <span className="text-xs text-zinc-400 block pt-1">
                  {new Date(item.createdAt).toLocaleString(locale === "id" ? "id-ID" : "en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              {item.link && (
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 flex-shrink-0">
                  Detail &rarr;
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
          >
            &larr; Previous
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
