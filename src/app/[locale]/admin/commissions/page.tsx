import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import CommissionActions from "./CommissionActions";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AdminCommissions' });
  return { title: t('pageTitleTab') };
}

export default async function AdminCommissionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/id/dashboard");
  }

  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AdminCommissions' });

  const commissions = await prisma.commission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: {
        select: { id: true, name: true, email: true, phoneNumber: true }
      }
    }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
          <p className="text-zinc-500 mt-1">{t('description')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {commissions.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            {t('noData')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
              <thead className="text-xs text-zinc-700 uppercase bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400">
                <tr>
                  <th scope="col" className="px-6 py-4">{t('affiliate')}</th>
                  <th scope="col" className="px-6 py-4">{t('contact')}</th>
                  <th scope="col" className="px-6 py-4">{t('amount')}</th>
                  <th scope="col" className="px-6 py-4">{t('date')}</th>
                  <th scope="col" className="px-6 py-4">{t('status')}</th>
                  <th scope="col" className="px-6 py-4 text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {commissions.map((comm) => (
                  <tr key={comm.id} className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">{comm.affiliate.name}</div>
                      <div className="text-xs text-zinc-500">{comm.affiliate.email}</div>
                    </td>
                    <td className="px-6 py-4">{comm.affiliate.phoneNumber || "-"}</td>
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                      {comm.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(comm.createdAt).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        comm.status === "PAID" ? "bg-green-100 text-green-800" :
                        comm.status === "PENDING" ? "bg-orange-100 text-orange-800" :
                        comm.status === "APPROVED" ? "bg-blue-100 text-blue-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {comm.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {comm.status === "PENDING" && (
                        <CommissionActions commissionId={comm.id} />
                      )}
                      {comm.status === "APPROVED" && (
                        <span className="text-xs text-zinc-500 italic">{t('waitingTransfer')}</span>
                      )}
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
