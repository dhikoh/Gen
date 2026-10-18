import {
  computeRemotionPlan,
  getRemotionDimensions,
  type RemotionPlan,
  type RemotionPromptOptions,
} from "@/lib/remotionPromptBuilder";
import { renderRemotionFrame } from "@/lib/remotionCanvasRenderer";
import { mixAudio } from "@/lib/audioMixer";
import type { VideoTimeline } from "@/types/videoTimeline";

export interface RemotionRenderProgress {
  currentFrame: number;
  totalFrames: number;
  percent: number;
}

export interface RemotionRenderResult {
  blob: Blob;
  mimeType: string;
  extension: "mp4" | "webm";
  filename: string;
}

interface CanvasWithCaptureStream extends HTMLCanvasElement {
  captureStream(fps?: number): MediaStream;
}

/**
 * Deteksi format rekaman terbaik yang didukung oleh browser pengguna.
 */
function getSupportedMimeType(): { mimeType: string; extension: "mp4" | "webm" } {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "video/webm", extension: "webm" };
  }

  const mp4Types = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=h264,aac",
    "video/mp4",
  ];

  for (const t of mp4Types) {
    if (MediaRecorder.isTypeSupported(t)) {
      return { mimeType: t, extension: "mp4" };
    }
  }

  const webmTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  for (const t of webmTypes) {
    if (MediaRecorder.isTypeSupported(t)) {
      return { mimeType: t, extension: "webm" };
    }
  }

  return { mimeType: "video/webm", extension: "webm" };
}

/**
 * Render seluruh timeline Remotion menjadi video file di browser client.
 * 100% diproses di GPU/CPU komputer pengguna tanpa membebani server.
 */
export async function assembleRemotionVideo(
  timeline: VideoTimeline,
  options: RemotionPromptOptions,
  onProgress?: (progress: RemotionRenderProgress) => void,
  signal?: AbortSignal,
): Promise<RemotionRenderResult> {
  const plan: RemotionPlan = computeRemotionPlan(timeline, options.fps);
  const { width, height } = getRemotionDimensions(options.aspectRatio);

  // 1. Siapkan Canvas Offscreen
  const canvas = document.createElement("canvas") as CanvasWithCaptureStream;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    throw new Error("Gagal menginisialisasi 2D Canvas context");
  }

  // 2. Siapkan Audio Mix dari timeline jika tersedia
  let audioContext: AudioContext | null = null;
  let audioStreamDest: MediaStreamAudioDestinationNode | null = null;
  let audioSource: AudioBufferSourceNode | null = null;

  const hasAnyAudio = timeline.scenes.some((s) => Boolean(s.audioRef));
  if (hasAnyAudio) {
    try {
      const totalDurationSec = plan.totalFrames / options.fps;
      const audioBuffer = await mixAudio(timeline.scenes, totalDurationSec);

      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContext = new AudioCtxClass();
      audioStreamDest = audioContext.createMediaStreamDestination();
      audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.connect(audioStreamDest);
    } catch (err) {
      console.warn("Gagal mencampur audio narasi untuk render video:", err);
    }
  }

  // 3. Siapkan Stream & MediaRecorder
  const canvasStream = canvas.captureStream(options.fps);
  if (audioStreamDest !== null) {
    for (const track of audioStreamDest.stream.getAudioTracks()) {
      canvasStream.addTrack(track);
    }
  }

  const { mimeType, extension } = getSupportedMimeType();
  const chunks: Blob[] = [];

  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 8_000_000, // 8 Mbps untuk kualitas Full HD jernih
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
    recorder.onerror = () => {
      reject(new Error("Perekaman video di browser gagal"));
    };
  });

  // 4. Mulai Merekam
  recorder.start();
  if (audioSource !== null && audioContext !== null) {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    audioSource.start(0);
  }

  const frameIntervalMs = 1000 / options.fps;
  const totalFrames = plan.totalFrames;

  // 5. Render Tiap Frame Secara Sekuensial Sesuai Kecepatan Clock
  for (let f = 0; f < totalFrames; f++) {
    if (signal?.aborted) {
      recorder.stop();
      if (audioContext) void audioContext.close();
      throw new Error("Render dibatalkan oleh pengguna");
    }

    const frameStartTime = performance.now();

    renderRemotionFrame(ctx, plan, options, f);

    if (onProgress) {
      onProgress({
        currentFrame: f + 1,
        totalFrames,
        percent: Math.min(100, Math.round(((f + 1) / totalFrames) * 100)),
      });
    }

    const elapsed = performance.now() - frameStartTime;
    const waitTime = Math.max(0, frameIntervalMs - elapsed);
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  // Tunggu sedikit agar frame terakhir terekam sempurna
  await new Promise((resolve) => setTimeout(resolve, 100));

  recorder.stop();
  if (audioContext !== null) {
    void audioContext.close();
  }

  const finalBlob = await recordingPromise;
  const filename = `${options.componentName}.${extension}`;

  return {
    blob: finalBlob,
    mimeType,
    extension,
    filename,
  };
}
