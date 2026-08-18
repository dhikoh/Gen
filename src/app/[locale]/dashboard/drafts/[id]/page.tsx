import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TemplateToggle from "./TemplateToggle";
import DraftActions from "./DraftActions";
import DraftTitle from "./DraftTitle";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Drafts' });
  return { title: `${t('detailPageTitleTab')} - Prompt Gen` };
}

export default async function DraftDetailPage({ 
  params 
}: { 
  params: Promise<{ locale: string; id: string }> 
}) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const t = await getTranslations({ locale, namespace: 'Drafts' });

  const draft = await prisma.draft.findUnique({
    where: { id },
    include: {
      channel: true,
    }
  });

  if (!draft || draft.userId !== session.user.id) {
    notFound();
  }

  const parsedData = draft.parsedData as any;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/${locale}/dashboard/drafts`} className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block">
          &larr; {t('backToHistory')}
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <DraftTitle draftId={draft.id} initialTitle={draft.title || ""} />
            <div className="flex items-center space-x-3 text-sm text-zinc-500 dark:text-zinc-400">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                draft.type === "VIDEO"
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              }`}>
                {draft.type}
              </span>
              <span>•</span>
              <span>{new Date(draft.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span>{t('channel')}: {draft.channel?.channelName || "-"}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <TemplateToggle draftId={draft.id} initialIsTemplate={draft.isTemplate} />
            <DraftActions draftId={draft.id} rawJson={draft.rawJson} locale={locale} />
          </div>
        </div>
      </div>

      {draft.type === "VIDEO" && draft.targetDurationSec ? (
        <div className={`p-4 rounded-xl shadow-sm border mb-6 ${Math.abs(draft.targetDurationSec - (draft.estimatedDurationSec || 0)) / draft.targetDurationSec > 0.2 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">{t('durationAnalysis')}</h2>
          <div className="flex space-x-8">
            <div>
              <p className="text-xs text-zinc-500">{t('targetDuration')}</p>
              <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{draft.targetDurationSec} {t('seconds')}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">{t('estResult')}</p>
              <p className={`text-lg font-bold ${Math.abs(draft.targetDurationSec - (draft.estimatedDurationSec || 0)) / draft.targetDurationSec > 0.2 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>{draft.estimatedDurationSec} {t('seconds')}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">{t('wordCount')}</p>
              <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{draft.wordCount} {t('words')}</p>
            </div>
          </div>
          {Math.abs(draft.targetDurationSec - (draft.estimatedDurationSec || 0)) / draft.targetDurationSec > 0.2 && (
             <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium">{t('durationWarning')}</p>
          )}
        </div>
      ) : null}

      {/* Output Visualisasi */}
      <div className="space-y-6">
        <div className="glass-panel shadow-lg rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">{t('masterPrompt')}</h2>
          <p className="text-zinc-900 dark:text-zinc-200 text-lg leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
            {parsedData?.master_prompt || t('noMasterPrompt')}
          </p>
        </div>

        <div className="glass-panel shadow-lg rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">{t('systemInstruction')}</h2>
          <div className="bg-zinc-900 dark:bg-black text-green-400 font-mono text-sm p-4 rounded-lg overflow-x-auto">
            {parsedData?.system_instruction || t('noSystemInstruction')}
          </div>
        </div>

        {parsedData?.segments && parsedData.segments.length > 0 && (
          <div className="glass-panel shadow-lg rounded-xl p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('segments')}</h2>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {parsedData.segments.map((segment: any, idx: number) => (
                <div key={idx} className="p-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-bold">
                      {segment.order || idx + 1}
                    </span>
                    {segment.type && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                        {segment.type}
                      </span>
                    )}
                    {segment.duration_estimation && (
                      <span className="text-xs text-zinc-500 font-medium">
                        {t('durationLabel')} {segment.duration_estimation} {t('seconds')}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {segment.visual && (
                      <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded border border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs font-bold text-zinc-500 mb-1">{t('visual')}</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200">{segment.visual}</p>
                      </div>
                    )}
                    {segment.audio && (
                      <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded border border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs font-bold text-zinc-500 mb-1">{t('audio')}</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200">{segment.audio}</p>
                      </div>
                    )}
                  </div>
                  {segment.caption && (
                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded border border-yellow-100 dark:border-yellow-900/30">
                      <p className="text-xs font-bold text-yellow-800 dark:text-yellow-600 mb-1">{t('captionText')}</p>
                      <p className="text-sm text-yellow-900 dark:text-yellow-500 italic">"{segment.caption}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {parsedData?.variations && parsedData.variations.length > 0 && (
          <div className="glass-panel shadow-lg rounded-xl p-0 overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('imageVariations')}</h2>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {parsedData.variations.map((variation: any, idx: number) => (
                <div key={idx} className="p-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-bold">
                      {variation.id || idx + 1}
                    </span>
                    {variation.aspect_ratio && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                        {variation.aspect_ratio}
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded border border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-bold text-zinc-500 mb-1">{t('promptText')}</p>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200">{variation.prompt_text}</p>
                    </div>
                    {variation.negative_prompt && variation.negative_prompt !== "None" && (
                      <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded border border-red-100 dark:border-red-900/30">
                        <p className="text-xs font-bold text-red-800 dark:text-red-600 mb-1">{t('negativePrompt')}</p>
                        <p className="text-sm text-red-900 dark:text-red-500">{variation.negative_prompt}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
