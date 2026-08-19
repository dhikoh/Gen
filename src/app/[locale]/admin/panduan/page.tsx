import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Guide' });
  return { title: `${t('adminTitle')} - Prompt Gen` };
}

export default async function AdminGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPERADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations({ locale, namespace: 'Guide' });

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('adminTitle')}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm leading-relaxed max-w-2xl">
            {t('adminSubtitle')}
          </p>
        </div>
        <Link
          href={`/${locale}/admin`}
          className="px-4 py-2 text-sm font-medium text-purple-300 bg-purple-950/60 border border-purple-800/80 rounded-lg hover:bg-purple-900/80 transition-all shadow-sm"
        >
          &larr; {t('backToAdmin')}
        </Link>
      </div>

      {/* Guide Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Admin Section 1 */}
        <div className="glass-panel p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg mb-4">
              👤
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{t('adminSec1Title')}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('adminSec1Content')}
            </p>
          </div>
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
            <Link href={`/${locale}/admin/registrations`} className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
              Persetujuan Pendaftaran &rarr;
            </Link>
          </div>
        </div>

        {/* Admin Section 2 */}
        <div className="glass-panel p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
              💰
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{t('adminSec2Title')}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('adminSec2Content')}
            </p>
          </div>
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
            <Link href={`/${locale}/admin/payments`} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Verifikasi Pembayaran &rarr;
            </Link>
          </div>
        </div>

        {/* Admin Section 3 */}
        <div className="glass-panel p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg mb-4">
              ⚙️
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{t('adminSec3Title')}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('adminSec3Content')}
            </p>
          </div>
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
            <Link href={`/${locale}/admin/settings`} className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
              Pengaturan Prompt & Banned Words &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
