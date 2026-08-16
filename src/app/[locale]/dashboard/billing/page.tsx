import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import UploadProofClient from "./UploadProofClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  return { title: `${t('billing')} - Prompt Gen` };
}

export default async function BillingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) return null;
  const t = await getTranslations({ locale, namespace: 'Billing' });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { currentPlan: true }
  });

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    include: { plan: true },
    orderBy: { createdAt: "desc" }
  });

  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('description')}
          </p>
        </div>
        <Link 
          href={`/${locale}/dashboard/pricing`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
        >
          {t('upgradePlanBtn')}
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{t('currentPlan')}</h2>
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {user.currentPlan?.name || t('freePlan')}
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
            {t('validUntil')} {new Date(user.subscriptionExpiresAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('transactionHistory')}</h2>
        </div>
        
        {invoices.length === 0 ? (
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
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td colSpan={6} className="p-0 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex flex-col md:flex-row p-6 md:p-4">
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
                                <p>{t('bank')} {settings?.bankName || "-"}</p>
                                <p>{t('accountNo')} <strong>{settings?.bankAccountNo || "-"}</strong></p>
                                <p>{t('accountName')} {settings?.bankAccountName || "-"}</p>
                              </div>
                            </div>
                            <UploadProofClient invoiceId={inv.id} currentProof={inv.proofUrl} />
                          </div>
                        )}
                      </div>
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
