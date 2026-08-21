import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import InvoiceHistoryClient from "./InvoiceHistoryClient";
import { formatWaLink } from "@/lib/csContact";

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


  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  const paymentPendingAlertHours = settings?.paymentPendingAlertHours ?? 12;

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

      <div className="glass-panel shadow-lg rounded-xl p-6">
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

      <InvoiceHistoryClient 
        locale={locale} 
        paymentPendingAlertHours={paymentPendingAlertHours}
        csWhatsappNumber={settings?.csWhatsappNumber}
        bankName={settings?.bankName}
        bankAccountNo={settings?.bankAccountNo}
        bankAccountName={settings?.bankAccountName}
      />
    </div>
  );
}
