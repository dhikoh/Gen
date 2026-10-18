"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { formatTime } from "@/lib/formatTime";
import type { VideoTimeline, VideoTimelineScene } from "@/types/videoTimeline";
import AnimationRenderer from "@/components/video/AnimationRenderer";
import { assembleVideo, type RenderProgress } from "@/lib/videoAssembler";
import { buildAnimationPrompt } from "@/lib/animationPromptBuilder";
import { buildFullVideoAiPrompt, type FullVideoPromptFormat } from "@/lib/fullVideoPromptBuilder";
import { mixAudio, audioBufferToWav } from "@/lib/audioMixer";
import { MAX_HTML_SIZE } from "@/lib/animationContract";

interface Props {
  timeline: VideoTimeline | null;
  onExportManifest: () => void;
  onSceneClick: (sceneNumber: number) => void;
  canUploadToDrive?: boolean;
  aspectRatio?: string;
  defaultMode?: "canvasRender" | "aiPrompt";
}

export default function VideoTimelineTab({
  timeline,
  onExportManifest,
  onSceneClick,
  canUploadToDrive = true,
  aspectRatio = "16:9",
  defaultMode = "canvasRender",
}: Props) {
  const t = useTranslations("VideoStudio");

  // Mode Selection: Web Animation Canvas Render vs AI Video Generator Prompt
  const [activeMode, setActiveMode] = useState<"canvasRender" | "aiPrompt">(defaultMode);

  // Mode 2: AI Video Generator Prompt Studio States
  const [aiFormat, setAiFormat] = useState<FullVideoPromptFormat>("cinematic");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeNarration, setIncludeNarration] = useState(true);
  const [includeOverlay, setIncludeOverlay] = useState(true);
  const [includeTransitions, setIncludeTransitions] = useState(true);
  const [aiAdditionalInstructions, setAiAdditionalInstructions] = useState("");
  const [aiPromptCopied, setAiPromptCopied] = useState(false);

  // Animation & Rendering States
  const [animationHtml, setAnimationHtml] = useState<string | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [iframeEl, setIframeEl] = useState<HTMLIFrameElement | null>(null);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isMixingAudio, setIsMixingAudio] = useState(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [isUploadingAudioDrive, setIsUploadingAudioDrive] = useState(false);
  const [audioDriveLink, setAudioDriveLink] = useState<string | null>(null);

  // Copy structured prompt for external AI animator
  const handleCopyPrompt = useCallback(async () => {
    if (!timeline) return;
    try {
      const prompt = buildAnimationPrompt(timeline, {
        additionalInstructions: additionalInstructions.trim() || undefined,
      });
      await navigator.clipboard.writeText(prompt);
      toast.success(t("promptCopied"));
    } catch {
      toast.error(t("renderError"));
    }
  }, [timeline, additionalInstructions, t]);

  // Compute Full AI Video Prompt (Mode 2)
  const fullAiVideoPrompt = useMemo(() => {
    if (!timeline) return "";
    return buildFullVideoAiPrompt(timeline, {
      format: aiFormat,
      aspectRatio,
      includeTimestamps,
      includeNarration,
      includeOverlay,
      includeTransitions,
      additionalInstructions: aiAdditionalInstructions.trim() || undefined,
    });
  }, [
    timeline,
    aiFormat,
    aspectRatio,
    includeTimestamps,
    includeNarration,
    includeOverlay,
    includeTransitions,
    aiAdditionalInstructions,
  ]);

  const fullPromptWordCount = useMemo(() => {
    if (!fullAiVideoPrompt) return 0;
    return fullAiVideoPrompt.trim().split(/\s+/).length;
  }, [fullAiVideoPrompt]);

  const handleCopyFullAiPrompt = useCallback(async () => {
    if (!fullAiVideoPrompt) return;
    try {
      await navigator.clipboard.writeText(fullAiVideoPrompt);
      toast.success(t("fullPromptCopied"));
      setAiPromptCopied(true);
      setTimeout(() => setAiPromptCopied(false), 2000);
    } catch {
      toast.error(t("renderError"));
    }
  }, [fullAiVideoPrompt, t]);

  // Start sequential video render
  const handleRender = useCallback(async () => {
    if (!animationHtml || !iframeEl || !timeline) return;
    try {
      setIsRendering(true);
      setRenderProgress({ currentFrame: 0, totalFrames: 1, percent: 0 });
      setVideoBlob(null);

      const blob = await assembleVideo(
        iframeEl,
        timeline.totalDurationSec,
        (progress) => {
          setRenderProgress(progress);
        }
      );

      setVideoBlob(blob);
      toast.success(t("downloadComplete"));
    } catch (err) {
      console.error("Rendering failed:", err);
      toast.error(t("renderError"));
    } finally {
      setIsRendering(false);
    }
  }, [animationHtml, iframeEl, timeline, t]);

  // Download rendered WebM video
  const handleDownloadVideo = useCallback(() => {
    if (!videoBlob || !timeline) return;
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-${timeline.draftId || "render"}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("downloadComplete"));
  }, [videoBlob, timeline, t]);

  // Mix and download WAV narration audio
  const handleDownloadAudio = useCallback(async () => {
    if (!timeline) return;
    const scenesWithAudio = timeline.scenes.filter((s) => s.audioRef);
    if (scenesWithAudio.length === 0) {
      toast.error(t("noAudioAvailable"));
      return;
    }

    try {
      setIsMixingAudio(true);
      const mixed = await mixAudio(timeline.scenes, timeline.totalDurationSec);
      const wavBlob = audioBufferToWav(mixed);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audio-${timeline.draftId || "render"}.wav`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("downloadComplete"));
    } catch (err) {
      console.error("Audio mixing error:", err);
      toast.error(t("renderError"));
    } finally {
      setIsMixingAudio(false);
    }
  }, [timeline, t]);

  // Upload to Google Drive with 3x retry + exponential backoff
  const handleUploadToDrive = useCallback(async () => {
    if (!videoBlob || !timeline) return;

    if (!canUploadToDrive) {
      toast.error(t("driveFeatureLocked"));
      return;
    }

    setIsUploadingDrive(true);
    setDriveLink(null);

    const blobToBase64 = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(",")[1];
          if (base64) resolve(base64);
          else reject(new Error("Failed to convert blob to base64"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    let lastError: Error | null = null;

    try {
      const base64Data = await blobToBase64(videoBlob);
      const filename = `video-${timeline.draftId || "render"}-${Date.now()}.webm`;

      while (attempt < maxRetries && !success) {
        attempt++;
        try {
          const res = await fetch("/api/user/google-drive/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename,
              mimeType: videoBlob.type || "video/webm",
              base64Data,
            }),
          });

          const data = (await res.json()) as { success?: boolean; error?: string; webViewLink?: string };
          if (res.ok && data.success) {
            success = true;
            setDriveLink(data.webViewLink || null);
            toast.success(t("uploadDriveSuccess"));
            break;
          } else {
            throw new Error(data.error || "Upload failed");
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      if (!success) {
        toast.error(lastError?.message || t("uploadDriveFailed"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("uploadDriveFailed"));
    } finally {
      setIsUploadingDrive(false);
    }
  }, [videoBlob, timeline, canUploadToDrive, t]);

  // Upload mixed WAV narration audio to Google Drive with 3x retry + exponential backoff
  const handleUploadAudioToDrive = useCallback(async () => {
    if (!timeline) return;

    if (!canUploadToDrive) {
      toast.error(t("driveFeatureLocked"));
      return;
    }

    const scenesWithAudio = timeline.scenes.filter((s) => s.audioRef);
    if (scenesWithAudio.length === 0) {
      toast.error(t("noAudioAvailable"));
      return;
    }

    setIsUploadingAudioDrive(true);
    setAudioDriveLink(null);

    const blobToBase64 = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(",")[1];
          if (base64) resolve(base64);
          else reject(new Error("Failed to convert blob to base64"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    let lastError: Error | null = null;

    try {
      const mixed = await mixAudio(timeline.scenes, timeline.totalDurationSec);
      const wavBlob = audioBufferToWav(mixed);
      const base64Data = await blobToBase64(wavBlob);
      const filename = `audio-${timeline.draftId || "render"}-${Date.now()}.wav`;

      while (attempt < maxRetries && !success) {
        attempt++;
        try {
          const res = await fetch("/api/user/google-drive/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename,
              mimeType: "audio/wav",
              base64Data,
            }),
          });

          const data = (await res.json()) as { success?: boolean; error?: string; webViewLink?: string };
          if (res.ok && data.success) {
            success = true;
            setAudioDriveLink(data.webViewLink || null);
            toast.success(t("uploadDriveSuccess"));
            break;
          } else {
            throw new Error(data.error || "Upload failed");
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      if (!success) {
        toast.error(lastError?.message || t("uploadDriveFailed"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("uploadDriveFailed"));
    } finally {
      setIsUploadingAudioDrive(false);
    }
  }, [timeline, canUploadToDrive, t]);

  if (!timeline || timeline.scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="pg-text-muted text-sm">{t("noTimeline")}</p>
      </div>
    );
  }

  const htmlSizeBytes = animationHtml ? new Blob([animationHtml]).size : 0;
  const htmlSizeKb = (htmlSizeBytes / 1024).toFixed(0);
  const maxMb = (MAX_HTML_SIZE / 1024 / 1024).toFixed(0);

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b pg-border/40">
        <div>
          <h3 className="pg-text-heading text-lg font-bold flex items-center gap-2">
            <span>🎞️</span> {t("timelineTitle")}
          </h3>
          <p className="pg-text-muted text-xs">
            {t("totalDuration", { time: formatTime(timeline.totalDurationSec) })}
            {" · "}
            {t("sceneCount", { count: timeline.scenes.length })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="neu-btn px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
            title={t("copyAnimationPrompt")}
          >
            <span>📋</span> {t("copyAnimationPrompt")}
          </button>
          <button
            type="button"
            onClick={onExportManifest}
            className="neu-btn px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
          >
            <span>📦</span> {t("exportManifest")}
          </button>
        </div>
      </div>

      {/* ── Proportional Timeline Bar ── */}
      <div className="space-y-1">
        <div className="relative w-full h-8 rounded-lg neu-pressed overflow-hidden flex shadow-inner">
          {timeline.scenes.map((scene) => (
            <div
              key={scene.sceneNumber}
              onClick={() => onSceneClick(scene.sceneNumber)}
              className="h-full cursor-pointer hover:opacity-80 transition-opacity pg-border border-r"
              style={{
                width: `${(scene.durationSec / timeline.totalDurationSec) * 100}%`,
                backgroundColor: scene.chapter
                  ? `hsl(${(scene.chapter * 60) % 360}, 50%, 60%)`
                  : "var(--pg-brand)",
              }}
              title={`Scene ${scene.sceneNumber} (${formatTime(scene.startOffsetSec)})`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] pg-text-muted font-mono px-1">
          <span>0:00</span>
          <span>{formatTime(timeline.totalDurationSec)}</span>
        </div>
      </div>

      {/* ── Scene Cards Accordion/List ── */}
      <div className="space-y-2 max-h-[35vh] overflow-y-auto custom-scrollbar pr-1">
        {timeline.scenes.map((scene) => (
          <SceneCard key={scene.sceneNumber} scene={scene} onClick={() => onSceneClick(scene.sceneNumber)} />
        ))}
      </div>

      {/* ── Mode Switcher Pills (Opsi 2) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-2xl pg-surface-dim border pg-border shadow-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveMode("canvasRender")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeMode === "canvasRender"
                ? "bg-white dark:bg-slate-900 text-[var(--pg-brand)] shadow-sm"
                : "pg-text-muted hover:pg-text-heading"
            }`}
          >
            <span>🌐</span> {t("modeCanvasRender")}
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("aiPrompt")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeMode === "aiPrompt"
                ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                : "pg-text-muted hover:pg-text-heading"
            }`}
          >
            <span>🤖</span> {t("modeAiPrompt")}
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300">
              1 Video Utuh
            </span>
          </button>
        </div>
        <p className="text-[11px] pg-text-muted px-2">
          {activeMode === "canvasRender" ? t("modeCanvasRenderDesc") : t("modeAiPromptDesc")}
        </p>
      </div>

      {/* ── Mode 1: Web Animation Canvas Render Engine ── */}
      {activeMode === "canvasRender" && (
        <div className="glass-panel rounded-2xl p-5 border pg-border space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-bold pg-text-heading flex items-center gap-2">
              <span>🎨</span> {t("pasteAnimationCode")}
            </h4>
            <span className="text-[11px] font-mono pg-text-muted">
              {t("htmlSizeInfo", { current: htmlSizeKb, max: maxMb })}
            </span>
          </div>

          {/* Optional custom instructions for prompt */}
          <div className="space-y-1">
            <input
              type="text"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="Instruksi kustom AI (opsional, disematkan ke prompt)..."
              className="w-full px-3 py-1.5 rounded-lg neu-pressed pg-text-heading text-xs focus:outline-none focus:ring-1 focus:ring-[var(--pg-brand)]"
            />
          </div>

          {/* Textarea for animation code */}
          <div className="space-y-1.5">
            <textarea
              value={animationHtml ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length > MAX_HTML_SIZE) {
                  toast.error(t("htmlTooLarge"));
                  return;
                }
                setAnimationHtml(val || null);
              }}
              placeholder={t("pasteAnimationCodeHint")}
              rows={5}
              className="w-full px-3 py-2 rounded-xl neu-pressed pg-text-heading text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-[var(--pg-brand)]"
            />
          </div>

          {/* Interactive Sandbox Preview */}
          {animationHtml && (
            <div className="space-y-2 pt-2 border-t pg-border/40">
              <h5 className="text-xs font-semibold pg-text-heading flex items-center gap-1.5">
                <span>👁️</span> {t("previewTitle")}
              </h5>
              <AnimationRenderer
                htmlCode={animationHtml}
                onReady={() => {}}
                onError={(err) => toast.error(err)}
                onIframeRef={setIframeEl}
              />
            </div>
          )}

          {/* Render Controls & Progress */}
          <div className="space-y-3 pt-2 border-t pg-border/40">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleRender}
                disabled={!animationHtml || isRendering || !iframeEl}
                className="neu-btn-brand px-5 py-2 text-sm font-semibold rounded-xl disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <span>⚡</span>
                {isRendering
                  ? t("rendering", { percent: renderProgress?.percent ?? 0 })
                  : t("startRender")}
              </button>

              {videoBlob && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadVideo}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <span>🎥</span> {t("downloadVideo")}
                  </button>

                  <button
                    type="button"
                    onClick={handleUploadToDrive}
                    disabled={isUploadingDrive}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    <span>☁️</span> {isUploadingDrive ? t("uploadingToDrive") : t("uploadToDrive")}
                  </button>

                  {driveLink && (
                    <a
                      href={driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                    >
                      <span>↗️</span> {t("openInDrive")}
                    </a>
                  )}
                </>
              )}

              {timeline.scenes.some((s) => s.audioRef) && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadAudio}
                    disabled={isMixingAudio}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    <span>🎙️</span> {isMixingAudio ? t("loading") : t("downloadAudio")}
                  </button>

                  <button
                    type="button"
                    onClick={handleUploadAudioToDrive}
                    disabled={isUploadingAudioDrive || isMixingAudio}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    <span>☁️</span> {isUploadingAudioDrive ? t("uploadingToDrive") : t("uploadAudioToDrive")}
                  </button>

                  {audioDriveLink && (
                    <a
                      href={audioDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                    >
                      <span>↗️</span> {t("openInDrive")}
                    </a>
                  )}
                </>
              )}
            </div>

            {/* Progress bar */}
            {isRendering && renderProgress && (
              <div className="space-y-1">
                <div className="w-full h-2.5 rounded-full neu-pressed overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{
                      width: `${renderProgress.percent}%`,
                      backgroundColor: "var(--pg-brand)",
                    }}
                  />
                </div>
                <p className="text-[11px] pg-text-muted text-right font-mono">
                  {renderProgress.currentFrame} / {renderProgress.totalFrames} frames ({renderProgress.percent}%)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mode 2: AI Video Generator Prompt Studio (Opsi 2) ── */}
      {activeMode === "aiPrompt" && (
        <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 dark:border-purple-800/30 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent space-y-5">
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b pg-border/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h4 className="text-sm font-bold pg-text-heading">{t("modeAiPrompt")}</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  1 Video Utuh
                </span>
              </div>
              <p className="text-xs pg-text-muted mt-0.5">
                {t("promptSummaryInfo", {
                  count: timeline.scenes.length,
                  duration: formatTime(timeline.totalDurationSec),
                  words: fullPromptWordCount,
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyFullAiPrompt}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <span>{aiPromptCopied ? "✓" : "📋"}</span>
              {aiPromptCopied ? t("fullPromptCopied") : t("copyFullPrompt")}
            </button>
          </div>

          {/* Format Selection & Options */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold pg-text-sub flex items-center gap-1 mb-2">
                <span>🎯</span> {t("targetAiFormat")}:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { id: "cinematic", label: t("formatCinematic"), icon: "🎥", desc: "Sora, Runway Gen-3, Kling, Luma" },
                  { id: "script_to_video", label: t("formatScriptToVideo"), icon: "📝", desc: "InVideo AI, CapCut Script to Video" },
                  { id: "story", label: t("formatStory"), icon: "📖", desc: "Continuous Narrative Arc" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setAiFormat(fmt.id as FullVideoPromptFormat)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      aiFormat === fmt.id
                        ? "border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 ring-1 ring-purple-500/50"
                        : "pg-surface-dim pg-border hover:border-purple-300 dark:hover:border-purple-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{fmt.icon}</span>
                      <span className="text-xs font-bold pg-text-heading">{fmt.label}</span>
                    </div>
                    <p className="text-[10px] pg-text-muted mt-1">{fmt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Checkboxes / Elements Toggle */}
            <div className="flex items-center gap-4 flex-wrap pt-1 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer pg-text-sub select-none font-medium">
                <input
                  type="checkbox"
                  checked={includeTimestamps}
                  onChange={(e) => setIncludeTimestamps(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 accent-purple-600 cursor-pointer"
                />
                <span>⏱️ {t("includeTimestamps")}</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer pg-text-sub select-none font-medium">
                <input
                  type="checkbox"
                  checked={includeNarration}
                  onChange={(e) => setIncludeNarration(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 accent-purple-600 cursor-pointer"
                />
                <span>🎤 {t("includeNarration")}</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer pg-text-sub select-none font-medium">
                <input
                  type="checkbox"
                  checked={includeOverlay}
                  onChange={(e) => setIncludeOverlay(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 accent-purple-600 cursor-pointer"
                />
                <span>💬 {t("includeOverlay")}</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer pg-text-sub select-none font-medium">
                <input
                  type="checkbox"
                  checked={includeTransitions}
                  onChange={(e) => setIncludeTransitions(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 accent-purple-600 cursor-pointer"
                />
                <span>🔄 {t("includeTransitions")}</span>
              </label>

              <span className="text-[11px] font-mono pg-text-muted ml-auto">
                {t("aspectRatioLabel")}: <strong>{aspectRatio}</strong>
              </span>
            </div>

            {/* Additional Directives */}
            <input
              type="text"
              value={aiAdditionalInstructions}
              onChange={(e) => setAiAdditionalInstructions(e.target.value)}
              placeholder={t("additionalPromptInstructions")}
              className="w-full px-3 py-1.5 rounded-lg neu-pressed pg-text-heading text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Full Prompt Display Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold pg-text-muted uppercase tracking-wider">
                PROMPT 1 VIDEO UTUH
              </span>
              <button
                type="button"
                onClick={handleCopyFullAiPrompt}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold flex items-center gap-1"
              >
                {aiPromptCopied ? "✓ " + t("copied") : "📋 " + t("copyFullPrompt")}
              </button>
            </div>

            <textarea
              readOnly
              value={fullAiVideoPrompt}
              rows={12}
              className="w-full px-4 py-3 rounded-xl neu-pressed pg-text-heading text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-purple-500 custom-scrollbar leading-relaxed"
            />
          </div>

          {/* Recommended Tools Guide */}
          <div className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 text-xs space-y-2">
            <h5 className="font-bold pg-text-heading flex items-center gap-1.5">
              <span>💡</span> {t("recommendedToolsTitle")}
            </h5>
            <p className="pg-text-muted leading-relaxed">
              {aiFormat === "script_to_video" ? (
                <>
                  Format <strong>Script to Video</strong> sangat ideal untuk <strong>InVideo AI</strong>, <strong>CapCut Script to Video</strong>, atau <strong>Pictory</strong>. Tempel teks di atas sebagai naskah lengkap, AI tersebut akan otomatis memilih visual b-roll dan memotong durasi per adegan.
                </>
              ) : aiFormat === "cinematic" ? (
                <>
                  Format <strong>Sinematik Multi-Scene</strong> menyertakan arahan kontinuitas kamera dan timestamp transisi yang presisi, dirancang untuk model video generatif lanjutan seperti <strong>OpenAI Sora</strong>, <strong>Runway Gen-3 Alpha</strong>, <strong>Kling AI</strong>, atau <strong>Luma Dream Machine</strong>.
                </>
              ) : (
                <>
                  Format <strong>Alur Cerita Berkelanjutan</strong> menyajikan alur naratif sinematik langsung mengalir dari awal hingga akhir, cocok untuk AI video generator berbasis cerita dramatik dan explainer.
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SceneCard({ scene, onClick }: { scene: VideoTimelineScene; onClick: () => void }) {
  const t = useTranslations("VideoStudio");
  return (
    <div
      onClick={onClick}
      className="neu-flat rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow border pg-border/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold pg-text-heading">
              {t("sceneLabel", { n: scene.sceneNumber })}
            </span>
            <span className="text-[11px] pg-text-muted font-mono">
              {formatTime(scene.startOffsetSec)} - {formatTime(scene.startOffsetSec + scene.durationSec)}
            </span>
            {scene.chapterTitle && (
              <span className="text-[10px] px-2 py-0.5 rounded-full neu-sm pg-text-sub font-medium">
                {scene.chapterTitle}
              </span>
            )}
          </div>
          <p className="text-xs pg-text-sub mt-1 line-clamp-2">{scene.narration || "—"}</p>
          {scene.textOverlay && (
            <p className="text-[11px] pg-text-muted mt-0.5 italic">[Overlay: {scene.textOverlay}]</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs font-mono font-semibold pg-text-heading">{scene.durationSec}s</span>
          {scene.audioRef && (
            <span className="block text-[10px] mt-0.5 font-medium" style={{ color: "var(--pg-brand)" }}>
              {t("audioReady")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
