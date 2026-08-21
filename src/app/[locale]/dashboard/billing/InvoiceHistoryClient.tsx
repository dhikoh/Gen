"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import UploadProofClient from "./UploadProofClient";
import { CsEscalationBanner } from "@/components/cs/CsEscalationBanner";
import { formatWaLink } from "@/lib/csContact";

interface Invoice {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  proofUrl?: string | null;
  proofUploadedAt?: string | null;
  rejectionReason?: string | null;
  plan: {
    name: string;
  };
}

export default function InvoiceHistoryClient({ 
  locale, 
  paymentPendingAlertHours,
  csWhatsappNumber,
  bankName,
  bankAccountNo,
  bankAccountName
}: { 
  locale: string;
  paymentPendingAlertHours: number;
  csWhatsappNumber?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankAccountName?: string | null;
}) {
  const t = useTranslations("Billing");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      try {
        const url = filter === "ALL" ? "/api/user/invoices" : `/api/user/invoices?status=${filter}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.invoices) {
          setInvoices(data.invoices);
        }
      } catch (err) {
        console.error("Failed to fetch invoices", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, [filter]);

  return (
    <div className="glass-panel shadow-lg rounded-xl overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t('transactionHistory')}
        </h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Semua Transaksi</option>
          <option value="PENDING">Menunggu (Pending)</option>
          <option value="APPROVED">Disetujui (Approved)</option>
          <option value="REJECTED">Ditolak (Rejected)</option>
        </select>
      </div>
      
      {loading ? (
        <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Memuat riwayat transaksi...
        </div>
      ) : invoices.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {t('noTransaction')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50/50 dark:bg-zinc-800/30">
              <tr>
                <th className="px-6 py-3 font-medium">{t('invoiceId')}</th>
                <th className="px-6 py-3 font-medium">{t('plan')}</th>
                <th className="px-6 py-3 font-medium">{t('amount')}</th>
                <th className="px-6 py-3 font-medium">{t('method')}</th>
                <th className="px-6 py-3 font-medium">{t('status')}</th>
                <th className="px-6 py-3 font-medium">{t('date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {invoices.map((inv) => {
                const proofTime = inv.proofUploadedAt ? new Date(inv.proofUploadedAt).getTime() : new Date(inv.updatedAt).getTime();
                const elapsedHours = Math.floor((Date.now() - proofTime) / (1000 * 60 * 60));
                const isPendingEscalated = inv.status === "PENDING" && Boolean(inv.proofUrl) && elapsedHours >= paymentPendingAlertHours;

                const waPendingText = `Halo CS Prompt Gen, transaksi invoice #${inv.id.substring(0, 8).toUpperCase()} sebesar Rp ${inv.amount.toLocaleString("id-ID")} sudah mengunggah bukti bayar namun masih pending.`;
                const waRejectedText = `Halo CS Prompt Gen, transaksi invoice #${inv.id.substring(0, 8).toUpperCase()} saya ditolak. Mohon bantuan peninjauan ulang.`;

                const pendingWaLink = csWhatsappNumber ? formatWaLink(csWhatsappNumber, waPendingText) : null;
                const rejectedWaLink = csWhatsappNumber ? formatWaLink(csWhatsappNumber, waRejectedText) : null;

                return (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td colSpan={6} className="p-0 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex flex-col p-6 md:p-4 space-y-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center">
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
                            <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                              {inv.id.substring(0, 8).toUpperCase()}
                            </div>
                            <div className="font-medium text-zinc-900 dark:text-white">
                              {inv.plan.name}
                            </div>
                            <div>
                              Rp {inv.amount.toLocaleString('id-ID')}
                            </div>
                            <div>
                              {inv.method === "MANUAL_TRANSFER" ? t('manualTransfer') : t('paymentGateway')}
                            </div>
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                inv.status === "APPROVED" || inv.status === "PAID"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : inv.status === "REJECTED" || inv.status === "FAILED"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}>
                                {inv.status}
                              </span>
                            </div>
                            <div className="text-zinc-500">
                              {new Date(inv.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID')}
                            </div>
                          </div>
                          {inv.status === "PENDING" && inv.method === "MANUAL_TRANSFER" && (
                            <div className="mt-4 md:mt-0 md:ml-4 flex-shrink-0 w-full md:w-auto">
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4 text-sm text-blue-800 dark:text-blue-300">
                                <p className="font-semibold mb-1">{t('paymentInstruction')}</p>
                                <p>{t('transferDesc')} <strong>Rp {inv.amount.toLocaleString('id-ID')}</strong> {t('toAccount')}</p>
                                <div className="mt-2 p-3 bg-white dark:bg-zinc-900 rounded border border-blue-200 dark:border-blue-800 font-mono text-xs">
                                  <p>{t('bank')} {bankName || "-"}</p>
                                  <p>{t('accountNo')} <strong>{bankAccountNo || "-"}</strong></p>
                                  <p>{t('accountName')} {bankAccountName || "-"}</p>
                                </div>
                              </div>
                              <UploadProofClient invoiceId={inv.id} currentProof={inv.proofUrl} />
                            </div>
                          )}
                        </div>

                        {isPendingEscalated && (
                          <CsEscalationBanner
                            urgency="warning"
                            title={t("pendingEscalationTitle")}
                            description={t("pendingEscalationDesc")}
                            badgeText={t("pendingBadgeOver", { hours: paymentPendingAlertHours })}
                            waLink={pendingWaLink}
                            waButtonText={t("contactCsBtn")}
                          />
                        )}

                        {inv.status === "REJECTED" && (
                          <CsEscalationBanner
                            urgency="error"
                            title={t("rejectedEscalationTitle")}
                            description={
                              inv.rejectionReason
                                ? `${t("rejectedReasonPrefix")} ${inv.rejectionReason}`
                                : t("rejectedEscalationTitle")
                            }
                            waLink={rejectedWaLink}
                            waButtonText={t("contactCsBtn")}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
