import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params;
 const t = await getTranslations({ locale, namespace: 'Guide' });
 return { title: `${t('userTitle')} - Prompt Gen` };
}

export default async function UserGuidePage({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params;
 const t = await getTranslations({ locale, namespace: 'Guide' });

 return (
 <div className="max-w-5xl mx-auto space-y-8 py-4">
 {/* Header */}
 <div className="flex justify-between items-center border-b pg-border pb-6">
 <div>
 <h1 className="text-3xl font-bold pg-text-heading">{t('userTitle')}</h1>
 <p className="pg-text-muted mt-2 text-sm leading-relaxed max-w-2xl">
 {t('userSubtitle')}
 </p>
 </div>
 <Link
 href={`/${locale}/dashboard`}
 className="px-4 py-2 text-sm font-medium pg-text-sub bg-white border pg-border rounded-lg hover:pg-surface-dim /80 transition-all shadow-sm"
 >
 &larr; {t('backToDashboard')}
 </Link>
 </div>

 {/* Guide Cards Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Section 1 */}
 <div className="glass-panel p-6 rounded-xl border pg-border shadow-md flex flex-col justify-between space-y-4">
 <div>
 <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg mb-4">
 ⚡
 </div>
 <h2 className="text-lg font-bold pg-text-heading mb-2">{t('section1Title')}</h2>
 <p className="text-sm pg-text-sub leading-relaxed">
 {t('section1Content')}
 </p>
 </div>
 <div className="pt-4 border-t pg-border/60">
 <Link href={`/${locale}/dashboard/generator`} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
 {t('ctaGenerator')}
 </Link>
 </div>
 </div>

 {/* Section 2 */}
 <div className="glass-panel p-6 rounded-xl border pg-border shadow-md flex flex-col justify-between space-y-4">
 <div>
 <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg mb-4">
 📺
 </div>
 <h2 className="text-lg font-bold pg-text-heading mb-2">{t('section2Title')}</h2>
 <p className="text-sm pg-text-sub leading-relaxed">
 {t('section2Content')}
 </p>
 </div>
 <div className="pt-4 border-t pg-border/60">
 <Link href={`/${locale}/dashboard/channels`} className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
 {t('ctaChannels')}
 </Link>
 </div>
 </div>

 {/* Section 3 */}
 <div className="glass-panel p-6 rounded-xl border pg-border shadow-md flex flex-col justify-between space-y-4">
 <div>
 <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
 💳
 </div>
 <h2 className="text-lg font-bold pg-text-heading mb-2">{t('section3Title')}</h2>
 <p className="text-sm pg-text-sub leading-relaxed">
 {t('section3Content')}
 </p>
 </div>
 <div className="pt-4 border-t pg-border/60">
 <Link href={`/${locale}/dashboard/billing`} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
 {t('ctaBilling')}
 </Link>
 </div>
 </div>

 {/* Section 4 */}
 <div className="glass-panel p-6 rounded-xl border pg-border shadow-md flex flex-col justify-between space-y-4">
 <div>
 <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg mb-4">
 🔔
 </div>
 <h2 className="text-lg font-bold pg-text-heading mb-2">{t('section4Title')}</h2>
 <p className="text-sm pg-text-sub leading-relaxed">
 {t('section4Content')}
 </p>
 </div>
 <div className="pt-4 border-t pg-border/60">
 <Link href={`/${locale}/dashboard/notifications`} className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
 {t('ctaNotifications')}
 </Link>
 </div>
 </div>
 </div>
 </div>
 );
}
