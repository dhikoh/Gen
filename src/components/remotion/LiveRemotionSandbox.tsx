"use client";

import React, {
  useEffect,
  useRef,
  useMemo,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
} from "react";
import * as Remotion from "remotion";
import { Player, PlayerRef } from "@remotion/player";

export interface LiveRemotionSandboxProps {
  jsCode: string;
  fps?: number;
  width?: number;
  height?: number;
  totalFrames?: number;
  currentFrame: number;
  onError?: (err: string) => void;
  onReady?: () => void;
  showControls?: boolean;
}

export interface LiveRemotionSandboxHandle {
  captureFrame: (frameNumber: number) => Promise<string | null>;
  getPlayerRef: () => PlayerRef | null;
}

export const LiveRemotionSandbox = forwardRef<
  LiveRemotionSandboxHandle,
  LiveRemotionSandboxProps
>(
  (
    {
      jsCode,
      fps = 30,
      width = 1080,
      height = 1920,
      totalFrames = 300,
      currentFrame,
      onError,
      onReady,
      showControls = true,
    },
    ref
  ) => {
    const playerRef = useRef<PlayerRef | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [evalError, setEvalError] = useState<string | null>(null);

    // Evaluasi kode JavaScript hasil transpile menjadi komponen React menggunakan runtime Remotion asli
    const evalResult = useMemo(() => {
      if (!jsCode || !jsCode.trim()) {
        return { comp: null as React.ComponentType | null, error: null as string | null };
      }

      try {
        const win: { __RemotionComponent?: React.ComponentType } = {};
        const factory = new Function(
          "React",
          "remotion",
          "win",
          `
          const {
            AbsoluteFill,
            Sequence,
            interpolate,
            spring,
            useCurrentFrame,
            useVideoConfig,
            Audio,
            Img,
            Series,
            Loop,
            staticFile,
            random,
            Easing
          } = remotion;
          ${jsCode}
          return win.__RemotionComponent || (typeof MainVideo !== "undefined" ? MainVideo : null);
        `
        );

        const Comp = factory(React, Remotion, win);
        if (typeof Comp === "function") {
          return { comp: Comp as React.ComponentType, error: null };
        } else {
          return {
            comp: null,
            error: "Komponen utama (MainVideo / export default) tidak ditemukan di dalam kode.",
          };
        }
      } catch (err) {
        console.error("Gagal mengevaluasi komponen Remotion:", err);
        const msg = err instanceof Error ? err.message : String(err);
        return { comp: null, error: msg };
      }
    }, [jsCode]);

    useEffect(() => {
      if (evalResult.error) {
        setEvalError(evalResult.error);
        if (onError) onError(evalResult.error);
      } else {
        setEvalError(null);
        if (evalResult.comp && onReady) {
          onReady();
        }
      }
    }, [evalResult, onError, onReady]);

    // Sinkronkan frame aktif dari controller luar ke dalam Remotion Player
    useEffect(() => {
      if (playerRef.current) {
        const cur = playerRef.current.getCurrentFrame();
        if (cur !== currentFrame) {
          playerRef.current.seekTo(currentFrame);
        }
      }
    }, [currentFrame]);

    // Expose capture frame helper untuk perakitan MP4 client-side
    useImperativeHandle(
      ref,
      () => ({
        getPlayerRef: () => playerRef.current,
        captureFrame: async (frameNumber: number): Promise<string | null> => {
          if (playerRef.current) {
            playerRef.current.seekTo(frameNumber);
            // Berikan jeda render frame DOM
            await new Promise((r) => setTimeout(r, 20));
          }

          const container = containerRef.current;
          if (!container) return null;

          // Cek apakah di dalam player terdapat elemen canvas langsung
          const directCanvas = container.querySelector("canvas");
          if (directCanvas) {
            try {
              return directCanvas.toDataURL("image/png");
            } catch (e) {
              console.warn("Direct canvas toDataURL failed:", e);
            }
          }

          // Rasterize DOM player ke canvas via foreignObject SVG
          try {
            const htmlContent = container.innerHTML;
            const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
              <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;position:relative;background:#000;color:#fff;overflow:hidden;font-family:Inter,-apple-system,sans-serif;">
                  ${htmlContent}
                </div>
              </foreignObject>
            </svg>`;
            const blob = new Blob([fullSvg], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const img = new Image();

            const dataUrl = await new Promise<string>((resolve, reject) => {
              img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                  URL.revokeObjectURL(url);
                  reject(new Error("No canvas context"));
                  return;
                }
                ctx.fillStyle = "#000000";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL("image/png"));
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Image rasterize failed"));
              };
              img.src = url;
            });
            return dataUrl;
          } catch (err) {
            console.warn("Gagal merasterisasi frame Remotion:", err);
            return null;
          }
        },
      }),
      [width, height]
    );

    const isLandscape = width > height;
    const isSquare = width === height;

    if (evalError) {
      return (
        <div className="w-full p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-mono space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <span>⚠️</span> Evaluasi Komponen Remotion Gagal
          </div>
          <div className="whitespace-pre-wrap">{evalError}</div>
        </div>
      );
    }

    if (!evalResult.comp) {
      return null;
    }

    const VideoComponent = evalResult.comp;
    const safeTotalFrames = Math.max(1, totalFrames);

    return (
      <div
        className="remotion-official-player-wrapper flex flex-col items-center justify-center w-full"
        style={{
          maxWidth: isLandscape ? "100%" : isSquare ? "480px" : "380px",
          margin: "0 auto",
        }}
      >
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-black shadow-2xl w-full"
          style={{
            aspectRatio: `${width} / ${height}`,
            maxHeight: "68vh",
          }}
        >
          <Player
            ref={playerRef}
            component={VideoComponent}
            durationInFrames={safeTotalFrames}
            compositionWidth={width}
            compositionHeight={height}
            fps={fps}
            style={{
              width: "100%",
              height: "100%",
            }}
            controls={showControls}
            autoPlay={false}
            loop
          />
        </div>
      </div>
    );
  }
);

LiveRemotionSandbox.displayName = "LiveRemotionSandbox";
export default LiveRemotionSandbox;
