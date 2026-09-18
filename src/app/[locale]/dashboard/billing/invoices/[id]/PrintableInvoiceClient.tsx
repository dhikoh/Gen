"use client";

import Link from "next/link";
import { getPaymentStatusBadge } from "@/lib/enumMapping";

interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  periodDays: number;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    name: string;
    email: string;
    username: string;
  };
  plan: {
    name: string;
    code: string;
    maxChannels: number;
  };
}

export default function PrintableInvoiceClient({
  invoice,
  locale,
}: {
  invoice: InvoiceData;
  locale: string;
}) {
  const statusBadge = getPaymentStatusBadge(invoice.status);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link
          href={`/${locale}/dashboard/billing`}
          className="neu-btn px-4 py-2 text-sm flex items-center gap-2"
        >
          &larr; Kembali ke Riwayat Tagihan
        </Link>
        <button
          onClick={handlePrint}
          className="neu-btn-brand px-5 py-2 text-sm font-semibold flex items-center gap-2 shadow-sm"
        >
          🖨️ Cetak / Simpan PDF
        </button>
      </div>

      {/* Invoice Receipt Container */}
      <div className="pg-surface rounded-2xl border pg-border p-8 sm:p-12 shadow-lg print:shadow-none print:border-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b pg-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-2xl font-black tracking-tight text-[var(--pg-brand)]">
                PROMPT GEN
              </span>
            </div>
            <p className="text-xs pg-text-muted mt-1">Platform SaaS Automasi Konten Video & Gambar AI</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold uppercase tracking-wider pg-text-muted block">
              Kuitansi Resmi Pembayaran
            </span>
            <span className="text-sm font-mono font-bold pg-text-heading mt-0.5 block">
              #{invoice.id.toUpperCase()}
            </span>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusBadge.className}`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Billed To & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b pg-border text-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider pg-text-muted block mb-2">
              Diterbitkan Untuk:
            </span>
            <p className="font-bold pg-text-heading text-base">{invoice.user.name}</p>
            <p className="pg-text-sub text-xs">@{invoice.user.username}</p>
            <p className="pg-text-muted text-xs">{invoice.user.email}</p>
          </div>
          <div className="sm:text-right space-y-1 text-xs">
            <div>
              <span className="pg-text-muted">Tanggal Pemesanan: </span>
              <span className="font-semibold pg-text-heading">
                {new Date(invoice.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            {invoice.reviewedAt && (
              <div>
                <span className="pg-text-muted">Tanggal Verifikasi: </span>
                <span className="font-semibold pg-text-heading">
                  {new Date(invoice.reviewedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <div>
              <span className="pg-text-muted">Metode: </span>
              <span className="font-semibold pg-text-heading">
                {invoice.method === "MANUAL_TRANSFER" ? "Transfer Bank Manual" : "Gateway Otomatis"}
              </span>
            </div>
          </div>
        </div>

        {/* Item Table */}
        <div className="py-8 border-b pg-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b pg-border text-xs uppercase tracking-wider pg-text-muted">
                <th className="pb-3 font-semibold">Deskripsi Layanan</th>
                <th className="pb-3 text-center font-semibold">Durasi</th>
                <th className="pb-3 text-center font-semibold">Batas Channel</th>
                <th className="pb-3 text-right font-semibold">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y pg-divide">
              <tr>
                <td className="py-4">
                  <p className="font-bold pg-text-heading">Paket Langganan {invoice.plan.name}</p>
                  <p className="text-xs pg-text-muted mt-0.5">
                    Akses penuh AI Prompt Studio, Naskah Presisi & Eksportir Konten
                  </p>
                </td>
                <td className="py-4 text-center pg-text-sub text-xs font-semibold">
                  {invoice.periodDays} Hari
                </td>
                <td className="py-4 text-center pg-text-sub text-xs font-semibold">
                  {invoice.plan.maxChannels} Channel
                </td>
                <td className="py-4 text-right font-bold font-mono pg-text-heading">
                  Rp {invoice.amount.toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Calculation */}
        <div className="pt-6 flex justify-end">
          <div className="w-full sm:w-64 space-y-2 text-sm">
            <div className="flex justify-between text-xs pg-text-muted">
              <span>Subtotal:</span>
              <span className="font-mono">Rp {invoice.amount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-xs pg-text-muted">
              <span>Biaya Transaksi / Pajak:</span>
              <span className="font-mono">Rp 0</span>
            </div>
            <div className="flex justify-between pt-2 border-t pg-border text-base font-bold pg-text-heading">
              <span>Total Bayar:</span>
              <span className="text-[var(--pg-brand)] font-mono">
                Rp {invoice.amount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 pt-6 border-t pg-border text-center text-xs pg-text-muted">
          <p>Kuitansi ini dibuat secara otomatis oleh sistem Prompt Gen dan sah tanpa tanda tangan basah.</p>
          <p className="mt-1">Pertanyaan seputar tagihan? Hubungi layanan bantuan di menu Pusat Dukungan.</p>
        </div>
      </div>
    </div>
  );
}
