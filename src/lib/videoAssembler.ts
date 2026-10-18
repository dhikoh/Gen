import { DEFAULT_FPS } from "@/lib/animationContract";

export interface RenderProgress {
  currentFrame: number;
  totalFrames: number;
  percent: number;
}

interface CanvasWithCaptureStream extends HTMLCanvasElement {
  captureStream(fps?: number): MediaStream;
}

/**
 * Tunggu satu frame dari iframe via postMessage.
 * Mengembalikan data URL gambar frame tersebut.
 */
function waitForFrame(timeoutMs = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function handler(e: MessageEvent) {
      if (e.data && typeof e.data === "object" && e.data.type === "frame" && typeof e.data.dataUrl === "string") {
        if (timeoutId !== null) clearTimeout(timeoutId);
        window.removeEventListener("message", handler);
        resolve(e.data.dataUrl);
      }
    }

    timeoutId = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Frame capture timeout"));
    }, timeoutMs);

    window.addEventListener("message", handler);
  });
}

/**
 * Decode data URL ke Image element yang siap digambar ke canvas.
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load frame image data"));
    img.src = dataUrl;
  });
}

/**
 * Render semua frame dari animasi via seek(), lalu gabungkan menjadi video WebM.
 *
 * Alur SEQUENTIAL (bukan paralel):
 * 1. Hitung total frame = durasi * fps.
 * 2. Untuk tiap frame:
 *    a. Kirim seek(t) ke iframe via postMessage.
 *    b. TUNGGU respons "frame" dari iframe (dataUrl).
 *    c. Gambar dataUrl ke offscreen canvas.
 *    d. MediaRecorder merekam canvas stream.
 * 3. Setelah semua frame selesai, stop MediaRecorder dan kembalikan Blob video.
 */
export async function assembleVideo(
  iframeEl: HTMLIFrameElement,
  totalDurationSec: number,
  onProgress?: (p: RenderProgress) => void,
  opts?: { fps?: number; mimeType?: string; frameTimeoutMs?: number; width?: number; height?: number }
): Promise<Blob> {
  const fps = opts?.fps ?? DEFAULT_FPS;
  const width = opts?.width ?? 1920;
  const height = opts?.height ?? 1080;
  const totalFrames = Math.max(1, Math.ceil(totalDurationSec * fps));
  const frameTimeout = opts?.frameTimeoutMs ?? 5000;

  // Buat offscreen canvas untuk menampung frame
  const offscreen = document.createElement("canvas") as CanvasWithCaptureStream;
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) throw new Error("Cannot get 2d context for video assembly");

  if (typeof offscreen.captureStream !== "function") {
    throw new Error("Browser does not support canvas.captureStream()");
  }

  const stream = offscreen.captureStream(fps);
  const preferredMime = opts?.mimeType ?? "video/webm;codecs=vp9";
  const finalMime = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(preferredMime)
    ? preferredMime
    : "video/webm";

  const recorder = new MediaRecorder(stream, {
    mimeType: finalMime,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  // === RENDER LOOP SEQUENTIAL ===
  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame / fps;

    // 1. Kirim seek ke iframe
    iframeEl.contentWindow?.postMessage({ type: "seek", time: t }, "*");

    // 2. TUNGGU respons frame (BLOCKING per frame)
    const dataUrl = await waitForFrame(frameTimeout);

    // 3. Gambar ke offscreen canvas
    const img = await loadImage(dataUrl);
    offCtx.drawImage(img, 0, 0, offscreen.width, offscreen.height);

    // 4. Update progress
    onProgress?.({
      currentFrame: frame + 1,
      totalFrames,
      percent: Math.round(((frame + 1) / totalFrames) * 100),
    });

    // 5. Yield ke browser agar tidak freeze UI
    await new Promise((r) => setTimeout(r, 0));
  }

  // Stop recording dan tunggu blob
  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
    };
    recorder.onerror = (e) => reject(e);
    recorder.stop();
  });
}
