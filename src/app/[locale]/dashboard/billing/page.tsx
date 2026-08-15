import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata = {
  title: "Tagihan & Paket - Prompt Gen",
};

export default async function BillingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { currentPlan: true }
  });

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    include: { plan: true },
    orderBy: { createdAt: "desc" }
  });

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Tagihan & Paket</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola langganan aktif Anda dan lihat riwayat tagihan.
          </p>
        </div>
        <Link 
          href={`/${locale}/dashboard/pricing`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
        >
          Upgrade Paket
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Paket Saat Ini</h2>
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {user.currentPlan?.name || "Gratis (Basic)"}
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.subscriptionStatus === "ACTIVE" 
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
          }`}>
            {user.subscriptionStatus}
          </span>
        </div>
        {user.subscriptionExpiresAt && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Berlaku hingga: {new Date(user.subscriptionExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Riwayat Transaksi</h2>
        </div>
        
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Belum ada riwayat transaksi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50/50 dark:bg-zinc-800/30">
                <tr>
                  <th className="px-6 py-3 font-medium">ID Tagihan</th>
                  <th className="px-6 py-3 font-medium">Paket</th>
                  <th className="px-6 py-3 font-medium">Jumlah</th>
                  <th className="px-6 py-3 font-medium">Metode</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {inv.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {inv.plan.name}
                    </td>
                    <td className="px-6 py-4">
                      Rp {inv.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      {inv.method === "MANUAL_TRANSFER" ? "Transfer Bank" : "Payment Gateway"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        inv.status === "APPROVED" || inv.status === "PAID"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : inv.status === "REJECTED" || inv.status === "FAILED"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {new Date(inv.createdAt).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
