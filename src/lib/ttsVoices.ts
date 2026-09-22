/**
 * Daftar voice preset Gemini TTS resmi.
 * Sumber: https://ai.google.dev/gemini-api/docs/speech-generation
 * PERHATIAN: Verifikasi ulang daftar ini sebelum rilis — Google bisa menambah/mengubah voice.
 */
export interface TtsVoiceOption {
  id: string;
  styleHint: string; // deskripsi singkat karakter suara, untuk membantu user memilih
}

export const GEMINI_TTS_VOICES: TtsVoiceOption[] = [
  { id: "Zephyr", styleHint: "Bright" },
  { id: "Puck", styleHint: "Upbeat" },
  { id: "Charon", styleHint: "Informative" },
  { id: "Kore", styleHint: "Firm" },
  { id: "Fenrir", styleHint: "Excitable" },
  { id: "Leda", styleHint: "Youthful" },
  { id: "Orus", styleHint: "Firm" },
  { id: "Aoede", styleHint: "Breezy" },
  { id: "Callirrhoe", styleHint: "Easy-going" },
  { id: "Autonoe", styleHint: "Bright" },
  { id: "Enceladus", styleHint: "Breathy" },
  { id: "Iapetus", styleHint: "Clear" },
  { id: "Umbriel", styleHint: "Easy-going" },
  { id: "Algieba", styleHint: "Smooth" },
  { id: "Despina", styleHint: "Smooth" },
  { id: "Erinome", styleHint: "Clear" },
  { id: "Algenib", styleHint: "Gravelly" },
  { id: "Rasalgethi", styleHint: "Informative" },
  { id: "Laomedeia", styleHint: "Upbeat" },
  { id: "Achernar", styleHint: "Soft" },
  { id: "Alnilam", styleHint: "Firm" },
  { id: "Schedar", styleHint: "Even" },
  { id: "Gacrux", styleHint: "Mature" },
  { id: "Pulcherrima", styleHint: "Forward" },
  { id: "Achird", styleHint: "Friendly" },
  { id: "Zubenelgenubi", styleHint: "Casual" },
  { id: "Vindemiatrix", styleHint: "Gentle" },
  { id: "Sadachbia", styleHint: "Lively" },
  { id: "Sadaltager", styleHint: "Knowledgeable" },
  { id: "Sulafat", styleHint: "Warm" },
];

export const DEFAULT_TTS_VOICE = "Kore";

/**
 * Model Gemini TTS yang tersedia.
 * PERHATIAN: Model ID dapat berubah saat Google merilis versi baru.
 * Update konstanta ini kalau ada perubahan nama model.
 */
export const GEMINI_TTS_MODELS = [
  { id: "gemini-2.5-flash-preview-tts", label: "Gemini 2.5 Flash TTS (Cepat & Hemat)" },
  { id: "gemini-2.5-pro-preview-tts", label: "Gemini 2.5 Pro TTS (Kualitas Lebih Tinggi)" },
] as const;

export type GeminiTtsModelId = (typeof GEMINI_TTS_MODELS)[number]["id"];

export const DEFAULT_TTS_MODEL: GeminiTtsModelId = "gemini-2.5-flash-preview-tts";

/** Batas maksimum API key Gemini yang bisa disimpan per user */
export const MAX_TTS_API_KEYS = 5;
