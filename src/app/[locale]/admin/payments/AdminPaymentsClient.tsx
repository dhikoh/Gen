"use client";
import toast from "react-hot-toast";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function AdminPaymentsClient({ invoices }: { invoices: any[] }) {
  const router = useRouter();
  const t = useTranslations("AdminPayments");
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectingInvoiceId, setRejectingInvoiceId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

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
        toast.success(t('approveSuccess'));
        router.refresh();
      } else {
        toast.error(data.error || t('approveFail'));
      }
    } catch (e) {
      toast.error(t('networkError'));
    } finally {
      setLoading(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingInvoiceId) return;
    const invId = rejectingInvoiceId;
    setLoading(invId);
    try {
      const res = await fetch(`/api/admin/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invId,
          action: "REJECT",
          rejectionReason: rejectionReasonInput.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('rejectSuccess'));
        setRejectingInvoiceId(null);
        setRejectionReasonInput("");
        router.refresh();
      } else {
        toast.error(data.error || t('rejectFail'));
      }
    } catch (e) {
      toast.error(t('networkError'));
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
              <th className="px-6 py-4 font-medium">{t('invoiceId')}</th>
              <th className="px-6 py-4 font-medium">{t('user')}</th>
              <th className="px-6 py-4 font-medium">{t('plan')}</th>
              <th className="px-6 py-4 font-medium">{t('total')}</th>
              <th className="px-6 py-4 font-medium">{t('status')}</th>
              <th className="px-6 py-4 font-medium">{t('action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  {t('noPendingInvoices')}
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
                  {inv.proofUrl && (
                    <a href={inv.proofUrl} target="_blank" rel="noreferrer" className="block mt-2 text-xs text-blue-600 hover:underline">
                      {t('viewProof')}
                    </a>
                  )}
                </td>
                <td className="px-6 py-4 flex flex-col space-y-2">
                  <button 
                    onClick={() => handleApprove(inv.id)}
                    disabled={loading !== null || (!inv.proofUrl && inv.method === 'MANUAL_TRANSFER')}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!inv.proofUrl && inv.method === 'MANUAL_TRANSFER' ? t('waitProof') : ""}
                  >
                    {loading === inv.id ? t('processing') : t('approveBtn')}
                  </button>
                  <button 
                    onClick={() => {
                      setRejectingInvoiceId(inv.id);
                      setRejectionReasonInput("");
                    }}
                    disabled={loading !== null}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                  >
                    {loading === inv.id ? t('processing') : t('rejectBtn')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectingInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              {t('rejectModalTitle')}
            </h3>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t('rejectReasonLabel')}
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder={t('rejectReasonPlaceholder')}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingInvoiceId(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={loading !== null}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {loading === rejectingInvoiceId ? t('processing') : t('confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
