"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  LiveRemotionSandbox,
  LiveRemotionSandboxHandle,
} from "./LiveRemotionSandbox";
import { useDriveUpload } from "@/hooks/useDriveUpload";

const SAMPLE_SNAKE_CODE = `import React from 'react';
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// Resolusi: 1080x1920 (9:16), FPS: 30, total 300 frame (10 detik)
const W = 1080;
const H = 1920;
const C = {
  bg1: '#0b1220', bg2: '#1e293b', accent: '#38bdf8', text: '#f8fafc',
  ok: '#4ade80', warn: '#fbbf24', bad: '#f87171'
};
const FONT = 'Inter, -apple-system, sans-serif';

type Pt = [number, number];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

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
  const p = (frame % 150) / 150;

  // Spring animation title
  const spr = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: \`linear-gradient(160deg, \${C.bg1}, \${C.bg2})\` }}>
      {/* Title Scene */}
      <Sequence from={0} durationInFrames={150}>
        <div style={{
          position: 'absolute', top: 220, left: 60, right: 60, textAlign: 'center', fontFamily: FONT,
          fontWeight: 900, fontSize: 88, lineHeight: 1.1, color: C.text,
          transform: \`scale(\${interpolate(spr, [0, 1], [0.8, 1])})\`,
          opacity: Math.min(1, spr * 1.5)
        }}>
          NO WINGS. <span style={{ color: C.accent }}>IT FLIES.</span>
        </div>
        <svg width={W} height={H} style={{ position: 'absolute' }}>
          <Snake pt={(t) => [-100 + 1300 * p - t * 500, 960 + 70 * Math.sin(t * 7.5 - frame * 0.25)]} flat={1} />
        </svg>
      </Sequence>

      {/* Anatomy Scene */}
      <Sequence from={150} durationInFrames={150}>
        <div style={{
          position: 'absolute', top: 220, left: 60, right: 60, textAlign: 'center', fontFamily: FONT,
          fontWeight: 900, fontSize: 80, color: C.accent
        }}>
          BODY FLATTENS TO WING
        </div>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ transform: 'scale(1.4)' }}>
            <CrossSection f={interpolate(frame - 150, [0, 80], [0, 1], { extrapolateRight: 'clamp' })} />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

export default MainVideo;
`;

export default function RemotionStudioStandaloneClient() {
  const t = useTranslations("StandaloneRemotion");

  const [inputCode, setInputCode] = useState<string>("");
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compiledJs, setCompiledJs] = useState<string | null>(null);

  // Video Config States
  const [fps, setFps] = useState<number>(30);
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1920);
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
  const { isUploading, uploadToDrive } = useDriveUpload();

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
          const next = prev + 1;
          if (next >= totalFrames) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }
      playRafRef.current = requestAnimationFrame(loop);
    };

    playRafRef.current = requestAnimationFrame(loop);
    return () => {
      if (playRafRef.current !== null) cancelAnimationFrame(playRafRef.current);
    };
  }, [isPlaying, fps, totalFrames]);

  // Transpile Code
  const handleCompile = async (codeToCompile?: string) => {
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
      setFps(data.fps || 30);
      setWidth(data.width || 1080);
      setHeight(data.height || 1920);
      setTotalFrames(data.totalFrames || 300);

      toast.success("Kode berhasil dimuat! Animasi visual siap diputar.");
    } catch (err) {
      console.error(err);
      toast.error(t("compileError", { error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setIsCompiling(false);
    }
  };

  // Load demo sample
  const handleLoadSample = () => {
    setInputCode(SAMPLE_SNAKE_CODE);
    handleCompile(SAMPLE_SNAKE_CODE);
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
    a.download = "MainVideo.tsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast.success(t("downloaded"));
  };

  // In-Browser MP4/WebM Sequential Frame Render
  const handleRenderMp4 = async () => {
    if (!compiledJs || !sandboxRef.current || isRendering) return;

    setIsPlaying(false);
    setIsRendering(true);
    setRenderProgress(0);
    cancelRenderRef.current = false;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Gagal membuat context canvas");

      // Siapkan MediaRecorder
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

      const filename = `remotion-render-${Date.now()}.${mimeType.includes("mp4") ? "mp4" : "webm"}`;
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
    if (ok) toast.success("Berhasil diunggah ke Google Drive!");
    else toast.error("Gagal mengunggah ke Google Drive");
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
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold pg-text-heading flex items-center gap-1.5"
          >
            {t("sampleButton")}
          </button>
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
                onClick={() => handleCompile()}
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
              <div className="space-y-3 pt-2">
                {/* Timeline scrubber slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={totalFrames - 1}
                    value={currentFrame}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setCurrentFrame(parseInt(e.target.value, 10));
                    }}
                    className="w-full accent-[var(--pg-brand)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono pg-text-muted">
                    <span>00:00 (0)</span>
                    <span>
                      {currentTimeSec}s / {durationSec}s
                    </span>
                    <span>{durationSec}s ({totalFrames})</span>
                  </div>
                </div>

                {/* Transport Buttons & Render Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={isRendering}
                      className="neu-btn px-4 py-2 rounded-xl text-xs font-bold pg-text-heading flex items-center gap-1.5"
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
                      disabled={isRendering}
                      className="neu-btn px-3 py-2 rounded-xl text-xs font-medium pg-text-heading flex items-center gap-1"
                    >
                      <span>⏮️</span>
                      <span>{t("restart")}</span>
                    </button>
                  </div>

                  {/* Render MP4 Trigger */}
                  <button
                    type="button"
                    onClick={handleRenderMp4}
                    disabled={isRendering}
                    className="neu-btn-brand px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-sm"
                  >
                    <span>{isRendering ? "⏳" : "🎬"}</span>
                    <span>{isRendering ? `${t("rendering", { percent: renderProgress, current: renderStatusText, total: totalFrames })}` : t("renderMp4")}</span>
                  </button>
                </div>

                {/* Render Progress & Results */}
                {isRendering && (
                  <div className="space-y-2 p-3 rounded-xl bg-[var(--pg-brand)]/10 border border-[var(--pg-brand)]/30">
                    <div className="flex justify-between text-xs font-semibold text-[var(--pg-brand)]">
                      <span>Proses Rendering MP4...</span>
                      <span>{renderProgress}% ({renderStatusText})</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[var(--pg-brand)] h-2 rounded-full transition-all duration-100"
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success Download Bar */}
                {renderedBlob && !isRendering && (
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
                        className="neu-btn px-3 py-1.5 rounded-lg text-xs font-medium pg-text-heading"
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
