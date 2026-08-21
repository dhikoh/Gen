"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminNotificationsClient() {
  const t = useTranslations("Dashboard.Notifications");
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/admin/notifications");
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      } catch (err) {
        console.error("Failed to fetch admin notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Semua Notifikasi Platform</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Menampilkan semua notifikasi sistem yang dikirimkan ke user.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            {t("noNotifications")}
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {notifications.map((n) => (
              <li key={n.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      {n.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {n.message}
                    </p>
                    <p className="text-xs text-zinc-400 mt-2 flex gap-2">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {n.user.name} ({n.user.email})
                      </span>
                      <span>•</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
