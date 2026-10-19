"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import ReactDOM from "react-dom/client";

export interface LiveRemotionSandboxProps {
  jsCode: string;
  fps?: number;
  width?: number;
  height?: number;
  totalFrames?: number;
  currentFrame: number;
  onError?: (err: string) => void;
  onReady?: () => void;
}

export interface LiveRemotionSandboxHandle {
  captureFrame: (frameNumber: number) => Promise<string | null>;
}

// Remotion Context
interface RemotionContextValue {
  frame: number;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
}

const RemotionContext = React.createContext<RemotionContextValue>({
  frame: 0,
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 900,
});

// Helper mathematical functions
function remotionInterpolate(
  input: number,
  inRange: readonly number[],
  outRange: readonly number[],
  options: { extrapolateLeft?: "clamp" | "extend"; extrapolateRight?: "clamp" | "extend" } = {}
): number {
  const { extrapolateLeft = "clamp", extrapolateRight = "clamp" } = options;
  if (input <= inRange[0]) {
    return extrapolateLeft === "clamp" ? outRange[0] : outRange[0];
  }
  const lastIdx = inRange.length - 1;
  if (input >= inRange[lastIdx]) {
    return extrapolateRight === "clamp" ? outRange[lastIdx] : outRange[lastIdx];
  }
  for (let i = 0; i < lastIdx; i++) {
    if (input >= inRange[i] && input <= inRange[i + 1]) {
      const t = (input - inRange[i]) / (inRange[i + 1] - inRange[i]);
      return outRange[i] + t * (outRange[i + 1] - outRange[i]);
    }
  }
  return outRange[0];
}

function remotionSpring({
  frame = 0,
  fps = 30,
  config = {},
}: {
  frame?: number;
  fps?: number;
  config?: { damping?: number; mass?: number; stiffness?: number };
}): number {
  const damping = config.damping ?? 10;
  const mass = config.mass ?? 1;
  const stiffness = config.stiffness ?? 100;
  if (frame <= 0) return 0;
  const t = frame / fps;
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega0 * t) * (Math.cos(omegaD * t) + ((zeta * omega0) / omegaD) * Math.sin(omegaD * t));
  }
  return Math.min(1, 1 - Math.exp(-zeta * omega0 * t) * (1 + omega0 * t));
}

// Remotion Component Shims
const AbsoluteFill: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, children, ...props }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

const Sequence: React.FC<{
  from?: number;
  durationInFrames?: number;
  layout?: "absolute-fill" | "none";
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ from = 0, durationInFrames, layout = "absolute-fill", style, children, ...props }) => {
  const { frame } = React.useContext(RemotionContext);
  if (frame < from) return null;
  if (durationInFrames !== undefined && frame >= from + durationInFrames) return null;
  const localFrame = frame - from;
  const parentCtx = React.useContext(RemotionContext);
  const childCtx = { ...parentCtx, frame: localFrame };
  const content = <RemotionContext.Provider value={childCtx}>{children}</RemotionContext.Provider>;
  if (layout === "none") return content;
  return (
    <AbsoluteFill style={style} {...props}>
      {content}
    </AbsoluteFill>
  );
};

const useCurrentFrame = () => React.useContext(RemotionContext).frame;
const useVideoConfig = () => React.useContext(RemotionContext);

export const LiveRemotionSandbox = forwardRef<LiveRemotionSandboxHandle, LiveRemotionSandboxProps>(
  (
    {
      jsCode,
      fps = 30,
      width = 1080,
      height = 1920,
      totalFrames = 900,
      currentFrame,
      onError,
      onReady,
    },
    ref
  ) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const reactRootRef = useRef<ReactDOM.Root | null>(null);
    const [evalComponent, setEvalComponent] = useState<React.ComponentType | null>(null);

    // Evaluasi kode JavaScript hasil transpile menjadi komponen React
    useEffect(() => {
      if (!jsCode || !jsCode.trim()) {
        setEvalComponent(null);
        return;
      }

      try {
        const remotionShim = {
          AbsoluteFill,
          Sequence,
          interpolate: remotionInterpolate,
          spring: remotionSpring,
          useCurrentFrame,
          useVideoConfig,
        };

        const win: { __RemotionComponent?: React.ComponentType } = {};
        const factory = new Function(
          "React",
          "remotion",
          "win",
          `
          const { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } = remotion;
          ${jsCode}
          return win.__RemotionComponent || (typeof MainVideo !== "undefined" ? MainVideo : null);
        `
        );

        const Comp = factory(React, remotionShim, win);
        if (typeof Comp === "function") {
          setEvalComponent(() => Comp);
          onReady?.();
        } else {
          throw new Error("Komponen utama (MainVideo / export default) tidak ditemukan di dalam kode.");
        }
      } catch (err) {
        console.error("Gagal mengevaluasi komponen Remotion:", err);
        const msg = err instanceof Error ? err.message : String(err);
        onError?.(msg);
        setEvalComponent(null);
      }
    }, [jsCode, onError, onReady]);

    // Inisialisasi iframe document
    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      if (!doc.getElementById("remotion-root")) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html, body, #remotion-root {
                  width: 100%;
                  height: 100%;
                  overflow: hidden;
                  background: #000;
                  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
              </style>
            </head>
            <body>
              <div id="remotion-root"></div>
            </body>
          </html>
        `);
        doc.close();
      }

      const container = doc.getElementById("remotion-root");
      if (container && !reactRootRef.current) {
        reactRootRef.current = ReactDOM.createRoot(container);
      }
    }, []);

    // Render frame aktif ke dalam iframe
    const renderFrame = useCallback(
      (frameNum: number) => {
        if (!reactRootRef.current || !evalComponent) return;

        const Comp = evalComponent;
        const contextVal: RemotionContextValue = {
          frame: frameNum,
          fps,
          width,
          height,
          durationInFrames: totalFrames,
        };

        reactRootRef.current.render(
          <RemotionContext.Provider value={contextVal}>
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <Comp />
            </div>
          </RemotionContext.Provider>
        );
      },
      [evalComponent, fps, width, height, totalFrames]
    );

    useEffect(() => {
      renderFrame(currentFrame);
    }, [renderFrame, currentFrame]);

    // Expose capture frame helper untuk perakitan MP4
    useImperativeHandle(
      ref,
      () => ({
        captureFrame: async (frameNumber: number): Promise<string | null> => {
          renderFrame(frameNumber);

          // Tunggu tick render DOM
          await new Promise((r) => setTimeout(r, 16));

          const iframe = iframeRef.current;
          if (!iframe || !iframe.contentDocument) return null;

          const doc = iframe.contentDocument;
          const rootEl = doc.getElementById("remotion-root");
          if (!rootEl) return null;

          // Rasterize entire DOM tree (HTML text + SVG) using foreignObject SVG
          try {
            const htmlContent = rootEl.innerHTML;
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
                reject(new Error("foreignObject rasterize failed"));
              };
              img.src = url;
            });

            return dataUrl;
          } catch {
            // Fallback: Cari elemen SVG langsung jika foreignObject dibatasi
            const svgEl = rootEl.querySelector("svg");
            if (svgEl) {
              try {
                const svgString = new XMLSerializer().serializeToString(svgEl);
                const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(svgBlob);
                const img = new Image();

                return await new Promise<string | null>((resolve) => {
                  img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                      URL.revokeObjectURL(url);
                      resolve(null);
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
                    resolve(null);
                  };
                  img.src = url;
                });
              } catch (err) {
                console.warn("SVG rasterize failed", err);
              }
            }
          }

          return null;
        },
      }),
      [renderFrame, width, height]
    );

    const isVertical = height > width;

    return (
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-black"
        style={{
          aspectRatio: `${width} / ${height}`,
          maxHeight: isVertical ? "650px" : "480px",
        }}
      >
        <iframe
          ref={iframeRef}
          title="Remotion Sandbox Player"
          className="w-full h-full border-0 pointer-events-none"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    );
  }
);

LiveRemotionSandbox.displayName = "LiveRemotionSandbox";
