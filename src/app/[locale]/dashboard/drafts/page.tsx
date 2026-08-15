import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { DraftType } from "@prisma/client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Drafts' });
  return { title: `${t('pageTitleTab')} - Prompt Gen` };
}

export default async function DraftsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  const t = await getTranslations({ locale, namespace: 'Drafts' });

  // Fetch drafts history for the current user
  const drafts = await prisma.draft.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      channel: true,
    }
  });

  const templates = drafts.filter(d => d.isTemplate);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('pageTitle')}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('pageDesc')}
          </p>
        </div>
        <Link 
          href={`/${locale}/dashboard/generator`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
        >
          {t('createNew')}
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{t('emptyTitle')}</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mb-6">
            {t('emptyDesc')}
          </p>
          <Link 
            href={`/${locale}/dashboard/generator`}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
          >
            {t('startGenerate')}
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {templates.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {t('savedTemplates')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {templates.map((draft) => (
                  <div key={draft.id} className="bg-white dark:bg-zinc-900 border-2 border-yellow-200 dark:border-yellow-900/50 rounded-xl shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow relative">
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute top-4 -right-4 bg-yellow-400 text-yellow-900 text-[10px] font-bold py-1 px-6 rotate-45">TEMPLATE</div>
                    </div>
                    <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50 flex-1">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-2 mb-2 leading-snug pr-8">
                        {draft.title || t('untitled')}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {t('channel')}: <span className="font-medium text-zinc-700 dark:text-zinc-300">{draft.channel?.channelName || "-"}</span>
                      </p>
                    </div>
                    <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center text-xs text-zinc-500">
                      <Link 
                        href={`/${locale}/dashboard/drafts/${draft.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 w-full text-center"
                      >
                        {t('useTemplate')} &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">{t('allHistory')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {drafts.filter(d => !d.isTemplate).map((draft) => (
            <div key={draft.id} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    draft.type === DraftType.VIDEO
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}>
                    {draft.type}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(draft.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-2 mb-2 leading-snug">
                  {draft.title || t('untitled')}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t('channel')}: <span className="font-medium text-zinc-700 dark:text-zinc-300">{draft.channel?.channelName || "-"}</span>
                </p>
              </div>
              <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center text-xs text-zinc-500">
                <div className="flex space-x-3">
                  {draft.estimatedDurationSec && (
                    <span>⏳ {draft.estimatedDurationSec} {t('sec')}</span>
                  )}
                  {draft.wordCount && (
                    <span>📝 {draft.wordCount} {t('words')}</span>
                  )}
                </div>
                <Link 
                  href={`/${locale}/dashboard/drafts/${draft.id}`}
                  className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t('open')} &rarr;
                </Link>
              </div>
            </div>
          ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
