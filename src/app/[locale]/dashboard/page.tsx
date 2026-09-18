import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params;
 const t = await getTranslations({ locale, namespace: 'Dashboard' });
 return { title: `${t('overview')} - Prompt Gen` };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params;
 const session = await getServerSession(authOptions);
 
 if (!session) return null;

 const t = await getTranslations({ locale, namespace: 'Overview' });

  // Fetch user data with their subscription and profile channel
  const [user, draftCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        currentPlan: true,
        channels: true,
      },
    }),
    prisma.draft.count({
      where: { userId: session.user.id },
    }),
  ]);

  if (!user) return null;

  const currentChannel = user.channels[0];

  // Onboarding steps evaluation (B-6)
  const stepChannel = user.channels.length > 0;
  const stepDraft = draftCount > 0;
  const stepSub = user.subscriptionStatus === "ACTIVE";
  const completedSteps = (stepChannel ? 1 : 0) + (stepDraft ? 1 : 0) + (stepSub ? 1 : 0);
  const progressPercent = Math.round((completedSteps / 3) * 100);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold pg-text-heading">
          {t('welcome', { name: user.name })}
        </h1>
        <p className="text-sm pg-text-muted mt-1">
          Selamat datang di dasbor kendali studio Prompt Gen Anda.
        </p>
      </div>

      {/* Onboarding Checklist Widget (B-6) */}
      <div className="pg-surface rounded-2xl border pg-border p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold pg-text-heading flex items-center gap-2">
              <span>🚀</span> Langkah Memulai (Onboarding Checklist)
            </h2>
            <p className="text-xs pg-text-muted mt-0.5">
              Selesaikan 3 langkah mudah ini untuk memaksimalkan produksi konten otomatis Anda.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--pg-brand)]">
              {completedSteps}/3 Selesai ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[var(--pg-surface-dim)] rounded-full h-2 overflow-hidden border pg-border">
          <div
            className="bg-[var(--pg-brand)] h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps List */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Step 1 */}
          <div className={`p-3.5 rounded-xl border transition-colors ${
            stepChannel 
              ? "bg-emerald-500/5 border-emerald-500/20" 
              : "bg-[var(--pg-surface-dim)]/40 pg-border"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold pg-text-heading">1. Profil Channel</span>
              <span>{stepChannel ? "✅" : "⏳"}</span>
            </div>
            <p className="text-xs pg-text-muted mb-2">
              {stepChannel ? "Channel aktif terkonfigurasi" : "Buat identitas channel pertama"}
            </p>
            <Link
              href={`/${locale}/dashboard/channels`}
              className="text-xs font-medium text-[var(--pg-brand)] hover:underline inline-flex items-center gap-1"
            >
              {stepChannel ? "Kelola Channel &rarr;" : "Tambah Channel &rarr;"}
            </Link>
          </div>

          {/* Step 2 */}
          <div className={`p-3.5 rounded-xl border transition-colors ${
            stepDraft 
              ? "bg-emerald-500/5 border-emerald-500/20" 
              : "bg-[var(--pg-surface-dim)]/40 pg-border"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold pg-text-heading">2. Generator Naskah</span>
              <span>{stepDraft ? "✅" : "⏳"}</span>
            </div>
            <p className="text-xs pg-text-muted mb-2">
              {stepDraft ? `${draftCount} draf naskah tersimpan` : "Generate naskah AI pertama"}
            </p>
            <Link
              href={`/${locale}/dashboard/generator`}
              className="text-xs font-medium text-[var(--pg-brand)] hover:underline inline-flex items-center gap-1"
            >
              {stepDraft ? "Buka Studio &rarr;" : "Mulai Generate &rarr;"}
            </Link>
          </div>

          {/* Step 3 */}
          <div className={`p-3.5 rounded-xl border transition-colors ${
            stepSub 
              ? "bg-emerald-500/5 border-emerald-500/20" 
              : "bg-[var(--pg-surface-dim)]/40 pg-border"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold pg-text-heading">3. Paket Langganan</span>
              <span>{stepSub ? "✅" : "⏳"}</span>
            </div>
            <p className="text-xs pg-text-muted mb-2">
              {stepSub ? `Aktif (${user.currentPlan?.name || "Member"})` : "Pilih paket sesuai kebutuhan"}
            </p>
            <Link
              href={`/${locale}/dashboard/pricing`}
              className="text-xs font-medium text-[var(--pg-brand)] hover:underline inline-flex items-center gap-1"
            >
              {stepSub ? "Lihat Tagihan &rarr;" : "Pilihan Paket &rarr;"}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Langganan */}
        <div className="pg-surface rounded-2xl border pg-border p-6 shadow-sm space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider pg-text-muted">
            {t('subscriptionStatus')}
          </h2>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              user.subscriptionStatus === "ACTIVE" 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            }`}>
              {user.subscriptionStatus === "ACTIVE" ? t('active') : t('inactive')}
            </span>
            <span className="text-lg font-bold pg-text-heading">
              {user.currentPlan?.name || t('notSubscribed')}
            </span>
          </div>
          {user.subscriptionExpiresAt && (
            <p className="text-xs pg-text-sub">
              Aktif hingga: {user.subscriptionExpiresAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          <div className="pt-2">
            <Link
              href={`/${locale}/dashboard/pricing`}
              className="text-xs text-[var(--pg-brand)] hover:underline font-semibold"
            >
              {t('upgradePlan')} &rarr;
            </Link>
          </div>
        </div>

        {/* Profil Channel Utama */}
        <div className="pg-surface rounded-2xl border pg-border p-6 shadow-sm space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider pg-text-muted">
            {t('mainChannel')}
          </h2>
          {currentChannel ? (
            <div>
              <p className="text-lg font-bold pg-text-heading mb-1">
                {currentChannel.channelName}
              </p>
              <p className="text-xs pg-text-sub line-clamp-2 mb-3">
                {currentChannel.description || t('noDescription')}
              </p>
              <Link
                href={`/${locale}/dashboard/channels`}
                className="text-xs text-[var(--pg-brand)] hover:underline font-semibold"
              >
                {t('manageChannels')} &rarr;
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-xs pg-text-muted mb-3">{t('noChannel')}</p>
              <Link
                href={`/${locale}/dashboard/channels`}
                className="neu-btn px-3 py-1.5 text-xs font-semibold"
              >
                + Tambah Channel
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Launch Studio */}
      <div className="pg-surface rounded-2xl border pg-border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold pg-text-heading">{t('startCreating')}</h2>
          <p className="text-xs pg-text-sub mt-1">
            {t('startCreatingDesc')}
          </p>
        </div>
        <Link
          href={`/${locale}/dashboard/generator`}
          className="neu-btn-brand px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm whitespace-nowrap"
        >
          {t('openGenerator')} &rarr;
        </Link>
      </div>
    </div>
  );
}
