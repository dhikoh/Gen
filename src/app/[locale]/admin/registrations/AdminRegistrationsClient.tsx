"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

export default function AdminRegistrationsClient({ initialUsers }: { initialUsers: any[] }) {
  const router = useRouter();
  const t = useTranslations("AdminRegistrations");
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (userId: string, action: "APPROVE" | "REJECT") => {
    setLoading(userId);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(action === "APPROVE" ? t("approveSuccess") : t("rejectSuccess"));
        setUsers(prev => prev.filter(u => u.id !== userId));
        router.refresh();
      } else {
        toast.error(data.error || (action === "APPROVE" ? t("approveFail") : t("rejectFail")));
      }
    } catch (err) {
      toast.error(t("networkError"));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 shadow rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 glass-panel">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">{t("user")}</th>
              <th className="px-6 py-4 font-medium">{t("contact")}</th>
              <th className="px-6 py-4 font-medium">{t("channel")}</th>
              <th className="px-6 py-4 font-medium">{t("registeredAt")}</th>
              <th className="px-6 py-4 font-medium">{t("status")}</th>
              <th className="px-6 py-4 font-medium">{t("action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  {t("noPending")}
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const primaryChannel = u.channels?.[0];
                return (
                  <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">{u.name}</div>
                      <div className="text-xs text-zinc-500">@{u.username} • {u.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <div>{u.phoneNumber || "-"}</div>
                      {u.dateOfBirth && <div>{new Date(u.dateOfBirth).toLocaleDateString()}</div>}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {primaryChannel ? (
                        <div>
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200">{primaryChannel.channelName}</div>
                          <div className="text-zinc-500">{primaryChannel.niche || "-"}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">
                      {new Date(u.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-semibold rounded">
                        {u.registrationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex space-x-2">
                      <button
                        onClick={() => handleAction(u.id, "APPROVE")}
                        disabled={loading !== null}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium disabled:opacity-50 neu-flat"
                      >
                        {loading === u.id ? t("processing") : t("approveBtn")}
                      </button>
                      <button
                        onClick={() => handleAction(u.id, "REJECT")}
                        disabled={loading !== null}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium disabled:opacity-50 neu-flat"
                      >
                        {loading === u.id ? t("processing") : t("rejectBtn")}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
