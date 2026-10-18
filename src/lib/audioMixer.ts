import type { VideoTimelineScene } from "@/types/videoTimeline";

/**
 * Gabungkan audio narasi per-scene menjadi satu AudioBuffer sesuai timeline.
 *
 * Setiap scene.audioRef berisi base64-encoded audio (dari Voice Studio).
 * Audio ditempatkan pada posisi startOffsetSec di output buffer.
 */
export async function mixAudio(
  scenes: VideoTimelineScene[],
  totalDurationSec: number,
  sampleRate = 44100
): Promise<AudioBuffer> {
  const safeDuration = Math.max(1, Math.ceil(totalDurationSec));
  const ctx = new OfflineAudioContext(1, sampleRate * safeDuration, sampleRate);

  for (const scene of scenes) {
    if (!scene.audioRef) continue;

    try {
      // Decode base64 audio
      const base64Clean = scene.audioRef.replace(/^data:[^;]+;base64,/, "");
      const binary = typeof atob === "function" ? atob(base64Clean) : Buffer.from(base64Clean, "base64").toString("binary");
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(Math.max(0, scene.startOffsetSec));
    } catch (err) {
      console.error(`Audio decode failed for scene ${scene.sceneNumber}:`, err);
    }
  }

  return ctx.startRendering();
}

/**
 * Konversi AudioBuffer ke WAV Blob untuk download.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;

  const data = buffer.getChannelData(0);
  const dataLength = data.length * (bitsPerSample / 8);
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  function writeString(dv: DataView, pos: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      dv.setUint8(pos + i, str.charCodeAt(i));
    }
  }

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // PCM data samples
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}
