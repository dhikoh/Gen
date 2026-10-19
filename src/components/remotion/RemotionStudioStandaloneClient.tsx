"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  LiveRemotionSandbox,
  LiveRemotionSandboxHandle,
} from "./LiveRemotionSandbox";
import { useDriveUpload } from "@/hooks/useDriveUpload";

export type RemotionAspectRatio = "9:16" | "16:9" | "1:1";

export function getSampleSnakeCode(
  ar: RemotionAspectRatio,
  fpsVal: number,
  durationSecVal: number
): string {
  const isLandscape = ar === "16:9";
  const isSquare = ar === "1:1";
  const w = isLandscape ? 1920 : 1080;
  const h = isLandscape ? 1080 : isSquare ? 1080 : 1920;
  const totalF = Math.round(durationSecVal * fpsVal);
  const halfF = Math.max(30, Math.round(totalF / 2));

  return `import React from 'react';
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// Resolusi: ${w}x${h} (${ar}), FPS: ${fpsVal}, total ${totalF} frame (${durationSecVal} detik)
const W = ${w};
const H = ${h};
const C = {
  bg1: '#0b1220', bg2: '#1e293b', accent: '#38bdf8', text: '#f8fafc',
  ok: '#4ade80', warn: '#fbbf24', bad: '#f87171'
};
const FONT = 'Inter, -apple-system, sans-serif';

type Pt = [number, number];

const Snake: React.FC<{ pt: (t: number) => Pt; flat: number }> = ({ pt, flat }) => {
  const n = 36;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const t = i / (n - 1);
        const [x, y] = pt(t);
        const r = 26 * (1 - 0.55 * t) + (t < 0.06 ? 6 : 0);
        return (
          <React.Fragment key={i}>
            <ellipse cx={x} cy={y} rx={r * (1 + 0.9 * flat)} ry={r * (1 - 0.55 * flat)}
              fill={C.ok} stroke="#052e16" strokeWidth={2} />
            {i % 4 === 0 && <circle cx={x} cy={y} r={r * 0.22} fill="#fde047" />}
          </React.Fragment>
        );
      })}
    </g>
  );
};

const CrossSection: React.FC<{ f: number }> = ({ f }) => {
  const cx = 300; const cy = 170;
  const rx = 110 + 170 * f;
  const ry = 110 - 65 * f;
  const d = \`M \${cx - rx} \${cy} Q \${cx} \${cy - 2 * ry} \${cx + rx} \${cy} Q \${cx} \${cy + 2 * ry * (1 - 1.7 * f)} \${cx - rx} \${cy} Z\`;
  return (
    <svg width={600} height={340} viewBox="0 0 600 340">
      <path d={d} fill={C.ok} stroke={C.accent} strokeWidth={6} />
      <line x1={cx} y1={cy - 8} x2={cx - rx * 0.9} y2={cy + 8 + 22 * f} stroke={C.bg1} strokeWidth={6} strokeLinecap="round" />
      <line x1={cx} y1={cy - 8} x2={cx + rx * 0.9} y2={cy + 8 + 22 * f} stroke={C.bg1} strokeWidth={6} strokeLinecap="round" />
      <circle cx={cx} cy={cy - 8} r={10} fill="#fde047" />
    </svg>
  );
};

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = (frame % ${halfF}) / ${halfF};

  // Spring animation title
  const spr = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: \`linear-gradient(160deg, \${C.bg1}, \${C.bg2})\` }}>
      {/* Scene 1: Motion Gliding Snake */}
      <Sequence from={0} durationInFrames={${halfF}}>
        <div style={{
          position: 'absolute', top: ${isLandscape ? 80 : 220}, left: 60, right: 60, textAlign: 'center', fontFamily: FONT,
          fontWeight: 900, fontSize: ${isLandscape ? 68 : 88}, lineHeight: 1.1, color: C.text,
          transform: \`scale(\${interpolate(spr, [0, 1], [0.8, 1])})\`,
          opacity: Math.min(1, spr * 1.5)
        }}>
          NO WINGS. <span style={{ color: C.accent }}>IT FLIES.</span>
        </div>
        <svg width={W} height={H} style={{ position: 'absolute' }}>
          <Snake pt={(t) => [-100 + (W + 200) * p - t * 500, ${Math.round(h / 2)} + 70 * Math.sin(t * 7.5 - frame * 0.25)]} flat={1} />
        </svg>
      </Sequence>

      {/* Scene 2: Aerodynamic Wing Cross-Section */}
      <Sequence from={${halfF}} durationInFrames={${totalF - halfF}}>
        <div style={{
          position: 'absolute', top: ${isLandscape ? 80 : 220}, left: 60, right: 60, textAlign: 'center', fontFamily: FONT,
          fontWeight: 900, fontSize: ${isLandscape ? 60 : 80}, color: C.accent
        }}>
          BODY FLATTENS TO WING
        </div>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ transform: 'scale(1.4)' }}>
            <CrossSection f={interpolate(frame - ${halfF}, [0, Math.round(fps * 2.5)], [0, 1], { extrapolateRight: 'clamp' })} />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

export default MainVideo;
`;
}

export default function RemotionStudioStandaloneClient({
  initialCode = "",
}: {
  initialCode?: string;
} = {}) {
  const t = useTranslations("StandaloneRemotion");

  const [inputCode, setInputCode] = useState<string>(initialCode);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compiledJs, setCompiledJs] = useState<string | null>(null);

  // Video Config Setup States
  const [aspectRatio, setAspectRatio] = useState<RemotionAspectRatio>("9:16");
  const [fps, setFps] = useState<number>(30);
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1920);
  const [targetDurationSec, setTargetDurationSec] = useState<number>(10);
  const [totalFrames, setTotalFrames] = useState<number>(300);

  // Playback States
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playRafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // MP4 Render States
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStatusText, setRenderStatusText] = useState<string>("");
  const [renderedBlob, setRenderedBlob] = useState<{ blob: Blob; url: string; filename: string } | null>(null);
  const cancelRenderRef = useRef<boolean>(false);

  const sandboxRef = useRef<LiveRemotionSandboxHandle | null>(null);
  const { isUploading, uploadToDrive, uploadError } = useDriveUpload();

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (playRafRef.current !== null) cancelAnimationFrame(playRafRef.current);
      return;
    }

    lastTimeRef.current = performance.now();
    const frameIntervalMs = 1000 / fps;

    const loop = (now: number) => {
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= frameIntervalMs) {
        lastTimeRef.current = now - (elapsed % frameIntervalMs);
        setCurrentFrame((prev) => {
          if (prev >= totalFrames - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }
      playRafRef.current = requestAnimationFrame(loop);
    };

    playRafRef.current = requestAnimationFrame(loop);
    return () => {
      if (playRafRef.current !== null) cancelAnimationFrame(playRafRef.current);
    };
  }, [isPlaying, fps, totalFrames]);

  const handlePlayPause = () => {
    if (!compiledJs) {
      toast.error(t("noCode"));
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleCompile = useCallback(
    async (codeToCompile?: string) => {
      const code = codeToCompile || inputCode;
      if (!code.trim()) {
        toast.error(t("noCode"));
        return;
      }

      setIsCompiling(true);
      setIsPlaying(false);
      setCurrentFrame(0);

      try {
        const res = await fetch("/api/remotion/transpile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Gagal mengompilasi kode");
        }

        setCompiledJs(data.jsCode);
        const resolvedFps = data.fps || fps;
        const resolvedW = data.width || width;
        const resolvedH = data.height || height;
        const resolvedTotal = data.totalFrames || totalFrames;

        setFps(resolvedFps);
        setWidth(resolvedW);
        setHeight(resolvedH);
        setTotalFrames(resolvedTotal);
        setTargetDurationSec(Math.round(resolvedTotal / resolvedFps));

        if (resolvedW > resolvedH) {
          setAspectRatio("16:9");
        } else if (resolvedW === resolvedH) {
          setAspectRatio("1:1");
        } else {
          setAspectRatio("9:16");
        }

        toast.success("Kode berhasil dimuat! Animasi visual siap diputar.");
      } catch (err) {
        console.error(err);
        toast.error(t("compileError", { error: err instanceof Error ? err.message : String(err) }));
      } finally {
        setIsCompiling(false);
      }
    },
    [inputCode, fps, width, height, totalFrames, t]
  );

  // Auto-compile if initialCode is provided
  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      const timer = setTimeout(() => {
        void handleCompile(initialCode);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialCode, handleCompile]);

  // Setup Handlers
  const handleRatioChange = (newRatio: RemotionAspectRatio) => {
    setAspectRatio(newRatio);
    let newW = 1080;
    let newH = 1920;
    if (newRatio === "16:9") {
      newW = 1920;
      newH = 1080;
    } else if (newRatio === "1:1") {
      newW = 1080;
      newH = 1080;
    }
    setWidth(newW);
    setHeight(newH);

    // If input code has W = and H =, update them smoothly
    if (inputCode && /const W = \d+;\s*const H = \d+;/.test(inputCode)) {
      const updatedCode = inputCode
        .replace(/const W = \d+;/, `const W = ${newW};`)
        .replace(/const H = \d+;/, `const H = ${newH};`);
      setInputCode(updatedCode);
      void handleCompile(updatedCode);
    }
  };

  const handleFpsChange = (newFps: number) => {
    setFps(newFps);
    const newTotal = Math.round(targetDurationSec * newFps);
    setTotalFrames(newTotal);

    if (inputCode && /FPS: \d+/.test(inputCode)) {
      const updatedCode = inputCode
        .replace(/FPS: \d+/g, `FPS: ${newFps}`)
        .replace(/fps[:=]\s*\d+/g, `fps = ${newFps}`);
      setInputCode(updatedCode);
      void handleCompile(updatedCode);
    }
  };

  const handleDurationChange = (newSec: number) => {
    setTargetDurationSec(newSec);
    const newTotal = Math.round(newSec * fps);
    setTotalFrames(newTotal);

    if (inputCode && /total \d+ frame/.test(inputCode)) {
      const updatedCode = inputCode
        .replace(/total \d+ frame/g, `total ${newTotal} frame`)
        .replace(/\(\d+ detik\)/g, `(${newSec} detik)`);
      setInputCode(updatedCode);
      void handleCompile(updatedCode);
    }
  };

  // Load demo sample with current setup
  const handleLoadSample = () => {
    const sampleCode = getSampleSnakeCode(aspectRatio, fps, targetDurationSec);
    setInputCode(sampleCode);
    void handleCompile(sampleCode);
  };

  // Download .tsx file
  const handleDownloadTsx = () => {
    if (!inputCode.trim()) {
      toast.error(t("noCode"));
      return;
    }
    const blob = new Blob([inputCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `remotion-animation-${aspectRatio.replace(":", "-")}-${fps}fps-${Date.now()}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File .tsx berhasil diunduh");
  };

  // Render MP4
  const handleRenderMp4 = async () => {
    if (!sandboxRef.current || !compiledJs) {
      toast.error("Muat kode animasi terlebih dahulu sebelum render.");
      return;
    }

    setIsRendering(true);
    setIsPlaying(false);
    setRenderProgress(0);
    setRenderStatusText(t("renderingFrames", { current: 1, total: totalFrames }));
    cancelRenderRef.current = false;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Gagal menginisialisasi 2D Canvas");

      const stream = canvas.captureStream(fps);
      const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
        ? "video/mp4;codecs=avc1"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType }));
        };
      });

      recorder.start();

      // Render frame per frame
      for (let f = 0; f < totalFrames; f++) {
        if (cancelRenderRef.current) {
          recorder.stop();
          toast("Render dibatalkan", { icon: "🛑" });
          setIsRendering(false);
          return;
        }

        setCurrentFrame(f);
        const dataUrl = await sandboxRef.current.captureFrame(f);
        if (dataUrl) {
          const img = new Image();
          await new Promise<void>((r) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, width, height);
              r();
            };
            img.src = dataUrl;
          });
        }

        const percent = Math.round(((f + 1) / totalFrames) * 100);
        setRenderProgress(percent);
        setRenderStatusText(`${f + 1}/${totalFrames} frame`);
      }

      recorder.stop();
      const videoBlob = await recordPromise;

      const filename = `remotion-render-${aspectRatio.replace(":", "-")}-${Date.now()}.${mimeType.includes("mp4") ? "mp4" : "webm"}`;
      const downloadUrl = URL.createObjectURL(videoBlob);

      setRenderedBlob({ blob: videoBlob, url: downloadUrl, filename });

      // Auto trigger download
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success(t("renderSuccess"));
    } catch (err) {
      console.error("Render failed:", err);
      toast.error("Gagal merender video: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsRendering(false);
    }
  };

  const handleDriveUpload = async () => {
    if (!renderedBlob) return;
    const ok = await uploadToDrive(renderedBlob.blob, renderedBlob.filename);
    if (ok) {
      toast.success("Berhasil diunggah ke Google Drive!");
    } else {
      toast.error(
        uploadError ||
          "Gagal mengunggah ke Google Drive. Pastikan akun Google Drive sudah terhubung di menu Pengaturan."
      );
    }
  };

  const durationSec = (totalFrames / fps).toFixed(1);
  const currentTimeSec = (currentFrame / fps).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl pg-surface pg-border border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚛️</span>
            <h1 className="text-xl font-bold pg-text-heading">{t("title")}</h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[var(--pg-brand)]/15 text-[var(--pg-brand)]">
              Standalone Studio
            </span>
          </div>
          <p className="text-xs pg-text-muted mt-1">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleLoadSample}
            className="neu-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold pg-text-heading flex items-center gap-1.5"
          >
            <span>🐍</span>
            <span>{t("sampleButton")} ({aspectRatio})</span>
          </button>
        </div>
      </div>

      {/* ── Setup Toolbar (Rasio Layar, FPS, & Durasi) ── */}
      <div className="pg-surface pg-border border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pg-border pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <h3 className="text-sm font-bold pg-text-heading">{t("setupTitle")}</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              {width}×{height} • {fps} FPS • {durationSec}s ({totalFrames}f)
            </span>
          </div>
          <span className="text-[11px] pg-text-muted font-mono">
            {t("presetDimensions", { w: width, h: height })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* 1. Rasio Layar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold pg-text-heading flex items-center gap-1.5">
              <span>📐</span> {t("aspectRatio")}
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl neu-pressed">
              <button
                type="button"
                onClick={() => handleRatioChange("9:16")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  aspectRatio === "9:16"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "pg-text-sub hover:pg-text-heading"
                }`}
                title="9:16 Vertical (1080x1920)"
              >
                9:16
              </button>
              <button
                type="button"
                onClick={() => handleRatioChange("16:9")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  aspectRatio === "16:9"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "pg-text-sub hover:pg-text-heading"
                }`}
                title="16:9 Landscape (1920x1080)"
              >
                16:9
              </button>
              <button
                type="button"
                onClick={() => handleRatioChange("1:1")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  aspectRatio === "1:1"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "pg-text-sub hover:pg-text-heading"
                }`}
                title="1:1 Square (1080x1080)"
              >
                1:1
              </button>
            </div>
          </div>

          {/* 2. Frame Rate (FPS) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold pg-text-heading flex items-center gap-1.5">
              <span>⚡</span> {t("fpsLabel")}
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl neu-pressed">
              <button
                type="button"
                onClick={() => handleFpsChange(30)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  fps === 30
                    ? "bg-purple-600 text-white shadow-sm"
                    : "pg-text-sub hover:pg-text-heading"
                }`}
              >
                30 FPS
              </button>
              <button
                type="button"
                onClick={() => handleFpsChange(60)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  fps === 60
                    ? "bg-purple-600 text-white shadow-sm"
                    : "pg-text-sub hover:pg-text-heading"
                }`}
              >
                60 FPS
              </button>
            </div>
          </div>

          {/* 3. Durasi Video */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold pg-text-heading flex items-center gap-1.5">
              <span>⏱️</span> {t("durationLabel")}
            </label>
            <div className="flex items-center gap-1.5">
              {[5, 10, 15, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleDurationChange(sec)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                    targetDurationSec === sec
                      ? "bg-purple-600 text-white shadow-sm"
                      : "neu-btn pg-text-sub hover:pg-text-heading"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Code Input & Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="pg-surface pg-border border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold pg-text-heading flex items-center gap-2">
                <span>📝</span> {t("inputLabel")}
              </label>
              <span className="text-[11px] font-mono pg-text-muted">
                {width}×{height} ({fps} FPS)
              </span>
            </div>

            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder={t("inputPlaceholder")}
              rows={16}
              className="w-full px-3 py-2.5 rounded-xl neu-input pg-text-heading text-xs font-mono resize-y focus:outline-none"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleCompile()}
                disabled={isCompiling}
                className="neu-btn-brand px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-sm"
              >
                <span>{isCompiling ? "⏳" : "🚀"}</span>
                <span>{isCompiling ? t("loading") : t("loadButton")}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTsx}
                className="neu-btn px-3 py-2 rounded-xl text-xs font-medium pg-text-heading"
              >
                {t("downloadTsx")}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Player & MP4 Render (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="pg-surface pg-border border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold pg-text-heading flex items-center gap-2">
                <span>👁️</span> {t("playerTitle")}
              </h2>
              <span className="text-xs font-mono font-semibold pg-text-heading">
                {t("frameCounter", { current: currentFrame, total: totalFrames, time: currentTimeSec })}
              </span>
            </div>

            {/* Sandbox Container */}
            <div className="w-full flex justify-center bg-black/80 rounded-2xl p-3 border pg-border shadow-inner">
              {compiledJs ? (
                <LiveRemotionSandbox
                  ref={sandboxRef}
                  jsCode={compiledJs}
                  fps={fps}
                  width={width}
                  height={height}
                  totalFrames={totalFrames}
                  currentFrame={currentFrame}
                  onError={(err) => toast.error(err)}
                />
              ) : (
                <div className="h-80 w-full flex flex-col items-center justify-center text-center p-6 pg-text-muted space-y-3">
                  <span className="text-4xl">🎬</span>
                  <p className="text-xs max-w-sm">{t("emptyState")}</p>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="neu-btn-brand px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
                  >
                    {t("sampleButton")}
                  </button>
                </div>
              )}
            </div>

            {/* Player Transport Controls */}
            {compiledJs && (
              <div className="space-y-3">
                {/* Scrub Slider */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={totalFrames - 1}
                    value={currentFrame}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setCurrentFrame(Number(e.target.value));
                    }}
                    className="flex-1 h-2 rounded-lg cursor-pointer accent-purple-600 bg-slate-700"
                  />
                  <span className="text-xs font-mono pg-text-muted w-14 text-right">
                    {currentTimeSec}s
                  </span>
                </div>

                {/* Transport Buttons */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePlayPause}
                      className="neu-btn px-4 py-2 rounded-xl text-xs font-bold pg-text-heading flex items-center gap-2"
                    >
                      <span>{isPlaying ? "⏸️" : "▶️"}</span>
                      <span>{isPlaying ? t("pause") : t("play")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentFrame(0);
                      }}
                      className="neu-btn px-3 py-2 rounded-xl text-xs font-medium pg-text-heading"
                    >
                      ⏮️ {t("restart")}
                    </button>
                  </div>

                  {/* Render MP4 Trigger */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRenderMp4}
                      disabled={isRendering}
                      className="neu-btn-brand px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-sm"
                    >
                      <span>🎬</span>
                      <span>{isRendering ? "Rendering..." : t("renderMp4")}</span>
                    </button>

                    {isRendering && (
                      <button
                        type="button"
                        onClick={() => {
                          cancelRenderRef.current = true;
                        }}
                        className="neu-btn px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:text-red-600"
                      >
                        🛑 Batal
                      </button>
                    )}
                  </div>
                </div>

                {/* Render Progress Bar */}
                {isRendering && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <div className="flex justify-between text-xs font-medium pg-text-heading">
                      <span>{t("rendering", { percent: renderProgress, current: currentFrame + 1, total: totalFrames })}</span>
                      <span className="font-mono">{renderStatusText}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-75"
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Render Success Card */}
                {renderedBlob && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span>✅</span> {t("renderSuccess")} ({renderedBlob.filename})
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={renderedBlob.url}
                        download={renderedBlob.filename}
                        className="neu-btn px-3 py-1.5 rounded-lg text-xs font-bold pg-text-heading"
                      >
                        {t("downloadAgain")}
                      </a>
                      <button
                        type="button"
                        onClick={handleDriveUpload}
                        disabled={isUploading}
                        className="neu-btn px-3 py-1.5 rounded-lg text-xs font-medium pg-text-heading flex items-center gap-1.5"
                      >
                        ☁️ {isUploading ? "Mengunggah..." : "Simpan ke Drive"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
