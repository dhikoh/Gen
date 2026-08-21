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
  const t = useTranslations("AdminNotifications");
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
    return <div className="p-8" style={{ color: 'var(--pg-text-sub)' }}>{t("loading")}</div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--pg-text)' }}>{t("title")}</h1>
        <p className="mt-1" style={{ color: 'var(--pg-text-sub)' }}>{t("desc")}</p>
      </div>

      <div className="neu-flat rounded-xl overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--pg-text-sub)' }}>
            {t("noNotifications")}
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--pg-shadow-dark)' }}>
            {notifications.map((n) => (
              <li key={n.id} className="p-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--pg-text)' }}>
                      {n.title}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--pg-text-sub)' }}>
                      {n.message}
                    </p>
                    <p className="text-xs mt-2 flex gap-2" style={{ color: 'var(--pg-text-muted)' }}>
                      <span className="font-medium" style={{ color: 'var(--pg-brand)' }}>
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
