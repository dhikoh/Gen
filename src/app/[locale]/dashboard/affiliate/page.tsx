import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  return { title: `${t('affiliate')} - Prompt Gen` };
}

export default async function AffiliateDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(`/${locale}/auth`);
  }
  
  const t = await getTranslations({ locale, namespace: 'Affiliate' });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      referrals: true,
      commissions: true
    }
  });

  if (!user) return null;

  const totalReferrals = user.referrals.length;
  const totalCommissions = user.commissions.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingCommissions = user.commissions.filter(c => c.status === "PENDING").reduce((acc, curr) => acc + curr.amount, 0);
  const paidCommissions = user.commissions.filter(c => c.status === "PAID").reduce((acc, curr) => acc + curr.amount, 0);

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const referralLink = user.referralCode ? `${baseUrl}/${locale}/auth/register?ref=${user.referralCode}` : t('noReferralCode');

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
        <p className="text-zinc-500 mt-2">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">{t('totalReferral')}</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{totalReferrals}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">{t('totalCommissionPending')}</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-500">Rp {pendingCommissions.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-zinc-500 mb-1">{t('commissionPaid')}</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-500">Rp {paidCommissions.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm mb-8">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">{t('referralLink')}</h2>
        <div className="flex gap-4 items-center">
          <input 
            type="text" 
            readOnly 
            value={referralLink} 
            className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white font-mono"
          />
        </div>
        <p className="text-xs text-zinc-500 mt-3">
          {t('shareLink')}
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">{t('commissionHistory')}</h2>
        {user.commissions.length === 0 ? (
          <p className="text-zinc-500 text-sm">{t('noCommission')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
              <thead className="text-xs text-zinc-700 uppercase bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400">
                <tr>
                  <th scope="col" className="px-6 py-3">{t('date')}</th>
                  <th scope="col" className="px-6 py-3">{t('amount')}</th>
                  <th scope="col" className="px-6 py-3">{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {user.commissions.map((comm) => (
                  <tr key={comm.id} className="bg-white border-b dark:bg-zinc-900 dark:border-zinc-700">
                    <td className="px-6 py-4">{new Date(comm.createdAt).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">Rp {comm.amount.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        comm.status === "PAID" ? "bg-green-100 text-green-800" :
                        comm.status === "PENDING" ? "bg-orange-100 text-orange-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {comm.status}
                      </span>
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
