"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPaymentsClient({ invoices }: { invoices: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (invoiceId: string) => {
    setLoading(invoiceId);
    try {
      const res = await fetch(`/api/admin/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, action: "APPROVE" })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Tagihan disetujui! Status langganan user telah diperbarui.");
        router.refresh();
      } else {
        alert(data.error || "Gagal menyetujui tagihan");
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (invoiceId: string) => {
    setLoading(invoiceId);
    try {
      const res = await fetch(`/api/admin/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, action: "REJECT" })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Tagihan ditolak.");
        router.refresh();
      } else {
        alert(data.error || "Gagal menolak tagihan");
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 shadow rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">Tagihan ID</th>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Paket</th>
              <th className="px-6 py-4 font-medium">Total</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  Tidak ada tagihan yang butuh persetujuan.
                </td>
              </tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4 font-mono text-xs">{inv.id.substring(0,8)}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-zinc-900 dark:text-white">{inv.user.name}</div>
                  <div className="text-xs text-zinc-500">{inv.user.email}</div>
                </td>
                <td className="px-6 py-4">{inv.plan.name}</td>
                <td className="px-6 py-4 font-medium">Rp {inv.amount.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-semibold rounded">
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex space-x-2">
                  <button 
                    onClick={() => handleApprove(inv.id)}
                    disabled={loading !== null}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                  >
                    {loading === inv.id ? "Proses..." : "Setujui"}
                  </button>
                  <button 
                    onClick={() => handleReject(inv.id)}
                    disabled={loading !== null}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                  >
                    {loading === inv.id ? "Proses..." : "Tolak"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
