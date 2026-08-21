"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

interface PendingUserRegistration {
 id: string;
 name: string | null;
 username: string;
 email: string;
 phoneNumber: string | null;
 dateOfBirth: string | Date | null;
 createdAt: string | Date;
 registrationStatus: string;
 channels?: Array<{
 channelName: string;
 niche: string | null;
 }>;
}

export default function AdminRegistrationsClient({ initialUsers }: { initialUsers: PendingUserRegistration[] }) {
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
 <div className="pg-surface shadow rounded-lg overflow-hidden border pg-border glass-panel">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm whitespace-nowrap">
 <thead className="pg-surface-dim/50 pg-text-muted uppercase">
 <tr>
 <th className="px-6 py-4 font-medium">{t("user")}</th>
 <th className="px-6 py-4 font-medium">{t("contact")}</th>
 <th className="px-6 py-4 font-medium">{t("channel")}</th>
 <th className="px-6 py-4 font-medium">{t("registeredAt")}</th>
 <th className="px-6 py-4 font-medium">{t("status")}</th>
 <th className="px-6 py-4 font-medium">{t("action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y pg-divide">
 {users.length === 0 ? (
 <tr>
 <td colSpan={6} className="px-6 py-8 text-center pg-text-muted">
 {t("noPending")}
 </td>
 </tr>
 ) : (
 users.map((u) => {
 const primaryChannel = u.channels?.[0];
 return (
 <tr key={u.id} className="hover:pg-surface-dim/50">
 <td className="px-6 py-4">
 <div className="font-medium pg-text-heading">{u.name}</div>
 <div className="text-xs pg-text-muted">@{u.username} • {u.email}</div>
 </td>
 <td className="px-6 py-4 text-xs pg-text-sub">
 <div>{u.phoneNumber || "-"}</div>
 {u.dateOfBirth && <div>{new Date(u.dateOfBirth).toLocaleDateString()}</div>}
 </td>
 <td className="px-6 py-4 text-xs">
 {primaryChannel ? (
 <div>
 <div className="font-semibold pg-text-heading">{primaryChannel.channelName}</div>
 <div className="pg-text-muted">{primaryChannel.niche || "-"}</div>
 </div>
 ) : (
 <span className="pg-text-muted">-</span>
 )}
 </td>
 <td className="px-6 py-4 text-xs pg-text-muted">
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
