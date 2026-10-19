"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { VideoTimeline } from "@/types/videoTimeline";
import {
  MAX_ADDITIONAL_INSTRUCTIONS_LENGTH,
  buildRemotionBoilerplate,
  buildRemotionPrompt,
  componentNameFromTitle,
  computeRemotionPlan,
  getRemotionDimensions,
  isRemotionTheme,
  isValidComponentName,
  sanitizeComponentName,
  validateRemotionCode,
  REMOTION_THEMES,
  type RemotionAspectRatio,
  type RemotionFps,
  type RemotionIssue,
  type RemotionIssueCode,
  type RemotionPromptOptions,
  type RemotionTheme,
  type RemotionValidationResult,
} from "@/lib/remotionPromptBuilder";
import { renderRemotionFrame } from "@/lib/remotionCanvasRenderer";
import {
  assembleRemotionVideo,
  type RemotionRenderProgress,
  type RemotionRenderResult,
} from "@/lib/remotionVideoAssembler";
import { exportRemotionZip } from "@/lib/remotionZipExporter";

export interface RemotionStudioTabProps {
  timeline: VideoTimeline | null;
  scenesCount: number;
  draftTitle: string;
  canUploadToDrive?: boolean;
  initialCode?: string | null;
}

type SubTab = "prompt" | "boilerplate" | "validator";

const SUB_TABS: readonly SubTab[] = ["prompt", "boilerplate", "validator"];
const SUB_TAB_LABEL_KEYS = {
  prompt: "subTabPrompt",
  boilerplate: "subTabBoilerplate",
  validator: "subTabValidator",
} as const;
const ASPECTS: readonly RemotionAspectRatio[] = ["16:9", "9:16"];
const ASPECT_LABEL_KEYS = { "16:9": "aspect169", "9:16": "aspect916" } as const;
const THEME_LABEL_KEYS = {
  modern: "themeModern",
  cyberpunk: "themeCyberpunk",
  documentary: "themeDocumentary",
  kinetic: "themeKinetic",
} as const;

const pill = (active: boolean): string =>
  "pg-border rounded-lg border px-3 py-1.5 text-sm transition-colors " +
  (active ? "pg-text-heading font-semibold" : "pg-text-muted");

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback di bawah
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, filename);
}

const ISSUE_KEYS: Record<
  RemotionIssueCode,
  | "validatorIssue_empty"
  | "validatorIssue_tooLarge"
  | "validatorIssue_missingRemotionImport"
  | "validatorIssue_missingExport"
  | "validatorIssue_interpolateNoClamp"
  | "validatorIssue_usesAny"
  | "validatorIssue_nonDeterministic"
  | "validatorIssue_cssAnimation"
  | "validatorIssue_nonIntegerFrames"
  | "validatorIssue_usesClassName"
  | "validatorIssue_plainImgTag"
  | "validatorIssue_usesStateOrEffect"
  | "validatorIssue_springUnguarded"
  | "validatorIssue_externalUrl"
  | "validatorIssue_interpolateClampUnverifiable"
  | "validatorIssue_noSequenceOrAbsoluteFill"
> = {
  empty: "validatorIssue_empty",
  tooLarge: "validatorIssue_tooLarge",
  missingRemotionImport: "validatorIssue_missingRemotionImport",
  missingExport: "validatorIssue_missingExport",
  interpolateNoClamp: "validatorIssue_interpolateNoClamp",
  usesAny: "validatorIssue_usesAny",
  nonDeterministic: "validatorIssue_nonDeterministic",
  cssAnimation: "validatorIssue_cssAnimation",
  nonIntegerFrames: "validatorIssue_nonIntegerFrames",
  usesClassName: "validatorIssue_usesClassName",
  plainImgTag: "validatorIssue_plainImgTag",
  usesStateOrEffect: "validatorIssue_usesStateOrEffect",
  springUnguarded: "validatorIssue_springUnguarded",
  externalUrl: "validatorIssue_externalUrl",
  interpolateClampUnverifiable: "validatorIssue_interpolateClampUnverifiable",
  noSequenceOrAbsoluteFill: "validatorIssue_noSequenceOrAbsoluteFill",
};

function IssueList({ issues }: { issues: readonly RemotionIssue[] }) {
  const t = useTranslations("RemotionStudio");
  return (
    <ul className="mt-2 space-y-2">
      {issues.map((issue, i) => (
        <li key={issue.code + "-" + i} className="text-sm">
          <span className="pg-text-heading">{t(ISSUE_KEYS[issue.code])}</span>
          {issue.line !== undefined ? (
            <span className="pg-text-muted"> ({t("validatorLine", { line: issue.line })})</span>
          ) : null}
          {issue.detail !== undefined && issue.detail.length > 0 ? (
            <code className="pg-text-muted mt-1 block overflow-x-auto whitespace-pre font-mono text-xs">
              {issue.detail}
            </code>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function RemotionStudioTab({
  timeline,
  scenesCount,
  draftTitle,
  canUploadToDrive = false,
  initialCode = null,
}: RemotionStudioTabProps) {
  const t = useTranslations("RemotionStudio");

  const [aspectRatio, setAspectRatio] = useState<RemotionAspectRatio>("16:9");
  const [fps, setFps] = useState<RemotionFps>(30);
  const [theme, setTheme] = useState<RemotionTheme>("modern");
  const [componentName, setComponentName] = useState<string>(() => componentNameFromTitle(draftTitle));
  const [additionalInstructions, setAdditionalInstructions] = useState<string>("");
  const [subTab, setSubTab] = useState<SubTab>(() => (initialCode ? "validator" : "prompt"));
  const [pastedCode, setPastedCode] = useState<string>(() => initialCode || "");
  const [validation, setValidation] = useState<RemotionValidationResult | null>(() =>
    initialCode ? validateRemotionCode(initialCode) : null
  );
  const [status, setStatus] = useState<string | null>(null);
  const statusTimer = useRef<number | null>(null);

  const prevInitialCodeRef = useRef<string | null>(initialCode || null);
  useEffect(() => {
    if (initialCode && initialCode !== prevInitialCodeRef.current) {
      prevInitialCodeRef.current = initialCode;
      queueMicrotask(() => {
        setPastedCode(initialCode);
        setSubTab("validator");
        setValidation(validateRemotionCode(initialCode));
      });
    }
  }, [initialCode]);

  // In-Browser Player & Rendering States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewFrame, setPreviewFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playAnimationRef = useRef<number | null>(null);
  const lastPlayTimeRef = useRef<number>(0);

  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<RemotionRenderProgress | null>(null);
  const [renderedResult, setRenderedResult] = useState<RemotionRenderResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ZIP Export & Google Drive States
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState<boolean>(false);
  const [driveLink, setDriveLink] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (statusTimer.current !== null) window.clearTimeout(statusTimer.current);
      if (playAnimationRef.current !== null) cancelAnimationFrame(playAnimationRef.current);
      if (abortControllerRef.current !== null) abortControllerRef.current.abort();
    };
  }, []);

  const isEmpty = timeline === null || scenesCount === 0;

  const options = useMemo<RemotionPromptOptions>(
    () => ({
      aspectRatio,
      fps,
      componentName: sanitizeComponentName(componentName),
      theme,
      additionalInstructions: additionalInstructions.trim() ? additionalInstructions : undefined,
    }),
    [aspectRatio, fps, componentName, theme, additionalInstructions],
  );

  const plan = useMemo(
    () => (timeline === null || isEmpty ? null : computeRemotionPlan(timeline, fps)),
    [timeline, isEmpty, fps],
  );
  const prompt = useMemo(
    () => (timeline === null || isEmpty ? "" : buildRemotionPrompt(timeline, options)),
    [timeline, isEmpty, options],
  );
  const boilerplate = useMemo(
    () => (timeline === null || isEmpty ? "" : buildRemotionBoilerplate(timeline, options)),
    [timeline, isEmpty, options],
  );

  const showStatus = useCallback((message: string): void => {
    setStatus(message);
    if (statusTimer.current !== null) window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setStatus(null), 3000);
  }, []);

  const handleCopy = async (text: string): Promise<void> => {
    const ok = await copyText(text);
    showStatus(ok ? t("copied") : t("copyFailed"));
  };

  const handleDownload = (): void => {
    downloadTextFile(sanitizeComponentName(componentName) + ".tsx", boilerplate);
    showStatus(t("downloaded"));
  };

  const handleValidate = (): void => {
    setValidation(validateRemotionCode(pastedCode));
  };

  // Unduh paket ZIP proyek Remotion siap render lokal
  const handleExportZip = async (): Promise<void> => {
    if (!timeline || isExportingZip) return;
    setIsExportingZip(true);
    try {
      const zipBlob = await exportRemotionZip(timeline, options);
      downloadBlob(zipBlob, `${sanitizeComponentName(componentName)}-remotion-project.zip`);
      showStatus(t("zipSuccess"));
    } catch (err) {
      console.error("Gagal mengekspor paket ZIP:", err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Unggah video hasil render ke Google Drive
  const handleUploadToDrive = async (): Promise<void> => {
    if (!renderedResult || isUploadingDrive) return;
    if (!canUploadToDrive) {
      showStatus(t("driveFeatureLocked"));
      return;
    }

    setIsUploadingDrive(true);
    setDriveLink(null);

    try {
      const file = new File([renderedResult.blob], renderedResult.filename, {
        type: renderedResult.mimeType,
      });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", renderedResult.filename);
      if (timeline?.draftId) {
        formData.append("draftId", timeline.draftId);
      }

      const res = await fetch("/api/user/google-drive/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("uploadDriveFailed"));
      }
      setDriveLink(data.webViewLink || null);
      showStatus(t("uploadDriveSuccess"));
    } catch (err) {
      console.error("Gagal mengunggah video ke Drive:", err);
      showStatus(err instanceof Error ? err.message : t("uploadDriveFailed"));
    } finally {
      setIsUploadingDrive(false);
    }
  };

  // Gambar frame preview ke canvas
  const drawCurrentPreview = useCallback(
    (frameToDraw: number) => {
      if (!plan || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderRemotionFrame(ctx, plan, options, frameToDraw);
    },
    [plan, options],
  );

  useEffect(() => {
    drawCurrentPreview(previewFrame);
  }, [drawCurrentPreview, previewFrame]);

  // Animasi playback loop
  useEffect(() => {
    if (!isPlaying || !plan) {
      if (playAnimationRef.current !== null) cancelAnimationFrame(playAnimationRef.current);
      return;
    }

    const frameDurationMs = 1000 / fps;
    lastPlayTimeRef.current = performance.now();

    const loop = (now: number) => {
      const delta = now - lastPlayTimeRef.current;
      if (delta >= frameDurationMs) {
        setPreviewFrame((prev) => {
          if (prev >= plan.totalFrames - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
        lastPlayTimeRef.current = now;
      }
      playAnimationRef.current = requestAnimationFrame(loop);
    };

    playAnimationRef.current = requestAnimationFrame(loop);

    return () => {
      if (playAnimationRef.current !== null) cancelAnimationFrame(playAnimationRef.current);
    };
  }, [isPlaying, fps, plan]);

  // Handle Play / Pause
  const handleTogglePlay = () => {
    if (!plan) return;
    if (previewFrame >= plan.totalFrames - 1) {
      setPreviewFrame(0);
    }
    setIsPlaying((prev) => !prev);
  };

  // Handle Render Video di Komputer User (100% Client-Side)
  const handleRenderVideo = async () => {
    if (!timeline || !plan) return;

    setIsPlaying(false);
    setIsRendering(true);
    setRenderProgress({ currentFrame: 0, totalFrames: plan.totalFrames, percent: 0 });
    setRenderedResult(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await assembleRemotionVideo(
        timeline,
        options,
        (progress) => {
          setRenderProgress(progress);
          setPreviewFrame(progress.currentFrame - 1);
        },
        controller.signal,
      );

      setRenderedResult(result);
      downloadBlob(result.blob, result.filename);
      showStatus(t("renderSuccess"));
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("In-browser render error:", err);
        showStatus(t("renderError"));
      }
    } finally {
      setIsRendering(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelRender = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsRendering(false);
      setRenderProgress(null);
    }
  };

  if (isEmpty || plan === null) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center">
        <p className="text-3xl" aria-hidden="true">⚛️</p>
        <h3 className="pg-text-heading mt-2 text-lg font-semibold">{t("emptyTitle")}</h3>
        <p className="pg-text-muted mt-1 text-sm">{t("emptyDescription")}</p>
      </div>
    );
  }

  const { width, height } = getRemotionDimensions(aspectRatio);
  const seconds = (plan.totalFrames / fps).toFixed(1);
  const nameInvalid = componentName.trim() !== "" && !isValidComponentName(componentName.trim());

  return (
    <div className="space-y-5">
      <header>
        <h2 className="pg-text-heading text-xl font-semibold">⚛️ {t("title")}</h2>
        <p className="pg-text-muted text-sm">{t("description")}</p>
      </header>

      {/* Summary bar */}
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: t("summaryScenes"), value: String(scenesCount) },
          { label: t("summaryDuration"), value: t("durationValue", { seconds }) },
          { label: t("summaryFrames"), value: String(plan.totalFrames) },
          { label: t("summaryDimensions"), value: width + "×" + height },
        ].map((item) => (
          <div key={item.label} className="glass-panel rounded-lg p-3">
            <dt className="pg-text-muted text-xs">{item.label}</dt>
            <dd className="pg-text-heading text-lg font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>

      {/* Toolbar Parameters */}
      <div className="glass-panel space-y-3 rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="pg-text-muted mb-1 text-xs">{t("settingsAspect")}</p>
            <div className="flex gap-2">
              {ASPECTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={aspectRatio === a}
                  className={pill(aspectRatio === a)}
                  onClick={() => setAspectRatio(a)}
                >
                  {t(ASPECT_LABEL_KEYS[a])}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="remotion-fps" className="pg-text-muted mb-1 block text-xs">{t("settingsFps")}</label>
            <select
              id="remotion-fps"
              className="pg-border rounded-lg border bg-transparent px-3 py-1.5 text-sm"
              value={String(fps)}
              onChange={(e) => setFps(e.target.value === "60" ? 60 : 30)}
            >
              <option value="30">{t("fps30")}</option>
              <option value="60">{t("fps60")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="remotion-theme" className="pg-text-muted mb-1 block text-xs">{t("settingsTheme")}</label>
            <select
              id="remotion-theme"
              className="pg-border rounded-lg border bg-transparent px-3 py-1.5 text-sm"
              value={theme}
              onChange={(e) => { const v = e.target.value; if (isRemotionTheme(v)) setTheme(v); }}
            >
              {REMOTION_THEMES.map((th) => (
                <option key={th} value={th}>{t(THEME_LABEL_KEYS[th])}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label htmlFor="remotion-name" className="pg-text-muted mb-1 block text-xs">{t("settingsComponentName")}</label>
            <input
              id="remotion-name"
              type="text"
              className="pg-border w-full rounded-lg border bg-transparent px-3 py-1.5 font-mono text-sm"
              value={componentName}
              maxLength={60}
              aria-invalid={nameInvalid}
              onChange={(e) => setComponentName(e.target.value)}
            />
            {nameInvalid ? <p className="mt-1 text-xs text-red-400" role="alert">{t("componentNameInvalid")}</p> : null}
          </div>
        </div>
        <div>
          <label htmlFor="remotion-extra" className="pg-text-muted mb-1 block text-xs">{t("additionalInstructionsLabel")}</label>
          <textarea
            id="remotion-extra"
            rows={2}
            className="pg-border w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
            placeholder={t("additionalInstructionsPlaceholder")}
            maxLength={MAX_ADDITIONAL_INSTRUCTIONS_LENGTH}
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
          />
          <p className="pg-text-muted mt-1 text-right text-xs">
            {t("additionalInstructionsCounter", { count: additionalInstructions.length, max: MAX_ADDITIONAL_INSTRUCTIONS_LENGTH })}
          </p>
        </div>
      </div>

      {/* ── INTERACTIVE IN-BROWSER PLAYER & RENDER STAGE ── */}
      <div className="glass-panel space-y-4 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pg-border pb-3">
          <h3 className="pg-text-heading text-sm font-semibold flex items-center gap-2">
            <span>🎬</span> {t("playerTitle")}
          </h3>
          <div className="flex items-center gap-2 text-xs pg-text-muted font-mono">
            <span>{t("frameLabel", { current: previewFrame + 1, total: plan.totalFrames })}</span>
            <span>({(previewFrame / fps).toFixed(1)}s / {seconds}s)</span>
          </div>
        </div>

        {/* Video Screen / Canvas Viewport */}
        <div className="flex justify-center bg-black/40 rounded-lg p-2 overflow-hidden border pg-border">
          <div
            className={`relative max-h-[380px] w-full flex justify-center items-center ${
              aspectRatio === "9:16" ? "aspect-[9/16] max-w-[220px]" : "aspect-[16/9] max-w-[640px]"
            }`}
          >
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="w-full h-full object-contain rounded shadow-lg"
            />
          </div>
        </div>

        {/* Scrubber & Player Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={plan.totalFrames - 1}
              value={previewFrame}
              disabled={isRendering}
              aria-label={t("playerTitle")}
              onChange={(e) => {
                setIsPlaying(false);
                setPreviewFrame(Number(e.target.value));
              }}
              className="w-full cursor-pointer accent-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                disabled={isRendering}
                className={pill(isPlaying)}
              >
                {isPlaying ? `⏸️ ${t("pause")}` : `▶️ ${t("play")}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setPreviewFrame(0);
                }}
                disabled={isRendering}
                className={pill(false)}
              >
                🔄 {t("restart")}
              </button>
            </div>

            {/* In-Browser Render Trigger */}
            <div className="flex items-center gap-2">
              {!isRendering ? (
                <button
                  type="button"
                  onClick={handleRenderVideo}
                  className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-medium px-4 py-2 text-sm shadow-md transition-all flex items-center gap-2"
                >
                  {t("renderButton")}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelRender}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 px-3 py-1.5 text-xs transition-colors"
                  >
                    ❌ {t("cancelRender")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Render Progress Monitor */}
          {isRendering && renderProgress && (
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 space-y-2">
              <div className="flex justify-between text-xs pg-text-heading">
                <span>
                  {t("rendering", {
                    percent: renderProgress.percent,
                    current: renderProgress.currentFrame,
                    total: renderProgress.totalFrames,
                  })}
                </span>
                <span>{renderProgress.percent}%</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${renderProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Render Result Success Notice & Action Buttons */}
          {renderedResult && !isRendering && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-emerald-300 font-medium flex items-center gap-2">
                <span>✅</span> {t("renderSuccess")}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadBlob(renderedResult.blob, renderedResult.filename)}
                  className={pill(true)}
                >
                  {t("downloadAgain")}
                </button>
                {canUploadToDrive && (
                  <button
                    type="button"
                    disabled={isUploadingDrive}
                    onClick={handleUploadToDrive}
                    className={pill(false)}
                  >
                    ☁️ {isUploadingDrive ? t("uploadingToDrive") : t("uploadToDrive")}
                  </button>
                )}
                {driveLink && (
                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-medium px-2 py-1"
                  >
                    <span>↗️</span> {t("openInDrive")}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs Selection */}
      <div role="tablist" aria-label={t("subTabsLabel")} className="flex flex-wrap gap-2">
        {SUB_TABS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            id={"remotion-tab-" + s}
            aria-selected={subTab === s}
            aria-controls={"remotion-panel-" + s}
            className={pill(subTab === s)}
            onClick={() => setSubTab(s)}
          >
            {t(SUB_TAB_LABEL_KEYS[s])}
          </button>
        ))}
      </div>

      {status !== null ? <p role="status" className="pg-text-heading text-sm">{status}</p> : null}

      {/* Sub-Tab 1: Master Prompt AI */}
      {subTab === "prompt" ? (
        <div role="tabpanel" id="remotion-panel-prompt" aria-labelledby="remotion-tab-prompt" className="glass-panel space-y-3 rounded-xl p-4">
          <p className="pg-text-muted text-sm" role="status">✅ {t("promptReady")}</p>
          <p className="pg-text-muted text-xs">{t("promptHint")}</p>
          <textarea
            readOnly
            aria-label={t("promptAriaLabel")}
            className="pg-border h-80 w-full rounded-lg border bg-transparent p-3 font-mono text-xs"
            value={prompt}
          />
          <button type="button" className={pill(true)} onClick={() => void handleCopy(prompt)}>
            {t("copyPrompt")}
          </button>
        </div>
      ) : null}

      {/* Sub-Tab 2: Boilerplate TSX */}
      {subTab === "boilerplate" ? (
        <div role="tabpanel" id="remotion-panel-boilerplate" aria-labelledby="remotion-tab-boilerplate" className="glass-panel space-y-3 rounded-xl p-4">
          <p className="pg-text-muted text-xs">{t("boilerplateHint")}</p>
          <pre className="pg-border max-h-96 overflow-auto rounded-lg border p-3 text-xs" aria-label={t("boilerplateAriaLabel")}>
            <code className="font-mono">{boilerplate}</code>
          </pre>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={pill(true)} onClick={() => void handleCopy(boilerplate)}>
              {t("copyCode")}
            </button>
            <button type="button" className={pill(false)} onClick={handleDownload}>
              {t("downloadTsx")}
            </button>
            <button
              type="button"
              className={pill(false)}
              disabled={isExportingZip}
              onClick={handleExportZip}
            >
              {isExportingZip ? t("exportingZip") : t("exportZipButton")}
            </button>
          </div>
        </div>
      ) : null}

      {/* Sub-Tab 3: Validator Kode */}
      {subTab === "validator" ? (
        <div role="tabpanel" id="remotion-panel-validator" aria-labelledby="remotion-tab-validator" className="glass-panel space-y-3 rounded-xl p-4">
          <textarea
            aria-label={t("validatorInputLabel")}
            className="pg-border h-64 w-full rounded-lg border bg-transparent p-3 font-mono text-xs"
            placeholder={t("validatorPlaceholder")}
            value={pastedCode}
            onChange={(e) => {
              setPastedCode(e.target.value);
              setValidation(null);
            }}
          />
          <button
            type="button"
            className={pill(true)}
            disabled={pastedCode.trim().length === 0}
            onClick={handleValidate}
          >
            {t("validatorCheck")}
          </button>
          {validation !== null ? (
            <div role="status" className="space-y-3">
              {validation.valid ? (
                <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  ✅ {t("validatorValid")}
                </p>
              ) : (
                <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  ❌ {t("validatorInvalid", { count: validation.errors.length })}
                </p>
              )}
              {validation.errors.length > 0 ? (
                <section>
                  <h4 className="pg-text-heading text-sm font-semibold">{t("validatorErrorsTitle")}</h4>
                  <IssueList issues={validation.errors} />
                </section>
              ) : null}
              {validation.warnings.length > 0 ? (
                <section>
                  <h4 className="pg-text-heading text-sm font-semibold">{t("validatorWarningsTitle")}</h4>
                  <IssueList issues={validation.warnings} />
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
