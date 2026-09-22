/**
 * Daftar voice preset Gemini TTS resmi, diurutkan A-Z.
 * Sumber: https://ai.google.dev/gemini-api/docs/speech-generation
 * PERHATIAN: Verifikasi ulang daftar ini sebelum rilis — Google bisa menambah/mengubah voice.
 */
export interface TtsVoiceOption {
  id: string;
  styleHint: string;   // karakter singkat (kompatibilitas lama)
  gender: "Male" | "Female" | "Neutral";
  tone: string;        // deskripsi karakter suara lengkap
  bestFor: string;     // rekomendasi use-case
}

// Diurutkan A-Z berdasarkan id
export const GEMINI_TTS_VOICES: TtsVoiceOption[] = [
  { id: "Achernar",       styleHint: "Soft",           gender: "Female",  tone: "Lembut & Tenang",                   bestFor: "Storytelling santai, ASMR, narasi malam" },
  { id: "Achird",         styleHint: "Friendly",       gender: "Male",    tone: "Ramah & Hangat",                    bestFor: "Tutorial, explainer, konten edukasi" },
  { id: "Algenib",        styleHint: "Gravelly",       gender: "Male",    tone: "Berat & Berkarakter",               bestFor: "Dokumenter, konten sejarah, brand maskulin" },
  { id: "Algieba",        styleHint: "Smooth",         gender: "Male",    tone: "Halus & Mengalir",                  bestFor: "Presentasi, podcast profesional, narasi iklan" },
  { id: "Alnilam",        styleHint: "Firm",           gender: "Male",    tone: "Tegas & Berwibawa",                 bestFor: "Berita, konten korporat, safety announcement" },
  { id: "Aoede",          styleHint: "Breezy",         gender: "Female",  tone: "Ringan & Mengalir Bebas",           bestFor: "Travel, lifestyle, konten santai" },
  { id: "Autonoe",        styleHint: "Bright",         gender: "Female",  tone: "Cerah & Antusias",                  bestFor: "Promo produk, opening hook, konten muda" },
  { id: "Callirrhoe",     styleHint: "Easy-going",     gender: "Female",  tone: "Santai & Tidak Formal",             bestFor: "Vlog, daily life, konten informal" },
  { id: "Charon",         styleHint: "Informative",    gender: "Male",    tone: "Informatif & Jelas",                bestFor: "Edukasi, tutorial teknis, how-to" },
  { id: "Despina",        styleHint: "Smooth",         gender: "Female",  tone: "Halus & Meyakinkan",                bestFor: "Beauty, wellness, konten inspiratif" },
  { id: "Enceladus",      styleHint: "Breathy",        gender: "Male",    tone: "Napas Dalam & Dramatis",            bestFor: "Drama, konten emosional, trailer" },
  { id: "Erinome",        styleHint: "Clear",          gender: "Female",  tone: "Jernih & Mudah Dipahami",           bestFor: "Konten anak-anak, onboarding, narasi bersih" },
  { id: "Fenrir",         styleHint: "Excitable",      gender: "Male",    tone: "Bersemangat & Enerjik",             bestFor: "Gaming, sport, konten high-energy" },
  { id: "Gacrux",         styleHint: "Mature",         gender: "Male",    tone: "Matang & Berkelas",                 bestFor: "Luxury brand, finance, konten premium" },
  { id: "Iapetus",        styleHint: "Clear",          gender: "Male",    tone: "Jernih & Netral",                   bestFor: "Narasi umum, explainer netral, e-learning" },
  { id: "Kore",           styleHint: "Firm",           gender: "Female",  tone: "Tegas & Profesional",               bestFor: "Korporat, leadership, konten resmi" },
  { id: "Laomedeia",      styleHint: "Upbeat",         gender: "Female",  tone: "Ceria & Positif",                   bestFor: "Motivasi, konten positif, coaching" },
  { id: "Leda",           styleHint: "Youthful",       gender: "Female",  tone: "Muda & Segar",                      bestFor: "Gen-Z content, fashion, pop culture" },
  { id: "Orus",           styleHint: "Firm",           gender: "Male",    tone: "Tegas & Stabil",                    bestFor: "Presentasi bisnis, narasi serius" },
  { id: "Puck",           styleHint: "Upbeat",         gender: "Male",    tone: "Enerjik & Menghibur",               bestFor: "Entertainment, review, unboxing" },
  { id: "Pulcherrima",    styleHint: "Forward",        gender: "Female",  tone: "Percaya Diri & Proaktif",           bestFor: "Sales, CTA kuat, konten persuasif" },
  { id: "Rasalgethi",     styleHint: "Informative",    gender: "Male",    tone: "Edukatif & Otoritatif",             bestFor: "Dokumenter, berita ilmiah, konten riset" },
  { id: "Sadachbia",      styleHint: "Lively",         gender: "Male",    tone: "Hidup & Ekspresif",                 bestFor: "Komedi, variety, konten dinamis" },
  { id: "Sadaltager",     styleHint: "Knowledgeable",  gender: "Male",    tone: "Berpengetahuan & Tepercaya",        bestFor: "Finance, tech, konten pakar" },
  { id: "Schedar",        styleHint: "Even",           gender: "Male",    tone: "Konsisten & Stabil",                bestFor: "Audiobook, narasi panjang, e-learning" },
  { id: "Sulafat",        styleHint: "Warm",           gender: "Female",  tone: "Hangat & Empatik",                  bestFor: "Health, parenting, konten personal" },
  { id: "Umbriel",        styleHint: "Easy-going",     gender: "Male",    tone: "Santai & Mudah Didengar",           bestFor: "Podcast casual, vlog, daily content" },
  { id: "Vindemiatrix",   styleHint: "Gentle",         gender: "Female",  tone: "Lembut & Penuh Perhatian",          bestFor: "Meditasi, wellness, konten relaksasi" },
  { id: "Zephyr",         styleHint: "Bright",         gender: "Female",  tone: "Cerah & Enerjik",                   bestFor: "Promo, opening, konten upbeat" },
  { id: "Zubenelgenubi",  styleHint: "Casual",         gender: "Male",    tone: "Kasual & Relatable",                bestFor: "Daily vlog, storytime, konten personal" },
];

export const DEFAULT_TTS_VOICE = "Kore";

/**
 * Model Gemini TTS yang tersedia.
 * PERHATIAN: Model ID dapat berubah saat Google merilis versi baru.
 * Update konstanta ini kalau ada perubahan nama model.
 */
export const GEMINI_TTS_MODELS = [
  { id: "gemini-2.5-flash-preview-tts", label: "Gemini 2.5 Flash TTS (Cepat & Hemat)" },
  { id: "gemini-2.5-pro-preview-tts",   label: "Gemini 2.5 Pro TTS (Kualitas Lebih Tinggi)" },
] as const;

export type GeminiTtsModelId = (typeof GEMINI_TTS_MODELS)[number]["id"];

export const DEFAULT_TTS_MODEL: GeminiTtsModelId = "gemini-2.5-flash-preview-tts";

/** Batas maksimum API key Gemini yang bisa disimpan per user */
export const MAX_TTS_API_KEYS = 5;

/** Preset pitch — dikonversi ke style instruction teks karena Gemini tidak punya pitch API */
export const TTS_PITCH_PRESETS = [
  { id: "normal",      label: "Normal",           instruction: null },
  { id: "higher",      label: "Lebih Tinggi (+1)", instruction: "Speak with a slightly higher pitch than your default." },
  { id: "highest",     label: "Lebih Tinggi (+2)", instruction: "Speak with a noticeably higher pitch." },
  { id: "lower",       label: "Lebih Rendah (-1)", instruction: "Speak with a slightly lower pitch than your default." },
  { id: "lowest",      label: "Lebih Rendah (-2)", instruction: "Speak with a noticeably lower, deeper pitch." },
] as const;

export type TtsPitchPresetId = (typeof TTS_PITCH_PRESETS)[number]["id"];
export const DEFAULT_TTS_PITCH: TtsPitchPresetId = "normal";
