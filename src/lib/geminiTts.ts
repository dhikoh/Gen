/**
 * Gemini TTS API integration.
 * Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *
 * Alur failover:
 * 1. callGeminiTts() mencoba satu API key
 * 2. Retry 1x otomatis untuk error transient (500/503) sesuai rekomendasi Google
 * 3. Caller (endpoint /api/tts/generate) bertanggung jawab loop ke key berikutnya
 *
 * Audio output: PCM mentah dari Gemini dibungkus WAV header (murni JS, tanpa dependency baru)
 */

export type TtsErrorCode =
  | "INVALID_KEY"
  | "RATE_LIMITED"
  | "MODEL_OVERLOADED"
  | "CONTENT_BLOCKED"
  | "TIMEOUT"
  | "UNKNOWN";

export interface TtsCallResult {
  success: boolean;
  audioBuffer?: Buffer;   // WAV lengkap dengan header
  errorCode?: TtsErrorCode;
  errorMessage?: string;
}

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Ping ringan ke Gemini API untuk memvalidasi format dan keabsahan API key.
 * Dipakai saat user menambah key baru di Settings.
 */
export async function validateGeminiApiKey(
  apiKey: string
): Promise<{ valid: boolean; message?: string }> {
  try {
    const res = await fetch(`${GEMINI_BASE_URL}/models`, {
      headers: { "x-goog-api-key": apiKey },
    });
    if (res.ok) return { valid: true };
    const body = await res.json().catch(() => null);
    return {
      valid: false,
      message:
        (body as { error?: { message?: string } })?.error?.message ||
        `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      valid: false,
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}

function classifyError(status: number, body: unknown): TtsErrorCode {
  const errStatus = (body as { error?: { status?: string } })?.error?.status;
  if (status === 400 || status === 403 || errStatus === "PERMISSION_DENIED")
    return "INVALID_KEY";
  if (status === 429) return "RATE_LIMITED";
  if (status === 503) return "MODEL_OVERLOADED";
  // 500 bisa transient (bug text-token Google) — dikembalikan sebagai UNKNOWN agar di-retry
  return "UNKNOWN";
}

function parseSampleRate(mimeType: string | undefined): number {
  const match = mimeType?.match(/rate=(\d+)/);
  return match ? parseInt(match[1], 10) : 24000;
}

/**
 * Bungkus PCM mentah (dari Gemini) menjadi file WAV valid.
 * Murni JavaScript Buffer — tanpa dependency eksternal.
 */
export function pcmToWav(
  pcmData: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);    // PCM chunk size
  buffer.writeUInt16LE(1, 20);     // PCM format
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);

  return buffer;
}

/**
 * Gabungkan array WAV buffer menjadi satu WAV.
 *
 * Algoritma:
 * 1. Parse header WAV pertama untuk mendapatkan sampleRate, channels, bitsPerSample.
 * 2. Strip 44-byte header dari semua buffer, ambil PCM data saja.
 * 3. Gabungkan semua PCM, bungkus dengan satu WAV header baru.
 *
 * Asumsi: semua buffer punya format WAV yang sama (mono, 16-bit, 24000 Hz dari Gemini).
 * Jika ada buffer yang formatnya berbeda, skip buffer tersebut.
 */
export function mergeWavBuffers(wavBuffers: Buffer[]): Buffer {
  if (wavBuffers.length === 0) throw new Error("No WAV buffers to merge");
  if (wavBuffers.length === 1) return wavBuffers[0];

  // Baca parameter dari header WAV pertama
  const first = wavBuffers[0];
  const sampleRate = first.readUInt32LE(24);
  const channels   = first.readUInt16LE(22);
  const bitsPerSample = first.readUInt16LE(34);

  // Kumpulkan semua PCM data (skip 44-byte header dari masing-masing buffer)
  const pcmChunks: Buffer[] = [];
  for (const wav of wavBuffers) {
    if (wav.length < 44) continue;
    const dataSize = wav.readUInt32LE(40);
    const pcm = wav.slice(44, 44 + dataSize);
    pcmChunks.push(pcm);
  }

  const mergedPcm = Buffer.concat(pcmChunks);
  return pcmToWav(mergedPcm, sampleRate, channels, bitsPerSample);
}

/**
 * Panggil Gemini generateContent untuk satu teks -> satu file WAV.
 *
 * @param apiKey           - Gemini API key (raw, sudah didekripsi)
 * @param text             - Teks narasi (sudah termasuk style prefix jika ada)
 * @param voice            - Voice name (dari GEMINI_TTS_VOICES)
 * @param model            - Model ID (dari GEMINI_TTS_MODELS)
 * @param speakingRate     - Kecepatan bicara (0.25–4.0, default 1.0). Didukung Gemini API.
 * @param attemptTimeoutMs - Timeout per percobaan (default 25 detik)
 *
 * - Retry SEKALI otomatis untuk error transient (UNKNOWN / MODEL_OVERLOADED)
 *   sesuai catatan resmi Google soal 500 sesekali terjadi acak
 */
export async function callGeminiTts(
  apiKey: string,
  text: string,
  voice: string,
  model: string,
  speakingRate = 1.0,
  attemptTimeoutMs = 25_000
): Promise<TtsCallResult> {
  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent`;

  // Clamp speakingRate ke range yang didukung Gemini (0.25–4.0)
  const clampedRate = Math.min(4.0, Math.max(0.25, speakingRate));

  const requestBody = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
        speakingRate: clampedRate,
      },
    },
  };

  const doRequest = async (): Promise<TtsCallResult> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), attemptTimeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          errorCode: classifyError(res.status, json),
          errorMessage:
            (json as { error?: { message?: string } })?.error?.message ||
            `HTTP ${res.status}`,
        };
      }

      const part = (json as {
        candidates?: Array<{
          content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
        }>;
      })?.candidates?.[0]?.content?.parts?.[0];

      const inlineData = part?.inlineData;
      if (!inlineData?.data) {
        // Model kadang mengembalikan teks bukan audio — perlakukan sebagai error retryable
        return {
          success: false,
          errorCode: "UNKNOWN",
          errorMessage: "Model tidak mengembalikan audio (kemungkinan transient).",
        };
      }

      const pcm = Buffer.from(inlineData.data, "base64");
      const sampleRate = parseSampleRate(inlineData.mimeType);
      const wav = pcmToWav(pcm, sampleRate);
      return { success: true, audioBuffer: wav };
    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err instanceof Error && err.name === "AbortError";
      return {
        success: false,
        errorCode: "TIMEOUT",
        errorMessage: isAbort ? "Request timeout" : String(err),
      };
    }
  };

  const first = await doRequest();
  if (first.success) return first;

  // Retry SEKALI untuk error yang sifatnya transient
  if (first.errorCode === "UNKNOWN" || first.errorCode === "MODEL_OVERLOADED") {
    return doRequest();
  }

  return first;
}
