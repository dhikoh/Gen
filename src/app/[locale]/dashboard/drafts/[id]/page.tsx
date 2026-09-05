import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TemplateToggle from "./TemplateToggle";
import DraftActions from "./DraftActions";
import DraftTitle from "./DraftTitle";
import { getTranslations } from "next-intl/server";
import CopyButton from "@/components/dashboard/CopyButton";
import sanitizeHtml from "sanitize-html";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params;
 const t = await getTranslations({ locale, namespace: 'Drafts' });
 return { title: `${t('detailPageTitleTab')} - Prompt Gen` };
}

interface VideoSegment {
 order?: number;
 type?: string;
 duration_estimation?: number;
 visual?: string;
 audio?: string;
 caption?: string;
}

// Schema baru dari Scene Prompt Studio (scenes[].narasi)
interface SceneItem {
 id?: number;
 sceneNumber?: string;
 narasi?: string;
 visual?: string;
 durasi?: string;
 bgmCues?: string[];
 sfxCues?: string[];
}

interface ImageVariation {
 id?: number;
 aspect_ratio?: string;
 prompt_text?: string;
 narrative_prompt?: string;
 negative_prompt?: string;
}

// Fix audit 3.2: DraftParsedData mendukung KEDUA schema:
// - schema lama (alur Generator langsung): segments[], caption_medsos, ide_thumbnail, opsi_judul
// - schema baru (alur Scene Prompt Studio): scenes[], caption, thumbnailData
// Field canonical selalu diprioritaskan; alias lama sebagai fallback
interface DraftParsedData {
 // Canonical fields (ditulis oleh semua jalur sejak audit 3.2)
 opsi_judul?: string[];
 caption_medsos?: string;
 ide_thumbnail?: string;
 html_blog?: string;
 segments?: VideoSegment[]; // canonical (Generator) + alias dari scenes (Scene Studio)
 variations?: ImageVariation[];
 // Alias backup dari Scene Prompt Studio (sebelum fix audit 3.2)
 scenes?: SceneItem[];
 caption?: string; // alias dari caption_medsos
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
      channel: {
        include: {
          contentArchetype: true,
        },
      },
    },
  });

  if (!draft || draft.userId !== session.user.id) {
    notFound();
  }

  const parsedData = draft.parsedData as unknown as DraftParsedData;

  const isDiegetic =
    draft.channel?.contentArchetype?.narrationMode === "DIEGETIC_ONLY" ||
    draft.channel?.contentArchetype?.narrationMode === "SILENT_TEXT_ONLY";
  const isSegmentEstimate = draft.durationSource === "SEGMENT_ESTIMATE";
  const durationDiffRatio = draft.targetDurationSec
    ? Math.abs(draft.targetDurationSec - (draft.estimatedDurationSec || 0)) / draft.targetDurationSec
    : 0;
  const isDurationWarning =
    durationDiffRatio > 0.2 && !(isDiegetic && draft.estimatedDurationSec === draft.targetDurationSec);

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/${locale}/dashboard/drafts`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
        >
          ← {t("backToHistory")}
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <DraftTitle draftId={draft.id} initialTitle={draft.title || ""} />
            <div className="flex items-center space-x-3 text-sm pg-text-muted flex-wrap gap-y-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  draft.type === "VIDEO"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                }`}
              >
                {draft.type}
              </span>
              <span>•</span>
              <span>
                {new Date(draft.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>•</span>
              <span>
                {t("channel")}: {draft.channel?.channelName || "-"}
              </span>
              {draft.channel?.contentArchetype && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium">
                    {draft.channel.contentArchetype.name}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <TemplateToggle draftId={draft.id} initialIsTemplate={draft.isTemplate} />
            <DraftActions draftId={draft.id} rawJson={draft.rawJson} locale={locale} />
          </div>
        </div>
      </div>

      {draft.type === "VIDEO" && draft.targetDurationSec ? (
        <div
          className={`p-4 rounded-xl shadow-sm border mb-6 ${
            isDurationWarning
              ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
              : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          }`}
        >
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">
              {t("durationAnalysis")}
            </h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border pg-border">
              {isSegmentEstimate
                ? "⏱️ Estimasi Durasi Adegan (Segment Self-Estimate)"
                : "🎙️ Estimasi Narasi (Wordcount Voice-Over)"}
            </span>
          </div>
          <div className="flex space-x-8 flex-wrap gap-y-2">
            <div>
              <p className="text-xs pg-text-muted">{t("targetDuration")}</p>
              <p className="text-lg font-bold pg-text-heading">
                {draft.targetDurationSec} {t("seconds")}
              </p>
            </div>
            <div>
              <p className="text-xs pg-text-muted">{t("estResult")}</p>
              <p
                className={`text-lg font-bold ${
                  isDurationWarning
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {draft.estimatedDurationSec} {t("seconds")}
              </p>
            </div>
            <div>
              <p className="text-xs pg-text-muted">{t("wordCount")}</p>
              <p className="text-lg font-bold pg-text-heading">
                {draft.wordCount} {t("words")}
              </p>
            </div>
          </div>
          {isDurationWarning && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
              {t("durationWarning")}
            </p>
          )}
        </div>
      ) : null}

 {/* Output Visualisasi */}
 <div className="space-y-6">
 {parsedData?.opsi_judul && parsedData.opsi_judul.length > 0 && (
 <div className="glass-panel shadow-lg rounded-xl p-6">
 <div className="flex justify-between items-start mb-4">
 <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">
 Opsi Judul Viral (Rekomendasi AI Tahap 1)
 </h2>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {parsedData.opsi_judul.map((title: string, idx: number) => (
 <div
 key={idx}
 className="flex items-center justify-between p-3 pg-bg-page rounded-lg border pg-border text-sm pg-text-heading"
 >
 <div className="flex items-center flex-1 min-w-0 mr-2">
 <span className="font-bold text-xs text-blue-600 dark:text-blue-400 mr-2 shrink-0">
 #{idx + 1}
 </span>
 <span className="truncate" title={title}>{title}</span>
 </div>
 <CopyButton textToCopy={title} />
 </div>
 ))}
 </div>
 </div>
 )}

 {parsedData?.caption_medsos && (
 <div className="glass-panel shadow-lg rounded-xl p-6">
 <div className="flex justify-between items-start mb-4">
 <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">Caption Medsos</h2>
 <CopyButton textToCopy={parsedData.caption_medsos} />
 </div>
 <p className="pg-text-heading whitespace-pre-wrap pg-bg-page p-4 rounded-lg border pg-border">
 {parsedData.caption_medsos}
 </p>
 </div>
 )}

 {parsedData?.ide_thumbnail && (
 <div className="glass-panel shadow-lg rounded-xl p-6">
 <div className="flex justify-between items-start mb-4">
 <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">Ide Thumbnail</h2>
 <CopyButton textToCopy={parsedData.ide_thumbnail} />
 </div>
 <p className="pg-text-heading pg-bg-page p-4 rounded-lg border pg-border">
 {parsedData.ide_thumbnail}
 </p>
 </div>
 )}

 {parsedData?.html_blog && (
 <div className="glass-panel shadow-lg rounded-xl p-6">
 <div className="flex justify-between items-start mb-4">
 <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">HTML Blog</h2>
 <CopyButton textToCopy={parsedData.html_blog} />
 </div>
 <div className="pg-bg-page p-4 rounded-lg border pg-border overflow-x-auto">
 <div 
 className="prose dark:prose-invert max-w-none text-sm"
 dangerouslySetInnerHTML={{ __html: sanitizeHtml(parsedData.html_blog, { allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a', 'br', 'hr', 'blockquote'], allowedAttributes: { a: ['href', 'target', 'rel'] } }) }}
 />
 </div>
 </div>
 )}

 {/* Fix audit 3.2: Tampilkan segments (dari Generator) ATAU scenes (dari Scene Studio pra-fix)
 Prioritas: parsedData.segments (canonical) > parsedData.scenes (alias backup) */}
 {(() => {
 const canonicalSegments = parsedData?.segments && parsedData.segments.length > 0 ? parsedData.segments : null;
 const scenesFallback = parsedData?.scenes && parsedData.scenes.length > 0 ? parsedData.scenes : null;
 if (canonicalSegments) {
 return (
 <div className="glass-panel shadow-lg rounded-xl p-0 overflow-hidden">
 <div className="px-6 py-4 border-b pg-border pg-bg-page">
 <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">{t('segments')}</h2>
 </div>
 <div className="divide-y pg-divide">
 {canonicalSegments.map((segment: VideoSegment, idx: number) => (
 <div key={idx} className="p-6 hover:pg-surface-dim/50 dark:hover:pg-surface/50 transition-colors">
 <div className="flex items-center space-x-3 mb-4">
 <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-bold">
 {segment.order || idx + 1}
 </span>
 {segment.type && (
 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium pg-surface-dim pg-text-heading dark:pg-text-muted">
 {segment.type}
 </span>
 )}
 {segment.duration_estimation && (
 <span className="text-xs pg-text-muted font-medium">
 {t('durationLabel')} {segment.duration_estimation} {t('seconds')}
 </span>
 )}
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {segment.visual && (
 <div className="pg-bg-page p-3 rounded border pg-border">
 <p className="text-xs font-bold pg-text-muted mb-1">{t('visual')}</p>
 <p className="text-sm pg-text-heading">{segment.visual}</p>
 </div>
 )}
 {segment.audio && (
 <div className="pg-bg-page p-3 rounded border pg-border">
 <p className="text-xs font-bold pg-text-muted mb-1">{t('audio')}</p>
 <p className="text-sm pg-text-heading">{segment.audio}</p>
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
 );
 }
 if (scenesFallback) {
 // Render scene items dari schema Scene Studio lama (pra-fix audit 3.2)
 return (
 <div className="glass-panel shadow-lg rounded-xl p-0 overflow-hidden">
 <div className="px-6 py-4 border-b pg-border pg-bg-page">
 <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">{t('segments')}</h2>
 </div>
 <div className="divide-y pg-divide">
 {scenesFallback.map((scene: SceneItem, idx: number) => (
 <div key={idx} className="p-6 hover:pg-surface-dim/50 dark:hover:pg-surface/50 transition-colors">
 <div className="flex items-center space-x-3 mb-4">
 <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-bold">
 {idx + 1}
 </span>
 {scene.sceneNumber && (
 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium pg-surface-dim pg-text-heading dark:pg-text-muted">
 {scene.sceneNumber}
 </span>
 )}
 {scene.durasi && (
 <span className="text-xs pg-text-muted font-medium">{scene.durasi}</span>
 )}
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {scene.narasi && (
 <div className="pg-bg-page p-3 rounded border pg-border">
 <p className="text-xs font-bold pg-text-muted mb-1">🎤 Narasi</p>
 <p className="text-sm pg-text-heading">{scene.narasi}</p>
 </div>
 )}
 {scene.visual && (
 <div className="pg-bg-page p-3 rounded border pg-border">
 <p className="text-xs font-bold pg-text-muted mb-1">🎨 Visual Prompt</p>
 <p className="text-sm pg-text-heading">{scene.visual}</p>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
 }
 return null;
 })()}
 {/* caption_medsos fallback: jika tidak ada, cek alias caption dari schema lama */}
 {!parsedData?.caption_medsos && parsedData?.caption && (
 <div className="glass-panel shadow-lg rounded-xl p-6">
 <div className="flex justify-between items-start mb-4">
 <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">Caption Medsos</h2>
 <CopyButton textToCopy={parsedData.caption} />
 </div>
 <p className="pg-text-heading whitespace-pre-wrap pg-bg-page p-4 rounded-lg border pg-border">
 {parsedData.caption}
 </p>
 </div>
 )}
 {parsedData?.variations && parsedData.variations.length > 0 && (
 <div className="glass-panel shadow-lg rounded-xl p-0 overflow-hidden mt-6">
 <div className="px-6 py-4 border-b pg-border pg-bg-page">
 <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">{t('imageVariations')}</h2>
 </div>
 <div className="divide-y pg-divide">
 {parsedData.variations.map((variation: ImageVariation, idx: number) => (
 <div key={idx} className="p-6 hover:pg-surface-dim/50 dark:hover:pg-surface/50 transition-colors">
 <div className="flex items-center space-x-3 mb-4">
 <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-bold">
 {variation.id || idx + 1}
 </span>
 {variation.aspect_ratio && (
 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium pg-surface-dim pg-text-heading dark:pg-text-muted">
 {variation.aspect_ratio}
 </span>
 )}
 </div>
 <div className="space-y-4">
 <div className="pg-bg-page p-3 rounded border pg-border">
 <p className="text-xs font-bold pg-text-muted mb-1">{t('promptText')} (Tag)</p>
 <p className="text-sm pg-text-heading">{variation.prompt_text}</p>
 </div>
 {variation.narrative_prompt && (
 <div className="pg-bg-page p-3 rounded border pg-border">
 <p className="text-xs font-bold pg-text-muted mb-1">{t('promptText')} (Naratif)</p>
 <p className="text-sm pg-text-heading">{variation.narrative_prompt}</p>
 </div>
 )}
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
