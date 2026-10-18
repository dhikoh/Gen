"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { validateAnimationCode, CANVAS_ID } from "@/lib/animationContract";

interface Props {
  htmlCode: string | null;
  onReady: () => void;
  onError: (error: string) => void;
  onIframeRef?: (el: HTMLIFrameElement | null) => void;
  width?: number;
  height?: number;
}

/**
 * Merender kode HTML animasi di dalam iframe sandbox.
 *
 * KEAMANAN:
 * - sandbox="allow-scripts" (TANPA allow-same-origin)
 * - Iframe tidak bisa mengakses parent DOM, cookie, localStorage
 * - Komunikasi via postMessage saja
 * - Kode divalidasi sebelum dimasukkan
 */
export default function AnimationRenderer({
  htmlCode,
  onReady,
  onError,
  onIframeRef,
  width = 1920,
  height = 1080,
}: Props) {
  const t = useTranslations("VideoStudio");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const loadAnimation = useCallback(() => {
    if (!htmlCode || !iframeRef.current) return;

    // Validasi keamanan
    const errors = validateAnimationCode(htmlCode);
    if (errors.length > 0) {
      queueMicrotask(() => {
        setStatus("error");
      });
      onError(errors.join("; "));
      return;
    }

    queueMicrotask(() => {
      setStatus("loading");
    });

    // Inject bridge script sebelum </body>
    const bridgeScript = `<script>
(function() {
  window.addEventListener("message", function(e) {
    if (e.data && e.data.type === "seek" && window.__anim) {
      window.__anim.seek(e.data.time);
      var canvas = document.getElementById("${CANVAS_ID}");
      if (canvas) {
        parent.postMessage({
          type: "frame",
          dataUrl: canvas.toDataURL("image/png"),
          time: e.data.time
        }, "*");
      }
    }
    if (e.data && e.data.type === "getDuration" && window.__anim) {
      parent.postMessage({
        type: "duration",
        value: window.__anim.getDuration()
      }, "*");
    }
  });

  if (window.__anim && typeof window.__anim.getReadyPromise === "function") {
    window.__anim.getReadyPromise().then(function() {
      parent.postMessage({ type: "ready" }, "*");
    }).catch(function(err) {
      parent.postMessage({ type: "error", message: String(err) }, "*");
    });
  } else {
    parent.postMessage({ type: "ready" }, "*");
  }
})();
</script>`;

    const wrappedHtml = htmlCode.includes("</body>")
      ? htmlCode.replace("</body>", `${bridgeScript}</body>`)
      : `${htmlCode}${bridgeScript}`;

    iframeRef.current.srcdoc = wrappedHtml;
  }, [htmlCode, onError]);

  // Listen for messages from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || typeof e.data.type !== "string") return;

      if (e.data.type === "ready") {
        setStatus("ready");
        onReady();
      } else if (e.data.type === "error") {
        setStatus("error");
        onError(e.data.message || "Unknown iframe error");
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onReady, onError]);

  useEffect(() => {
    loadAnimation();
  }, [loadAnimation]);

  useEffect(() => {
    onIframeRef?.(iframeRef.current);
  }, [onIframeRef]);

  const displayWidth = Math.min(width, 960);
  const displayHeight = (displayWidth / width) * height;

  return (
    <div className="space-y-2">
      <div
        className="relative rounded-xl overflow-hidden neu-pressed bg-black flex items-center justify-center mx-auto"
        style={{ width: displayWidth, height: displayHeight }}
      >
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          title={t("previewTitle")}
          style={{
            width: width,
            height: height,
            transform: `scale(${displayWidth / width})`,
            transformOrigin: "top left",
            border: "none",
          }}
        />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
            <span className="pg-text-heading text-sm animate-pulse">{t("loading")}</span>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none">
            <span className="text-sm font-semibold text-red-500">{t("renderError")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
