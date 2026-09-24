import { resolveVisualStyle } from "./visualStyleMap";

export interface ContentArchetypeData {
  id?: string;
  name?: string;
  narrationMode?: "VOICE_OVER" | "DIEGETIC_ONLY" | "SILENT_TEXT_ONLY" | "HYBRID" | string | null;
  emotionalArcTemplate?: string | null;
  defaultIncludedSections?: { hook?: boolean; cta?: boolean; caption?: boolean; thumbnail?: boolean } | null;
  compositionCategories?: Array<{ label: string; required: boolean }> | null;
  durationCalcMode?: "NARRATION_WORDCOUNT" | "SEGMENT_SELF_ESTIMATE" | "HYBRID" | string | null;
  cameraMovementRoleMap?: Record<string, string[]> | null;
}

export interface ProfileChannelData {
  channelName: string;
  niche?: string | null;
  description?: string | null;
  personaPov?: string | null;
  visualAesthetic?: string | null;
  cta1?: string | null;
  cta2?: string | null;
  audioBGM?: boolean | null;
  audioSFX?: boolean | null;
  audioVO?: boolean | null;
  products?: Array<{ name: string; price: number; description?: string | null }>;
  socialLinks?: Array<{ platform: string; url: string }> | null;
  contentArchetypeId?: string | null;
  contentArchetype?: ContentArchetypeData | null;
  speechRate?: number | null;
  targetPlatform?: string | null;
}

export interface VideoConfigData {
  targetPlatform?: string | null;
  targetDurationSec?: number | null;
  targetSceneCount?: number | null;
  aspectRatio?: string | null;
  narrativeLoopStyle?: string | null;
  visualLoopStyle?: string | null;
  pov?: string | null;
  speechRate?: string | null;
  hookStyle?: string | null;
  endingStyle?: string | null;
  selectedProductId?: string | null;
  selectedProduct?: { name: string; price: number; description?: string | null };
  composition?: { education?: number | null; entertainment?: number | null; marketing?: number | null } | null;
  includeHook?: boolean | null;
  includeCTA?: boolean | null;
  socialCaption?: boolean | null;
  thumbnailIdea?: boolean | null;
  htmlBlog?: boolean | null;
  affiliateAngle?: boolean | null;
  affiliateAngleMode?: "CTA" | "SOFT" | null;
  affiliateMarketplaces?: string[] | null;
  affiliateCustomUrl?: string | null;
  // Push-ported enrichment params
  rolePOV?: string | null;
  toneOfVoice?: string | null;
  visualStyle?: string | null;
  hookStyleType?: string | null; // Legacy Push field — no UI, always "auto". Kept for API backward compat.
  customHookText?: string | null; // Legacy Push field — no UI. Kept for API backward compat.
  isLoopable?: boolean | null;
  isVideoLoop?: boolean | null;
  musicPreference?: boolean | null;
  sfxPreference?: boolean | null;
  voPreference?: boolean | null;
  selectedSections?: string[] | null;
  isVideoPlatform?: boolean | null;
  // Camera Movement
  cameraMovementEnabled?: boolean | null;
  cameraMovementPresets?: string[] | null;
  cameraMovementCustom?: string | null;
  cameraMovementProEnabled?: boolean | null; // server-resolved PRO entitlement
  // Retention & Pacing Engine 2026
  retentionPacingProEnabled?: boolean | null; // server-resolved PRO entitlement
  retentionPacingMode?: "AUTO" | "JUMP_CUT" | "B_ROLL_HEAVY" | "BEAT_SYNC" | "CONTEMPLATIVE" | string | null;
  // Storytelling & Value Promise 2026
  storytellingFramework?: "VET_3ACT" | "PAS" | "AIDA" | "STORY_ARC" | string | null;
  valuePromise3Sec?: string | null;
  // Thumbnail 2026
  thumbnailStylePreset?: "GILA" | "ANTI_GAGAL" | "3_LANGKAH" | "BOOYAH" | "KAGET" | "CUSTOM" | "AUTO" | string | null;
  thumbnailFaceDominance?: boolean | null; // 60-80% frame
  // Three-Tier SEO Keywords 2026
  targetKeywordsSpecific?: string[] | string | null;
  targetKeywordsGeneral?: string[] | string | null;
  targetKeywordsLongTail?: string[] | string | null;
  // Audio Dynamics 2026
  audioFadeInOut?: boolean | null;
  audioBeatSync?: boolean | null;
  // Archetype & Narration Mode (Bagian 23)
  contentArchetypeId?: string | null;
  contentArchetype?: ContentArchetypeData | null;
  narrationMode?: "VOICE_OVER" | "DIEGETIC_ONLY" | "SILENT_TEXT_ONLY" | "HYBRID" | string | null;
  targetKeywords?: string[] | string | null;
  trendingAudio?: string | null;
  // Overlay Style & Chapter Structure
  overlayStyle?: "auto" | "chapter_titles" | "key_points" | "mixed" | "minimal" | string | null;
}

export interface PromptSettingsData {
  videoSystemInstruction?: string | null;
  imageSystemInstruction?: string | null;
  defaultSpeechRate?: string | null;
  defaultNegativePrompt?: string | null;
  bannedWords?: string[] | string | unknown;
  platformAlgorithmGuide?: Record<string, string> | unknown;
}

export interface TopPerformingDraftSummary {
  id: string;
  title: string;
  views: number;
  retentionPct?: number | null;
  likes: number;
  hookText?: string | null;
  toneOfVoice?: string | null;
  targetKeywords?: string[] | string | null;
}

const YOUTUBE_SHORTS_GUIDE = `[STRATEGI ALGORITMA PLATFORM: YOUTUBE SHORTS] — ALGORITMA EMPATI 2026
Fokus Utama: Session Time, Audience Retention Curve, Rewatch Loop & Subscribe-After-View.
1. Value Promise 3 Detik Pertama: Hindari cliff drop-off di detik 0-3. Hubungkan hook langsung ke premis inti tanpa basa-basi salam atau intro channel.
2. Retention Curve Smoothing & Jump Cut: Eliminasi jeda diam (dead air < 0.3s) antar kalimat. Sisipkan visual sync yang selaras dengan ketukan beat audio.
3. Subtle Climax CTA: Sisipkan ajakan subscribe yang halus dan kontekstual di TITIK EMOSIONAL PUNCAK (sebelum solusi akhir terungkap sepenuhnya).
4. Search & Browse Synergy: Integrasikan kata kunci spesifik dan long-tail di 3 detik pertama narasi agar terindeks kuat pada YouTube Search & Shorts Feed.`;

const YOUTUBE_LONG_GUIDE = `[STRATEGI ALGORITMA PLATFORM: YOUTUBE LONG-FORM] — SISTEM REKOMENDASI EMPATI 2026
Fokus Utama: Kepuasan Prediktif Penonton, Average View Duration (AVD), Audience Retention Curve & Search/Browse Synergy.
1. Value Promise 3 Detik: Awali video dengan janji nilai yang gamblang dan memikat tanpa basa-basi intro. Berikan preview solusi sebelum detik ke-5 agar penonton tidak pergi.
2. Anti-Drop di Menit Tengah (Mid-Roll Retention): Sisipkan re-engagement hook, visual variety (B-roll & cutaways), dan perubahan pacing di menit ke-3 dan titik 50% durasi untuk mencegah grafik retensi menukik ke bawah.
3. Struktur Bab Tematik (Chapters): Bagi alur bahasan ke dalam bab-bab yang jelas dengan judul overlay agar penonton merasakan perkembangan informasi yang terstruktur.
4. Subtle Climax CTA: Letakkan ajakan subscribe dan diskusi komunitas pada titik emosional puncak naskah sebelum resolusi akhir.
5. Format Widescreen Sinematik: Wajib rasio 16:9, tata visual horizontal, dan palet warna kontras sinematik.`;

export const YOUTUBE_2026_STRATEGY_MASTER_DOC = `[DOKUMEN RUJUKAN UTAMA: PANDUAN LENGKAP STRATEGI YOUTUBE 2026 (SHORTS & LONG-FORM)]
Kamu bertindak sebagai Master Content Strategist & Video Producer yang menguasai secara utuh riset algoritma YouTube 2026. WAJIB PELAJARI, INTERNALISASI, dan jadikan landasan teori berikut sebagai standar acuan mutlak dalam mengevaluasi materi dan mengeksekusi naskah:

1. PARADIGMA SISTEM REKOMENDASI 2026 (PREDICTIVE VIEWER SATISFACTION):
   - YouTube 2026 mengukur kepuasan prediktif penonton (Audience Retention Curve Smoothing), bukan sekadar CTR atau clickbait kosong.
   - Format Shorts (9:16): Target utama adalah Average Percentage Viewed (APV) >85-100%, eliminasi drop retensi di detik 0-3 via Janji Nilai (Value Promise), dan seamless rewatch loop.
   - Format Long-Form (16:9): Target utama adalah Average View Duration (AVD), struktur bab tematik (Chapters), dan pencegahan mid-roll drop-off di menit tengah via visual variety & re-engagement hook.

2. STORYTELLING BEREMPATI: FRAMEWORK VET 3-ACT:
   - Babak 1 - Validation (0-15%): Memvalidasi masalah, rasa penasaran, atau frustrasi audiens secara empati tanpa salam/intro bertele-tele.
   - Babak 2 - Exploration (15-80%): Pembahasan mendalam materi dengan variasi stimulus visual (visual reset) setiap 2-3 detik dan transisi konsep yang dinamis.
   - Babak 3 - Transformation (80-100%): Menghadirkan solusi nyata, resolusi bernilai tinggi, dan subtle climax CTA yang terikat konteks cerita.

3. PACING & RETENSI TINGGI (ZERO DEAD-AIR & DINAMIKA AUDIO):
   - Pemangkasan jeda hening antar-kalimat (<0.3 detik). Narasi mengalir rapat dan bertenaga.
   - Environmental Activity Layer: Setiap scene visual AI wajib memiliki minimal 1 elemen dinamis bergerak (uap, pergeseran cahaya, bokeh partikel, refleksi).
   - Audio Dynamics: Fade-in halus di pembuka, Fade-out halus di penutup, dan visual sync yang selaras dengan ketukan beat audio latar (BGM).

4. FORMULA THUMBNAIL 2026 & MOBILE SHRINK TEST (120px):
   - 5 Template Anti-Gagal: Extreme Contrast Split, Single Word Shock, Red Circle Inset, Side-by-Side Reality Check, Subject Isolation Bokeh.
   - Subjek utama ekspresif dominan (60-80% frame) + teks maksimal 1-3 kata huruf kapital kontras tinggi yang lulus uji keterbacaan pada layar ponsel kecil.

5. ARSITEKTUR METADATA SEO 3-TIER:
   - Tier 1: Tag Spesifik (Brand / entitas / kata kunci utama).
   - Tier 2: Tag Umum (Kategori industri / niche luas).
   - Tier 3: Tag Majemuk / Long-Tail (Frasa pencarian 3-5 kata ramah conversational & semantic AI search).
   - Deskripsi YouTube naratif yang mengalirkan kata kunci secara alami dan ramah manusia.`;

export const DEFAULT_PLATFORM_ALGORITHM_GUIDE: Record<string, string> = {
  TikTok: `[STRATEGI ALGORITMA PLATFORM: TIKTOK]
Fokus Utama: Completion Rate (Persentase Tonton Tuntas) & Rewatch Loop (Pemutaran Ulang).
1. Psychological Retention Loop: Rancang naskah dengan 'open loops' yang ditahan hingga 70-80% durasi video, lalu berikan resolusi cepat dan memuaskan.
2. Hook Pemicu Rewatch: Gunakan hook visual/verbal berkecepatan tinggi yang mengundang penonton mengulang video (misal: visual clue tersembunyi, punchline bersambung ke kalimat awal, atau fakta kontraintuitif).
3. Pacing Bebas Dead-Air: Eliminasi jeda antar-kalimat lebih dari 0.5 detik. Setiap perpindahan scene wajib memiliki transisi dinamika audio/visual baru.`,

  "Instagram Reels": `[STRATEGI ALGORITMA PLATFORM: INSTAGRAM REELS]
Fokus Utama: Shareability (Kirim via DM) & Saveability (Simpan/Bookmark).
1. Momen 'Worth Saving' (Layak Simpan): Sisipkan minimal 1 segmen berupa tips terstruktur, kerangka kerja (framework), daftar checklist, atau ringkasan aksi nyata yang memicu penonton menekan tombol simpan/bookmark untuk referensi masa depan.
2. Momen 'Worth Sharing' (Layak Kirim): Buat 1-2 baris narasi yang sangat relatable atau menyentuh emosi personal ('ini gue banget', 'kamu harus tahu ini') sehingga memicu audiens mengirimkannya ke teman via direct message (DM).
3. Visual First: Pastikan teks overlay terbaca jelas dalam safe zone 9:16 feed Instagram.`,

  "YouTube Shorts": YOUTUBE_SHORTS_GUIDE,

  "YouTube Long": YOUTUBE_LONG_GUIDE,

  "YouTube Long-Form": YOUTUBE_LONG_GUIDE,

  Facebook: `[STRATEGI ALGORITMA PLATFORM: FACEBOOK]
Fokus Utama: Social Sharing, Resonansi Komunitas & Silent Autoplay.
1. Narrative Storytelling: Gunakan pendekatan cerita personal atau studi kasus bernuansa emosional dan kekeluargaan yang mudah dipahami lintas generasi.
2. Silent-Friendly Visuals: Optimalkan teks overlay di setiap scene karena mayoritas pengguna Facebook menonton video pertama kali tanpa suara aktif.
3. Conversation Trigger: Tutup dengan pertanyaan diskusi terbuka yang memicu debat sehat atau sharing opini di kolom komentar.`,

  LinkedIn: `[STRATEGI ALGORITMA PLATFORM: LINKEDIN]
Fokus Utama: Professional Insight, Otoritas Industri & Thought Leadership.
1. Business/Career Framework: Sajikan informasi dengan logika bisnis terstruktur, analogi profesional, atau pembelajaran karier yang berbobot.
2. Credibility-Driven Tone: Nada bicara tajam, berbasis observasi nyata atau data, tanpa hiperbola berlebihan.
3. Actionable Takeaways: Berikan 1 kesimpulan taktis yang dapat langsung dipraktikkan audiens di tempat kerja mereka.`,

  "Twitter/X": `[STRATEGI ALGORITMA PLATFORM: TWITTER/X]
Fokus Utama: Hook Tajam, Tesis Berani & Diskusi Panas.
1. Contrarian / Polarizing Angle: Awali dengan sudut pandang unik yang mendobrak asumsi umum seputar topik.
2. Fast-Paced Argumentation: Argumen to the point, padat informasi, tanpa pengulangan kata.
3. Thread-Style Caption: Siapkan caption pendek yang mengundang retweet dan kutipan tweet.`,
};

export interface StructuralInstructions {
  emotionalArcSection: string;
  viralGuidelineSection: string;
  pacingGuidelineSection: string;
  narrationModeDirective: string;
  hookStrategyDirective: string;
  engagementTriggerDirective: string;
}

/**
 * Bagian 23: Universal / Model-Agnostic Content Structure Engine
 * Sumber kebenaran tunggal untuk instruksi struktural (Emotional Arc, Hook/CTA, Mode Narasi).
 */
export function buildStructuralInstructions(
  includedSections: { hook?: boolean; cta?: boolean; caption?: boolean; thumbnail?: boolean },
  archetype?: ContentArchetypeData | null,
  activeNarrationMode?: string | null,
  targetKeywords?: string[] | string | null
): StructuralInstructions {
  const isHookEnabled = includedSections?.hook ?? archetype?.defaultIncludedSections?.hook ?? true;
  const isCtaEnabled = includedSections?.cta ?? archetype?.defaultIncludedSections?.cta ?? true;
  const effectiveNarrationMode = activeNarrationMode || archetype?.narrationMode || "VOICE_OVER";
  const emotionalArc = archetype?.emotionalArcTemplate?.trim() || "Hook -> Problem -> Solution -> CTA";

  // 1. Emotional Arc Section (Bagian 13.2 poin 7 & Bagian 23.3 poin 1)
  let emotionalArcSection = "";
  if (isHookEnabled) {
    emotionalArcSection = `[PANDUAN EMOTIONAL ARC / BUSUR EMOSI]\n1. Rancang busur emosi naskah: ${emotionalArc}.\n2. Setiap scene punya satu emosi dominan yang jelas.\n3. Gunakan Visual Prompt untuk memperkuat emosi dominan.\n`;
  } else if (emotionalArc && emotionalArc !== "Hook -> Problem -> Solution -> CTA") {
    // Custom arc without hook (misal faceless: Setup -> Recognition -> Emotional Payoff)
    emotionalArcSection = `[PANDUAN ALUR STRUKTUR KONTEN]\n1. Rancang alur dramatik adegan: ${emotionalArc}.\n2. Setiap scene punya satu fokus emosi/atmosfer yang jelas.\n3. Gunakan Visual Prompt untuk memperkuat intensitas cerita.\n`;
  }

  // 2. Viral Guidelines (Bagian 18 & Bagian 23.3 poin 0)
  // Retention loop dan hook HANYA disuntik jika toggle Hook aktif!
  let viralGuidelineSection = `[PANDUAN STRATEGI & VIRALITAS KONTEN]\n`;
  let itemIndex = 1;
  if (isHookEnabled) {
    viralGuidelineSection += `${itemIndex++}. Hook & Retensi: 3 detik pertama WAJIB memiliki visual/auditori hook yang kuat (pertanyaan provokatif, statemen kontroversial).\n`;
    viralGuidelineSection += `${itemIndex++}. Open Loops: Sisipkan 'open loops' (rasa penasaran yang ditunda) di tengah narasi agar penonton bertahan.\n`;
  }
  viralGuidelineSection += `${itemIndex++}. Spesifikasi Platform: Optimalkan pacing cepat, hindari jeda diam (dead air) lebih dari 1 detik.\n`;
  viralGuidelineSection += `${itemIndex++}. Arsitektur Konten & Tren: Buat alur autentik, rentan, retro, dan organik. Hindari gaya bahasa terlampau formal. Hubungkan secara relatable ke audiens modern.\n`;
  if (isHookEnabled) {
    // Fix #57: Gate AIDA "Action" step by isCtaEnabled.
    // Jika CTA dimatikan, gunakan PAS saja (tanpa step Action) agar AI tidak membuat
    // scene subscribe/follow/retention CTA di akhir video.
    const aiaFramework = isCtaEnabled
      ? `PAS (Problem → Agitate → Solution) atau AIDA (Attention → Interest → Desire → Action)`
      : `PAS (Problem → Agitate → Solution) — TANPA step Action/CTA. DILARANG mengakhiri narasi dengan ajakan follow, subscribe, atau retensi eksplisit`;
    viralGuidelineSection += `${itemIndex++}. Psikologi Copywriting: Gunakan kerangka ${aiaFramework}.\n`;
  } else {
    viralGuidelineSection += `${itemIndex++}. Psikologi Visual: Bangun resonansi lewat kontras visual, estetika sinematik, dan atmosfer storytelling.\n`;
  }

  // 3. Pacing Guidelines (Bagian 23.3)
  let pacingGuidelineSection = `[PANDUAN PACING & RHYTHM]\n`;
  let pIdx = 1;
  if (isHookEnabled) {
    pacingGuidelineSection += `${pIdx++}. Scene 1 (Hook): Kalimat pendek, cepat, staccato. Maksimal 2-3 kalimat singkat. Tujuan: menghentikan scroll dalam 3 detik.\n`;
    pacingGuidelineSection += `${pIdx++}. Scene Tengah (Body): Perlambat pacing. Kalimat lebih panjang dan detail.\n`;
  } else {
    pacingGuidelineSection += `${pIdx++}. Scene Pembuka: Bangun atmosfer dan subjek utama dengan visual yang memikat dan immersif.\n`;
    pacingGuidelineSection += `${pIdx++}. Scene Tengah: Pertahankan momentum cerita dengan detail aksi dan perubahan visual bertahap.\n`;
  }
  if (isCtaEnabled) {
    pacingGuidelineSection += `${pIdx++}. Scene Akhir (CTA): Kembali ke pacing cepat. Kalimat imperatif dan berenergi.\n`;
  } else {
    pacingGuidelineSection += `${pIdx++}. Scene Penutup: Berikan resolusi atau impresi visual akhir yang mendalam dan membekas.\n`;
  }

  // 4. Narration Mode Directive (Bagian 23.3 poin 2)
  let narrationModeDirective = "";
  if (effectiveNarrationMode === "DIEGETIC_ONLY" || effectiveNarrationMode === "SILENT_TEXT_ONLY") {
    narrationModeDirective = `\n[INSTRUKSI MODE NARASI: ${effectiveNarrationMode}]\n` +
      `1. DILARANG KERAS menyisipkan dialog/voice-over/narator dari luar adegan (voice-over/voice of god).\n` +
      `2. Seluruh audio WAJIB bersifat diegetik (suara nyata di dalam dunia adegan: SFX, foley, ambient lingkungan, atau ekspresi vokal non-verbal karakter di scene).\n` +
      `3. Field NARASI pada setiap scene WAJIB diisi dengan teks bertanda eksplisit "[DIEGETIC - TANPA VOICE-OVER]" atau string kosong bertanda (BUKAN dikosongkan tanpa kejelasan).\n`;
  }

  // 5. Hook Strategy Directive in Tahap 2 Header
  const kwList = Array.isArray(targetKeywords)
    ? targetKeywords
    : typeof targetKeywords === "string" && targetKeywords.trim()
    ? targetKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];
  const seoKeywordsText = kwList.length > 0
    ? `TARGET KATA KUNCI SEO: ${kwList.join(", ")}\n`
    : "";

  let hookStrategyDirective = "";
  if (isHookEnabled) {
    hookStrategyDirective = `## ANALISIS STRATEGI KONTEN & HOOK\n${seoKeywordsText}AUDIENS PERSONA & PSIKOLOGI: [Analisis singkat]\nSTRATEGI HOOK (0-3 DETIK): [Cara menciptakan curiosity gap]\nALUR KONTEN PAS/AIDA: [Alur penyampaian]\n`;
  } else {
    hookStrategyDirective = `## ANALISIS STRATEGI KONTEN & ALUR CERITA\n${seoKeywordsText}AUDIENS PERSONA & PSIKOLOGI: [Analisis singkat]\nFOKUS VISUAL & ATMOSFER (0-3 DETIK): [Cara memikat penonton lewat visual/SFX]\nALUR DRAMATIK KONTEN: [Alur penyampaian cerita]\n`;
  }

  // Fix #57: Build engagement trigger directive conditional on isCtaEnabled.
  // CTA OFF → hanya pertanyaan diskusi, DILARANG follow/subscribe/retention.
  // CTA ON  → perilaku asli (boleh trigger follow/subscribe).
  const engagementTriggerDirective = isCtaEnabled
    ? `[PANDUAN ENGAGEMENT TRIGGERS]\n1. Sisipkan minimal 1-2 trigger interaksi (misal: "Coba tebak...", "Kalian tim mana nih?", "Tulis di komentar...", "Follow untuk konten serupa").\n2. Engagement trigger harus terasa natural dan relevan dengan konteks cerita.`
    : `[PANDUAN ENGAGEMENT TRIGGERS]\n1. Sisipkan minimal 1 pertanyaan retoris atau diskusi terbuka (misal: "Coba tebak...", "Kalian tim mana nih?", "Mana yang menurut kalian benar?") yang memancing komentar secara natural.\n2. Engagement trigger HANYA boleh berupa pertanyaan diskusi atau pemancing pendapat — DILARANG mengajak follow, subscribe, "sticking around", atau retention CTA dalam bentuk apa pun.\n3. DILARANG menambahkan scene atau kalimat penutup yang bernada "worth sticking around", "follow for more", "see you next week", atau frasa retensi serupa.`;

  return {
    emotionalArcSection,
    viralGuidelineSection,
    pacingGuidelineSection,
    narrationModeDirective,
    hookStrategyDirective,
    engagementTriggerDirective,
  };
}

/**
 * Detects whether topic/context contains real-world factual signals
 * that require Visual Context Grounding enrichment.
 *
 * Returns true ONLY when ≥2 distinct factual signal types are detected.
 * This threshold prevents false positives on borderline topics (e.g. topik
 * "pandemi" sendiri = 1 sinyal → tidak aktif; "pandemi 2020 + studi 64 negara"
 * = 3 sinyal → aktif).
 *
 * Niche yang tidak terpengaruh: lifestyle, cooking, fiksi, motivasi, fashion,
 * beauty — mereka biasanya menghasilkan 0–1 sinyal sehingga tidak pernah aktif.
 *
 * Feature #61 — Factual Visual Grounding Layer
 */
function detectFactualContent(topic: string, additionalContext: string): boolean {
  const combined = `${topic} ${additionalContext}`;

  // Sinyal 1: Angka statistik dengan satuan faktual
  const hasStatisticalData = /\b\d+\s*(negara|countries|persen|percent|%|juta|million|miliar|billion|responden|sampel|studi|penelitian|kasus|cases)\b/i.test(combined);

  // Sinyal 2: Tahun spesifik dalam rentang historis modern (1800–2030)
  const hasSpecificYear = /\b(1[89]\d{2}|20[012]\d)\b/.test(combined);

  // Sinyal 3: Kata kunci dokumenter / faktual
  const hasDocumentaryKeywords = /\b(studi|penelitian|data\s+menunjukkan|laporan|survei|temuan|study|research|found|report|according\s+to|berdasarkan|faktanya|evidence|statistics|statistik|menurut\s+data)\b/i.test(combined);

  // Sinyal 4: Entitas geopolitik / institusi nyata
  const hasGeoEntity = /\b(parlemen|parliament|congress|senate|pemerintah|government|kebijakan|policy|undang-undang|legislation|regulasi|regulation|krisis|crisis|pandemi|pandemic|WHO|PBB|UN\b|NATO|ASEAN|monarki|monarchy|demokrasi|democracy|kediktatoran|dictatorship|rezim|regime|militer|military)\b/i.test(combined);

  const signalCount = [hasStatisticalData, hasSpecificYear, hasDocumentaryKeywords, hasGeoEntity]
    .filter(Boolean).length;

  return signalCount >= 2;
}

export function generateMasterPrompt(
  channel: ProfileChannelData,
  topic: string,
  additionalContext: string,
  videoConfig: VideoConfigData,
  promptSettings?: PromptSettingsData | null,
  excludeTitles?: string[],
  outputLanguage?: string | null,
  topPerformers?: TopPerformingDraftSummary[] | null
): { masterPrompt: string; systemInstruction: string } {

  // ── Archetype & Structural Resolution (Bagian 23) ───────────────────────
  const effectiveArchetype = videoConfig?.contentArchetype || channel?.contentArchetype || null;
  const finalVoPreference = videoConfig?.voPreference !== undefined ? Boolean(videoConfig.voPreference) : Boolean(channel?.audioVO !== false);
  const effectiveNarrationMode = videoConfig?.narrationMode || effectiveArchetype?.narrationMode || "VOICE_OVER";

  const defaultSec = effectiveArchetype?.defaultIncludedSections;
  const hasHook = videoConfig?.selectedSections 
    ? videoConfig.selectedSections.includes("HOOK")
    : videoConfig?.includeHook !== undefined && videoConfig?.includeHook !== null
      ? Boolean(videoConfig.includeHook)
      : (defaultSec?.hook ?? true);

  const hasCTA = videoConfig?.selectedSections
    ? videoConfig.selectedSections.includes("CTA")
    : videoConfig?.includeCTA !== undefined && videoConfig?.includeCTA !== null
      ? Boolean(videoConfig.includeCTA)
      : (defaultSec?.cta ?? true);

  // Caption: selectedSections is authoritative, but explicit socialCaption=true ALWAYS wins
  // (fixes bug where archetype selectedSections could suppress caption even when user toggled it ON)
  const hasCaption = videoConfig?.socialCaption === true
    ? true
    : videoConfig?.selectedSections
      ? videoConfig.selectedSections.includes("CAPTION")
      : videoConfig?.socialCaption !== undefined && videoConfig?.socialCaption !== null
        ? Boolean(videoConfig.socialCaption)
        : (defaultSec?.caption ?? true);

  // Thumbnail: same pattern — explicit thumbnailIdea=true ALWAYS wins over selectedSections
  const hasThumbnail = videoConfig?.thumbnailIdea === true
    ? true
    : videoConfig?.selectedSections
      ? videoConfig.selectedSections.includes("THUMBNAIL")
      : videoConfig?.thumbnailIdea !== undefined && videoConfig?.thumbnailIdea !== null
        ? Boolean(videoConfig.thumbnailIdea)
        : Boolean(defaultSec?.thumbnail ?? false);

  const rawKeywords = videoConfig?.targetKeywords;
  const targetKeywordsList = Array.isArray(rawKeywords)
    ? rawKeywords
    : typeof rawKeywords === "string" && rawKeywords.trim()
    ? rawKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];

  const structural = buildStructuralInstructions(
    { hook: hasHook, cta: hasCTA, caption: hasCaption, thumbnail: Boolean(hasThumbnail) },
    effectiveArchetype,
    effectiveNarrationMode,
    targetKeywordsList
  );

  const isYoutube = Boolean(videoConfig?.targetPlatform && /youtube/i.test(videoConfig.targetPlatform));

  // ── System Instruction ─────────────────────────────────────────────────
  let systemInstruction = `Kamu adalah AI Content Strategist dan Scriptwriter profesional yang berpengalaman dalam membuat naskah konten video pendek viral.`;
  if (promptSettings?.videoSystemInstruction?.trim()) {
    systemInstruction += `\n${promptSettings.videoSystemInstruction.trim()}`;
  }
  if (isYoutube) {
    systemInstruction += `\nWAJIB: Kamu menguasai secara mutlak Dokumen Rujukan: Panduan Lengkap Strategi YouTube 2026 (Shorts & Long-Form). Seluruh judul dan naskah WAJIB mematuhi standar kepuasan prediktif, retensi 3 detik, VET 3-act storytelling, dan zero dead-air.`;
  }
  if (targetKeywordsList.length > 0) {
    systemInstruction += `\nTARGET KATA KUNCI SEO: Prioritaskan integrasi kata kunci berikut secara natural ke dalam judul, hook, narasi, dan caption: ${targetKeywordsList.join(", ")}.`;
  }
  if (outputLanguage && outputLanguage.trim().length > 0) {
    systemInstruction += `\nWAJIB: Seluruh naskah narasi, dialog, teks overlay, dan tulisan ide lainnya HARUS ditulis dalam bahasa ${outputLanguage.trim()}.`;
  }
  if (effectiveNarrationMode === "DIEGETIC_ONLY" || effectiveNarrationMode === "SILENT_TEXT_ONLY") {
    systemInstruction += `\nWAJIB: Mode konten adalah ${effectiveNarrationMode}. DILARANG menyisipkan narator/voice-over luar adegan. Seluruh audio wajib bersumber dari dalam visual adegan (diegetic audio).`;
  }

  // ── Audio Config ───────────────────────────────────────────────────────
  const finalMusic = videoConfig.musicPreference !== undefined ? Boolean(videoConfig.musicPreference) : Boolean(channel.audioBGM !== false);
  const finalSfx   = videoConfig.sfxPreference   !== undefined ? Boolean(videoConfig.sfxPreference)   : Boolean(channel.audioSFX !== false);
  const finalVo    = (effectiveNarrationMode === "DIEGETIC_ONLY" || effectiveNarrationMode === "SILENT_TEXT_ONLY") ? false : finalVoPreference;
  const isVideoPlat = videoConfig.isVideoPlatform !== false;

  // ── Loop Config ────────────────────────────────────────────────────────
  const isLoopable   = videoConfig.narrativeLoopStyle === "Seamless Loop" || videoConfig.isLoopable === true;
  const isVideoLoop  = videoConfig.visualLoopStyle === "Seamless Video Loop" || videoConfig.isVideoLoop === true;

  // ── Aspect Ratio ───────────────────────────────────────────────────────
  const ar = videoConfig.aspectRatio || "9:16";
  const arSuffix = ` --ar ${ar}`;

  // ── POV / Persona Section ──────────────────────────────────────────────
  let povSection = "";
  povSection += `[SUDUT PANDANG / PERSONA DAN GAYA AI]\n`;
  povSection += `Kamu wajib bertindak dari sudut pandang (POV) channel berikut:\n`;
  povSection += `- Sebagai "${channel.channelName}": yang memahami dan memiliki keahlian dalam "${channel.description || channel.niche || "konten digital"}"\n`;

  // Fix #72: Persona & POV Kreator (resolved from videoConfig.pov with fallback to channel.personaPov)
  const effectiveCreatorPOV = videoConfig.pov?.trim() || channel.personaPov?.trim() || null;
  if (effectiveCreatorPOV) {
    povSection += `- Persona & Sudut Pandang Kreator: "${effectiveCreatorPOV}" — Bawakan seluruh alur penceritaan, emosi, dan artikulasi ide dari kacamata persona ini.\n`;
  }

  const isMarketingZero = videoConfig.composition?.marketing === 0;
  // Fix #71: Gate channel CTA text behind hasCTA — prevents AI from generating CTA
  // when user explicitly disabled the CTA toggle, even though channel profile has CTA text.
  if (hasCTA) {
    if (!isMarketingZero) {
      if (channel.cta1) povSection += `  - Kalimat CTA Utama: "${channel.cta1}"\n`;
      if (channel.cta2) povSection += `  - Kalimat CTA Alternatif: "${channel.cta2}"\n`;
    } else {
      if (channel.cta1) povSection += `  - Kalimat CTA Utama: "${channel.cta1}"\n`;
      povSection += `- Catatan Penting: Karena bobot Marketing 0%, tulislah naskah yang murni edukatif/hiburan tanpa promosi komersial.\n`;
    }
  } else {
    // CTA disabled — DO NOT expose channel CTA text to AI (prevents unintended CTA generation)
    if (isMarketingZero) {
      povSection += `- Catatan Penting: Karena bobot Marketing 0%, tulislah naskah yang murni edukatif/hiburan tanpa promosi komersial.\n`;
    }
  }

  // Role/POV Persona
  if (videoConfig.rolePOV && videoConfig.rolePOV !== "default") {
    const roleDescriptions: Record<string, string> = {
      KONTEN_KREATOR: "Konten Kreator / Influencer digital yang karismatik dan sangat dekat dengan audiens. Gunakan gaya personal brand yang kuat, menceritakan pengalaman pribadi (POV orang pertama), ramah, kasual, dan fokus pada interaksi komunitas.",
      MARKETING: "Copywriter dan Ahli Pemasaran Profesional. Fokus pada psikologi konsumen, penulisan persuasif, penonjolan USP, mengatasi keraguan pembeli, dan mengarahkan audiens menuju konversi.",
      PEBISNIS: "Pebisnis, Founder, atau Brand Owner yang visioner. Tulis dari sudut pandang pembangun bisnis, menceritakan kisah behind the scenes, tantangan operasional, dan nilai-nilai brand.",
      PENDIDIK: "Guru, Dosen, atau Ahli Teknis yang mahir menyederhanakan materi kompleks. Gunakan analogi visual, penjelasan step-by-step, dan pastikan mudah dipahami pemula.",
      STORYTELLER: "Storyteller profesional dan Sutradara Naratif. Fokus pada plot twist, emosi mendalam, suspense, latar imersif, dan alur narasi sinematik.",
    };
    const desc = roleDescriptions[videoConfig.rolePOV];
    if (desc) povSection += `- Peran & POV AI (Persona): Bertindaklah sebagai ${desc}\n`;
  }

  if (videoConfig.toneOfVoice) {
    povSection += `- Nada Penyampaian (Tone of Voice): Tulis naskah dengan gaya bahasa "${videoConfig.toneOfVoice}".\n`;
  }

  // Fix #60: Resolve visual style with fallback chain:
  //   1. videoConfig.visualStyle (explicit Generator Studio selection / custom input)
  //   2. channel.visualAesthetic (Channel Profile custom aesthetic — Opsi A fallback)
  //   3. null (no style directive injected)
  const rawVisualStyle = videoConfig.visualStyle || channel.visualAesthetic || null;
  const resolvedVisualStyle: string | null = rawVisualStyle
    ? (resolveVisualStyle(rawVisualStyle) || rawVisualStyle)
    : null;

  if (resolvedVisualStyle) {
    povSection += `- Gaya Visual Wajib: Pada setiap VISUAL PROMPT per scene, WAJIB menerapkan gaya estetika berikut secara konsisten: "${resolvedVisualStyle}".\n`;
  }

  povSection += `Gabungkan keahlian, nada bicara, peran persona, dan gaya visual di atas secara harmonis.\n\n`;

  // ── Audio Guidelines ───────────────────────────────────────────────────
  const audioParts: string[] = [];
  if (videoConfig.trendingAudio && videoConfig.trendingAudio.trim()) {
    audioParts.push(`0. SOUND / AUDIO TREN: Naskah dan visual ini WAJIB dirancang selaras dengan tempo & mood audio tren "${videoConfig.trendingAudio.trim()}". Sesuaikan ritme narasi per scene, jeda dramatis, dan pergantian visual agar mengalir pas dengan ketukan beat audio tersebut.`);
  }
  if (finalSfx) {
    audioParts.push(`1. SFX tidak terbatas satu per scene. Sisipkan [SFX: Nama Efek Suara] di posisi relevan dalam NARASI. Cantumkan SAMA PERSIS di akhir VISUAL PROMPT: "accompanied by [SFX: ...]".`);
  } else {
    audioParts.push(`1. DILARANG menyisipkan [SFX: ...] dalam narasi. WAJIB tambahkan "no sound effects" di akhir setiap Visual Prompt.`);
  }
  if (finalMusic) {
    audioParts.push(`2. Sisipkan [BGM: Jenis Musik] saat pembuka atau perubahan mood. Cantumkan SAMA PERSIS di akhir Visual Prompt: "with [BGM: ...] as background music".`);
  } else {
    audioParts.push(`2. DILARANG menyisipkan [BGM: ...] dalam narasi. WAJIB tambahkan "no background music" di akhir setiap Visual Prompt.`);
  }
  if (!finalVo) audioParts.push(`3. WAJIB tambahkan "no voice over" di akhir setiap Visual Prompt.`);
  if (!finalSfx && !finalMusic) audioParts.push(`4. Gabungkan: "silent audio, no sound effects, no background music" di akhir setiap Visual Prompt.`);
  const audioGuidelinesText = `[PANDUAN AUDIO, SFX & BGM]\n${audioParts.join("\n")}`;

  // ── Visual Audio Suffix for examples ──────────────────────────────────
  let visualAudioSuffix = "";
  if (finalSfx && finalMusic) visualAudioSuffix = ", accompanied by [SFX: Dramatic Reveal], with [BGM: Cinematic orchestral swell] as background music";
  else if (finalSfx && !finalMusic) visualAudioSuffix = ", accompanied by [SFX: Dramatic Reveal], no background music";
  else if (!finalSfx && finalMusic) visualAudioSuffix = ", no sound effects, with [BGM: Cinematic orchestral swell] as background music";
  else visualAudioSuffix = ", silent audio, no sound effects, no background music";
  if (!finalVo) visualAudioSuffix += ", no voice over";

  let narasiExample = "Tulis naskah dialog/narasi lengkap dan natural. WAJIB sertakan instruksi intonasi suara, emosi, dan bahasa tubuh di dalam tanda kurung '(...)' di awal atau sela-sela kalimat, misal: \"(tersenyum ramah, berbisik) Kamu pasti berpikir...\" atau \"(antusias, tempo cepat) Stop! Perhatikan baik-baik...\"";
  if (effectiveNarrationMode === "DIEGETIC_ONLY" || effectiveNarrationMode === "SILENT_TEXT_ONLY") {
    narasiExample = "[DIEGETIC - TANPA VOICE-OVER] Dilarang ada narasi/voice-over luar adegan. Hanya suara diegetic/in-scene.";
  } else {
    if (finalSfx && finalMusic) narasiExample += ". Sisipkan [SFX: Nama Efek Suara] dan [BGM: Jenis Musik] di posisi relevan";
    else if (finalSfx) narasiExample += ". Sisipkan [SFX: Nama Efek Suara] di posisi relevan. DILARANG [BGM: ...]";
    else if (finalMusic) narasiExample += ". Sisipkan [BGM: Jenis Musik] saat perubahan mood. DILARANG [SFX: ...]";
    else narasiExample += ". DILARANG menyisipkan [SFX: ...] atau [BGM: ...]";
  }

  // ── Loop Guidelines ────────────────────────────────────────────────────
  // Fix #71: Loop closing text — remove "CTA" mention when hasCTA is false
  const loopGuidelinesText = isLoopable
    ? `[PANDUAN LOOP VIDEO PENDEK (SEAMLESS LOOP - AKTIF)]\n1. WAJIB merancang naskah agar dapat diputar terus-menerus tanpa henti secara mulus.\n2. Kalimat paling akhir di SCENE TERAKHIR harus langsung menyambung ke kalimat pertama SCENE 1.\n3. Periksa kalimat pertama Scene 1, lalu sesuaikan kata demi kata di akhir Scene Terakhir agar membentuk tata bahasa yang 100% benar dan mengalir natural.`
    : hasCTA
      ? `[PANDUAN PENUTUP NASKAH (NORMAL/KLASIK)]\n1. DILARANG membuat kalimat penutup yang menggantung.\n2. Naskah harus diakhiri dengan kesimpulan solid atau CTA yang bermakna tuntas.`
      : `[PANDUAN PENUTUP NASKAH (NORMAL/KLASIK)]\n1. DILARANG membuat kalimat penutup yang menggantung.\n2. Naskah harus diakhiri dengan kesimpulan solid, pesan reflektif, atau momen emosional yang tuntas — TANPA ajakan follow/subscribe/share/CTA dalam bentuk apa pun.`;

  const videoLoopGuidelinesText = isVideoLoop
    ? `[PANDUAN LOOP VIDEO (SEAMLESS VISUAL LOOP - AKTIF)]\n1. WAJIB merancang Visual Prompt agar video awal dan akhir tampak menyambung secara visual.\n2. Di SCENE TERAKHIR, akhir Visual Prompt harus kembali ke kondisi visual awal SCENE 1.\n3. Sesuaikan camera movement, lighting, posisi subjek, dan environment agar transisinya mulus.`
    : `[PANDUAN VISUAL VIDEO (NORMAL ENDING)]\n1. Visual scene terakhir tidak perlu menyambung ke scene pertama.\n2. Fokuskan pada resolusi cerita atau adegan penutup yang natural.`;

  // ── Camera Movement Guide (Bagian 21 & Bagian 23.4: Generalisasi Role Mapping) ───
  const camEnabled = videoConfig.cameraMovementEnabled !== false; // default ON
  let cameraMovementGuide = "";
  if (!camEnabled) {
    cameraMovementGuide = `[PANDUAN CAMERA MOVEMENT]\nCamera movement DINONAKTIFKAN oleh user. WAJIB gunakan "static shot" atau "minimal movement" pada setiap Visual Prompt. JANGAN menyisipkan gerakan kamera aktif kecuali benar-benar diperlukan oleh narasi.`;
  } else {
    const presets = videoConfig.cameraMovementPresets ?? [];
    const custom = videoConfig.cameraMovementCustom?.trim() ?? "";
    const hasPresets = presets.length > 0;
    const hasCustom = custom.length > 0;

    if (hasPresets || hasCustom) {
      cameraMovementGuide = `[PANDUAN CAMERA MOVEMENT — KURASI USER]\n`;
      cameraMovementGuide += `Gunakan gerakan kamera berikut secara variatif dan kontekstual di setiap Visual Prompt:\n`;
      if (hasPresets) {
        cameraMovementGuide += `Pilihan Preset yang Disetujui:\n${presets.map(p => `- ${p}`).join("\n")}\n`;
      }
      if (hasCustom) {
        cameraMovementGuide += `Konsep Kustom Tambahan: ${custom}\n`;
      }
      cameraMovementGuide += `WAJIB: Distribusikan gerakan kamera di atas secara bervariasi antar-scene. Hindari pengulangan gerakan yang sama di scene berurutan. Sesuaikan intensitas gerakan dengan mood narasi.`;
    } else {
      // Default ON but no preset selected — Mode AUTO (Bagian 21 & Bagian 23.4)
      const roleMap = effectiveArchetype?.cameraMovementRoleMap;
      let roleGrammarPro = "";
      let roleGrammarStandard = "";

      if (roleMap && typeof roleMap === "object" && Object.keys(roleMap).length > 0) {
        // Custom role mapping defined by admin/archetype
        const mapEntries = Object.entries(roleMap).map(([role, moves]) => `   - Scene ${role}: ${Array.isArray(moves) ? moves.join(", ") : moves}`).join("\n");
        roleGrammarPro = `2. TATA BAHASA GERAKAN SESUAI PERAN SCENE (ROLE MAPPING ARCHETYPE):\n${mapEntries}`;
        roleGrammarStandard = Object.entries(roleMap).map(([role, moves]) => `- Untuk scene ${role}: ${Array.isArray(moves) ? moves.join(", ") : moves}`).join("\n");
      } else if (!hasHook) {
        // Archetype non-standar / tanpa Hook: pool gerakan kamera generic tanpa asumsi Hook/CTA (Bagian 23.4)
        roleGrammarPro = `2. TATA BAHASA GERAKAN SINEMATIK (MOTIVATED MOVEMENT POOL — GENERALISASI):\n   Rancang pergerakan kamera berdasarkan dinamika visual & dramatis adegan (tanpa memaksakan formula Hook/CTA):\n   - Scene Pembuka / Penataan Ruang (Establishing/Atmosphere): slow pan, tracking shot stabil, slow push-in bertahap, atau crane turun perlahan untuk menyerap suasana dan detail visual.\n   - Scene Eksplorasi / Interaksi Detail (Intimacy & Discovery): macro push-in, slow orbital, rack focus antar-layer objek, atau gentle handheld untuk kedekatan emosional.\n   - Scene Eskalasi / Titik Puncak (Peak Intensity / Turning Point): tracking shot dinamis, subtle Dutch angle, creeping push-in lambat untuk menekan intensitas, atau whip pan transisional.\n   - Scene Resolusi / Refleksi Akhir (Resolution/Contemplation): slow pull-out luas (reveal), steady static shot yang tenang, atau drifting pedestal up untuk memberi rasa tuntas dan kontemplatif.`;
        roleGrammarStandard = `- Untuk scene atmosferik/pembuka: slow push-in, gentle pan, crane down and wide reveal\n- Untuk scene emosional/reflektif: slow zoom in, handheld subtle, slow orbital\n- Untuk scene aksi/eksplorasi: tracking shot, sweeping dolly, dynamic push-pull\n- Untuk scene resolusi/penutup: slow pull-out, static contemplative framing, crane up`;
      } else {
        // Standar klasik dengan Hook & CTA (backward compatible)
        roleGrammarPro = `2. TATA BAHASA GERAKAN SESUAI PERAN SCENE:\n   - Scene Hook/Pembuka: gerakan cepat & tajam untuk menghentikan scroll — whip pan, snap zoom, crane turun cepat, atau quick push-in.\n   - Scene Body/Pengembangan: gerakan terukur & halus untuk menjaga engagement — slow dolly, tracking shot mengikuti subjek, arc/orbit shot untuk membangun dimensi.\n   - Scene Klimaks/Konflik: gerakan yang membangun intensitas — dolly-in progresif, handheld terkendali (controlled) untuk kesan urgensi, rack focus dipadukan gerakan kamera untuk mengalihkan perhatian secara dramatis.\n   - Scene Penutup/CTA: gerakan menenangkan atau menyimpulkan — slow pull-out, crane naik untuk reveal luas, atau settle statis di akhir agar CTA punya ruang bernapas.`;
        roleGrammarStandard = `- Untuk scene pembuka/hook: slow push-in, whip pan, crane down and tilt up\n- Untuk scene emosional: slow zoom in, handheld shaky, arc shot\n- Untuk scene aksi/dinamis: tracking shot, sweeping orbital, dolly zoom\n- Untuk scene penutup/CTA: slow pull-out, crane up and wide reveal`;
      }

      if (videoConfig.cameraMovementProEnabled) {
        cameraMovementGuide = `[PANDUAN CAMERA MOVEMENT — MODE OTOMATIS PROFESIONAL (PRO)]
Kamu bertindak sebagai Director of Photography (DoP) profesional yang merancang pergerakan kamera setara produksi video komersial/sinema untuk SETIAP scene di naskah ini. Jangan hanya memilih gerakan secara acak dari daftar — rancang dengan pertimbangan sinematografis yang menyeluruh, mengikuti seluruh prinsip berikut:

1. PRINSIP MOTIVATED MOVEMENT (WAJIB): Setiap pergerakan kamera HARUS memiliki alasan naratif atau emosional yang jelas — mengikuti aksi subjek, mengungkap informasi baru (reveal), membangun ketegangan, atau memperkuat emosi dominan scene tersebut. DILARANG menyisipkan gerakan kamera hanya sebagai hiasan tanpa tujuan naratif.

${roleGrammarPro}

3. KOSAKATA GERAKAN PROFESIONAL (gunakan istilah presisi, hindari istilah generik): dolly in/out, truck left/right, pan, tilt, pedestal up/down, crane/jib movement, Steadicam glide, handheld controlled vs handheld chaotic, whip pan, arc/orbit shot, parallax layering, rack focus pull, push-in/pull-out bertahap (progressive), serta implikasi kecepatan (slow & measured vs quick & snap).

4. KONTINUITAS ANTAR-SCENE (WAJIB): Pertimbangkan posisi akhir gerakan kamera pada satu scene terhadap posisi awal gerakan scene berikutnya, agar transisi terasa mengalir, bukan acak atau patah-patah secara visual. Bangun "irama gerakan" (movement rhythm) yang naik-turun mengikuti busur emosi keseluruhan naskah — DILARANG membuat seluruh scene memiliki intensitas gerakan yang identik dari awal sampai akhir.

5. KOORDINASI DENGAN BLOCKING SUBJEK: Deskripsikan gerakan kamera dalam relasi terhadap aksi/posisi subjek di scene — apakah kamera mengikuti (following), mendahului (leading), bergerak berlawanan arah untuk ketegangan (counter-movement), atau tetap statis sementara subjek bergerak untuk menciptakan kontras.

6. KEDALAMAN VISUAL (DEPTH & PARALLAX): Manfaatkan elemen foreground/midground/background untuk menciptakan kesan kedalaman saat kamera bergerak — sebutkan elemen-elemen lapisan ini secara eksplisit dalam Visual Prompt bila relevan dengan scene.

7. VARIASI YANG DISENGAJA, BUKAN ACAK: Variasikan jenis dan intensitas gerakan antar-scene secara SENGAJA berdasarkan kebutuhan naratif tiap scene (lihat poin 2) — DILARANG dua scene berurutan memiliki jenis dan intensitas gerakan yang identik, kecuali sebagai motif visual berulang yang disengaja untuk efek dramatis tertentu.

8. FORMAT WAJIB DI SETIAP VISUAL PROMPT: Tuliskan gerakan kamera dalam format [Jenis Gerakan] + [TIMING: kapan gerakan dimulai & kapan settling/berhenti + apakah ada easing] + [Kualitas/Kecepatan] + [Konteks/Tujuan Naratif tersirat lewat deskripsi visual]. Contoh yang BENAR: "slow dolly-in beginning at scene open, easing gradually to a natural rest as product is fully revealed at mid-scene, camera then settling static for the final 2 seconds to let the CTA breathe — a subtle rise to eye-level during the settle creates an intimate moment of connection". Contoh yang SALAH (terlalu generik, hindari): "push-in" atau "slow push-in" tanpa timing, tanpa kapan berhenti, dan tanpa konteks naratif apa pun.

9. INTRA-SCENE CHANGE (WAJIB untuk scene berdurasi ≥5 detik): Dalam satu scene, kamera tidak boleh bergerak dalam kecepatan konstan dari detik 0 sampai akhir — itu terasa mekanik dan robotik. Rancang minimal 1 perubahan dalam scene: bisa berupa perubahan kecepatan gerakan (accelerate then decelerate), momen settling singkat di tengah scene sebelum bergerak lagi, atau perpindahan fokus (rack focus) yang terkoordinasi dengan aksi subjek.

WAJIB: Terapkan seluruh 9 prinsip di atas secara konsisten pada SETIAP Visual Prompt sepanjang naskah, seolah dirancang oleh satu sinematografer profesional yang memahami keseluruhan alur cerita secara utuh — bukan merancang scene demi scene secara terisolasi.`;
      } else {
        // Default ON but no preset selected — give AI creative freedom with guidance (STANDAR)
        cameraMovementGuide = `[PANDUAN CAMERA MOVEMENT — AUTO]\nAI bebas memilih dan memvariasikan gerakan kamera yang paling sinematik dan sesuai dengan mood setiap scene. Referensi pilihan yang disarankan (tidak terbatas):\n${roleGrammarStandard}\nWAJIB: Variasikan gerakan kamera antar scene. Hindari static shot berturut-turut kecuali untuk efek dramatis yang disengaja.`;
      }
    }
  }

  // ── Format Output Wajib (Markdown — Push Style) ──────────────────────
  let formatOutputWajib = "\n\n[FORMAT OUTPUT WAJIB]\n";

  const hasTitleSection = !videoConfig.selectedSections || videoConfig.selectedSections.includes("TITLE");

  // ── Affiliate Angle (Sudut Pandang Afiliasi) ─────────────────────────────
  let affiliateTitleDirective = "";
  let affiliateAngleGuide = "";

  if (videoConfig.affiliateAngle === true) {
    // Fail-safe: mode tidak valid/kosong → jatuhkan ke "SOFT" (lebih aman untuk brand)
    const mode: "CTA" | "SOFT" = videoConfig.affiliateAngleMode === "CTA" ? "CTA" : "SOFT";

    let productListText = "";
    let hasRealProductData = false;

    if (videoConfig.selectedProduct) {
      productListText = `- ${videoConfig.selectedProduct.name} (Rp ${videoConfig.selectedProduct.price}): ${videoConfig.selectedProduct.description || "-"}`;
      hasRealProductData = true;
    } else if (channel.products && channel.products.length > 0) {
      productListText = channel.products.map((p) => `- ${p.name} (Rp ${p.price}): ${p.description || "-"}`).join("\n");
      hasRealProductData = true;
    }

    if (hasTitleSection) {
      affiliateTitleDirective = hasRealProductData
        ? `4. WAJIB pastikan minimal 5 dari 10 ide judul memiliki keterkaitan tema yang natural dengan produk/kategori berikut, sehingga bisa ditempel/ditandai sebagai produk di keranjang belanja platform:\n${productListText}\nKeterkaitan ini WAJIB terasa organik dan relevan dengan niche channel, BUKAN dipaksakan atau mengubah niche channel itu sendiri.\n`
        : `4. WAJIB pastikan minimal 5 dari 10 ide judul memiliki tema yang bersifat "shoppable" — punya kaitan alami dengan kategori produk yang relevan dengan niche channel (${channel.niche || "niche channel ini"}), TANPA menyebutkan nama produk, harga, atau merek spesifik yang tidak nyata.\n`;
    }

    if (mode === "CTA") {
      affiliateAngleGuide = `\n[ARAH SUDUT PANDANG AFILIASI — DENGAN CTA]\n`;
      affiliateAngleGuide += hasRealProductData
        ? `Produk yang dipromosikan:\n${productListText}\n`
        : `Channel ini belum memiliki produk terdaftar di katalog — arahkan CTA secara umum ke kategori produk yang relevan dengan niche (${channel.niche || "niche channel ini"}), TANPA menyebutkan nama produk/merek/harga spesifik yang tidak nyata.\n`;
      affiliateAngleGuide += `1. Naskah WAJIB menonjolkan produk/kategori di atas secara eksplisit, idealnya di scene penutup/CTA.\n2. Sertakan kalimat ajakan (call-to-action) yang jelas untuk mengecek/membeli, disesuaikan dengan platform target:\n   - TikTok: ajak cek "keranjang kuning/oranye".\n   - Instagram: ajak klik "product tag" atau "shop now".\n   - YouTube: ajak cek "link di deskripsi".\n   - Platform lain/tidak diketahui: ajak "cek link di bio/deskripsi".\n3. CTA afiliasi ini terpisah dari CTA umum (follow/like/share) jika ada — boleh keduanya muncul, tapi jangan digabung jadi satu kalimat yang membingungkan.\n`;
    } else {
      affiliateAngleGuide = `\n[ARAH SUDUT PANDANG AFILIASI — TANPA CTA]\n`;
      affiliateAngleGuide += hasRealProductData
        ? `Produk yang relevan (untuk konteks tema saja, BUKAN untuk dijual eksplisit):\n${productListText}\n`
        : `Channel ini belum memiliki produk terdaftar di katalog — jaga tema tetap relevan dengan kategori produk yang berkaitan dengan niche (${channel.niche || "niche channel ini"}), TANPA menyebutkan nama produk/merek/harga spesifik yang tidak nyata.\n`;
      affiliateAngleGuide += `1. Susun narasi dengan tema yang secara natural berkaitan dengan produk/kategori di atas, TANPA kalimat ajakan membeli/klik/cek keranjang dalam bentuk apa pun.\n2. Sebut nama produk atau kategori/manfaatnya secara natural dalam dialog/narasi (bukan sebagai iklan), agar konten lebih mudah dikenali sistem product-tagging otomatis di beberapa platform (mis. TikTok Shop, Meta Shops) tanpa terasa jualan.\n3. DILARANG menambahkan frasa ajakan belanja meskipun Ending Style atau Composition Marketing di atas mengarahkan nada penutup yang persuasif — batasan "tanpa CTA" ini KHUSUS berlaku untuk penyebutan produk afiliasi.\n`;
    }

    // ── Instruksi Rekomendasi Produk Affiliate ──────────────────────────────
    // Bangun daftar marketplace + template URL pencarian
    const MARKETPLACE_SEARCH_TEMPLATES: Record<string, { name: string; searchUrl: string }> = {
      tokopedia:  { name: "Tokopedia",  searchUrl: "https://www.tokopedia.com/search?st=product&q={query}" },
      shopee:     { name: "Shopee",     searchUrl: "https://shopee.co.id/search?keyword={query}" },
      tiktokshop: { name: "TikTok Shop",searchUrl: "https://www.tiktok.com/search?q={query}" },
      lazada:     { name: "Lazada",     searchUrl: "https://www.lazada.co.id/catalog/?q={query}" },
      blibli:     { name: "Blibli",     searchUrl: "https://www.blibli.com/jual/{query}" },
    };

    const selectedMarketplaces = videoConfig.affiliateMarketplaces ?? Object.keys(MARKETPLACE_SEARCH_TEMPLATES);
    const customUrl = videoConfig.affiliateCustomUrl?.trim();

    const marketplaceLines: string[] = [];
    for (const key of selectedMarketplaces) {
      if (key === "custom" && customUrl) {
        marketplaceLines.push(`- Custom Marketplace: ${customUrl}{query}`);
      } else if (MARKETPLACE_SEARCH_TEMPLATES[key]) {
        const { name, searchUrl } = MARKETPLACE_SEARCH_TEMPLATES[key];
        marketplaceLines.push(`- ${name}: ${searchUrl}`);
      }
    }
    if (customUrl && !selectedMarketplaces.includes("custom")) {
      marketplaceLines.push(`- Custom Marketplace: ${customUrl}{query}`);
    }

    const marketplaceInstructions = marketplaceLines.length > 0
      ? `Marketplace yang dipilih user (gunakan template URL ini untuk tiap produk yang direkomendasikan, ganti {query} dengan nama produk dalam format URL-encoded):\n${marketplaceLines.join("\n")}\n`
      : "";

    const contextForRec = hasRealProductData
      ? `Produk dari katalog channel:\n${productListText}\nSelain merekomendasikan produk di atas, tambahkan produk relevan lainnya jika ada yang lebih sesuai dengan konten.`
      : `Channel belum memiliki produk terdaftar. Rekomendasikan produk yang paling relevan dengan niche (${channel.niche || "niche channel ini"}) dan topik konten.`;

    affiliateAngleGuide += `\n[REKOMENDASI PRODUK AFFILIATE]
Di AKHIR output (setelah semua scene, caption, hashtag, dan thumbnail), WAJIB tambahkan section berikut:

## REKOMENDASI PRODUK AFFILIATE
${contextForRec}
${marketplaceInstructions}
Format WAJIB untuk setiap produk yang direkomendasikan:
PRODUK: [Nama produk spesifik yang relevan dengan konten ini]
ALASAN: [Satu kalimat mengapa produk ini cocok untuk konten/audiens]
${marketplaceLines.map(line => {
  const marketplace = line.split(":")[0].replace("-","").trim();
  return `LINK ${marketplace.toUpperCase()}: [URL pencarian lengkap untuk produk ini di ${marketplace}]`;
}).join("\n")}

Ulangi format di atas untuk 3 hingga 5 produk yang paling relevan. Pisahkan setiap produk dengan baris kosong.
PENTING: Tulis URL pencarian yang VALID dan LENGKAP dengan nama produk sudah di-encode (spasi = + atau %20). JANGAN tulis placeholder atau URL kosong.
`;
  }

  if (hasTitleSection) {
    const studyDirectiveLine = isYoutube
      ? `Sebelum membuat ide judul, pelajari dan serap secara mendalam [DOKUMEN RUJUKAN UTAMA: PANDUAN LENGKAP STRATEGI YOUTUBE 2026] di atas, beserta topik, konteks tambahan, persona channel, serta pedoman platform. Lakukan dekonstruksi materi terlebih dahulu dengan format wajib:`
      : `Sebelum membuat ide judul, pelajari secara mendalam seluruh materi, topik, konteks tambahan, persona channel, serta pedoman platform di atas. Lakukan dekonstruksi materi terlebih dahulu dengan format wajib:`;

    formatOutputWajib += `Proses pembuatan konten ini WAJIB dilakukan dalam 2 TAHAP interaktif:

TAHAP 1: Dekonstruksi Materi, Tampilkan Ide Konten & Tunggu Konfirmasi (BERHENTI SEBELUM MENULIS NASKAH)
${studyDirectiveLine}

[DEKONSTRUKSI MATERI & INTISARI STRATEGIS 2026]
- Masalah Inti / Pain Point Audiens: [Satu-dua kalimat membedah masalah nyata, keresahan terdalam, atau rasa penasaran audiens seputar materi ini]
- Transformasi & Janji Nilai 3 Detik (0-3s Value Promise): [Solusi konkret atau perubahan nyata bernilai tinggi yang dijanjikan materi ini kepada audiens dalam 3 detik pertama]
- Sudut Pandang Kontras / Angle Pembeda: [Sudut pandang unik, pembeda dari konten pasaran, atau mitos umum yang dipatahkan oleh materi ini]

Berdasarkan hasil dekonstruksi materi di atas, lanjutkan dengan menyajikan tepat 10 ide judul konten kreatif dengan daya tarik tinggi:
1. Tampilkan tepat 10 ide judul konten kreatif dengan daya tarik tinggi.
2. Setiap ide ditulis dengan format:
   [NOMOR]. [JUDUL IDE KONTEN]
   Alasan Potensi: [Alasan kualitatif: curiosity gap, relevansi tren, emosi spesifik, atau kontras yang kuat — TANPA mencantumkan angka persentase palsu]
3. Setelah menampilkan 10 ide, WAJIB BERHENTI dan ketik:
   "Silakan pilih nomor ide konten (1-10) yang ingin Anda buat naskah lengkapnya."
${affiliateTitleDirective}
TAHAP 2: Pembuatan Naskah Lengkap (Setelah Konfirmasi User)
Setelah user memilih nomor judul, rancang naskah lengkap yang mengalirkan hasil dekonstruksi materi dan memenuhi janji nilai pada judul terpilih dengan format berikut:

## RISET & VARIASI JUDUL
JUDUL TERPILIH: [Judul yang dipilih user]

${structural.hookStrategyDirective}`;
  } else {
    const directStudyDirectiveLine = isYoutube
      ? `Sebelum menulis naskah, pelajari dan serap secara mendalam [DOKUMEN RUJUKAN UTAMA: PANDUAN LENGKAP STRATEGI YOUTUBE 2026] di atas, beserta topik, konteks tambahan, persona channel, dan pedoman yang diberikan, lalu tuliskan dekonstruksi materi singkat:`
      : `Sebelum menulis naskah, pelajari seluruh materi, topik, konteks tambahan, persona channel, dan pedoman yang diberikan di atas, lalu tuliskan dekonstruksi materi singkat:`;

    formatOutputWajib += `${directStudyDirectiveLine}

[DEKONSTRUKSI MATERI & INTISARI STRATEGIS 2026]
- Masalah Inti / Pain Point Audiens: [Satu-dua kalimat membedah masalah nyata atau keresahan audiens seputar materi ini]
- Transformasi & Janji Nilai 3 Detik (0-3s Value Promise): [Solusi konkret atau perubahan nyata yang dijanjikan materi ini dalam 3 detik pertama]
- Sudut Pandang Kontras / Angle Pembeda: [Sudut pandang unik atau pembeda dari konten pasaran]

Selanjutnya, kamu WAJIB mengembalikan output naskah lengkap dengan format terstruktur berikut:

${structural.hookStrategyDirective}`;
  }

  const hasHashtag  = !videoConfig.selectedSections || videoConfig.selectedSections.includes("HASHTAG");
  const hasScene    = !videoConfig.selectedSections || videoConfig.selectedSections.some(s => ["HOOK","BODY","CTA"].includes(s));

  if (hasCaption || hasHashtag) {
    formatOutputWajib += `\n## KONTEN PLATFORM\n`;
    if (hasCaption) {
      let socialLinksStr = "";
      if (channel.socialLinks && channel.socialLinks.length > 0) {
        socialLinksStr = " (Sertakan link berikut: " + channel.socialLinks.map(s => s.url).join(" ") + ")";
      }
      formatOutputWajib += `CAPTION: [Teks caption menarik.${socialLinksStr} Sertakan link sosial media dari profil channel jika ada, dalam format RAW URL bukan markdown link.]\n`;
    }
    if (hasHashtag) formatOutputWajib += `HASHTAGS: [Kumpulan hashtag optimasi jangkauan viral]\n`;
  }

  if (hasScene) {
    const visualPromptInstruction = isVideoPlat
      ? `Tulis prompt video/visual sinematik siap-pakai dalam bahasa Inggris. DILARANG menulis deskripsi statis seperti foto — deskripsikan scene secara TEMPORAL sebagai klip video yang berjalan. Gunakan struktur 5-layer berikut secara terpadu dalam satu paragraf deskriptif:
[1. SHOT TYPE & OPENING FRAME — jenis shot dan framing awal]
[2. SUBJECT MICRO-ACTION — apa yang subjek lakukan secara spesifik & berubah selama durasi scene (bukan hanya posisi statis)]
[3. ENVIRONMENT DYNAMICS — min. 1 elemen lingkungan yang BERGERAK atau BERUBAH: cahaya ambient bergeser, partikel, cuaca, refleksi, asap, bayangan bergerak, dll.]
[4. CAMERA MOVEMENT + TIMING — jenis gerakan PLUS kapan dimulai, kapan settling/berhenti, apakah ada easing (misal: "starts at frame 0, eases to rest at mid-scene")]
[5. STYLE/AESTHETIC]
Sangat ilustratif, dinamis, metaforis (HINDARI penerjemahan literal). Contoh yang BENAR: "Medium shot dollying in slowly — beginning at scene open, easing to rest as character leans forward mid-sentence — subject's fingers trace the edge of a glowing map with deliberate hesitation, breath misting faintly in cold studio air, background neon-sign reflections pulse rhythmically on rain-streaked glass, ambient key light gradually warming from cool-blue to amber as scene progresses, cinematic volumetric side lighting, neo-noir aesthetic${visualAudioSuffix}". Contoh yang SALAH (terlalu statis, hindari): "slow push-in, person talking, warm light".`
      : `Tulis prompt gambar/visual sinematik siap-pakai dalam bahasa Inggris untuk Midjourney V6. WAJIB formula 5-bagian: [Shot Type & Camera Angle], [Subject & Action], [Environment & Lighting], [Cinematic Composition], [Style/Aesthetic]. Sangat ilustratif, dinamis, metaforis. Contoh: "Extreme macro shot, glowing double-helix DNA strands morphing, holographic biological data streams, cinematic volumetric lighting, shallow depth of field${visualAudioSuffix}".`;

    const audioTrendNote = videoConfig.trendingAudio?.trim() ? ` | Audio: ${videoConfig.trendingAudio.trim()}` : "";
    const panduanSuaraExample = (effectiveNarrationMode === "DIEGETIC_ONLY" || effectiveNarrationMode === "SILENT_TEXT_ONLY")
      ? `Context: <konteks/suasana suara lingkungan adegan> | Note: <petunjuk audio diegetic/SFX/foley — sebutkan di detik ke berapa dalam scene SFX terjadi, misal: "SFX muncul tepat saat kamera settle di mid-scene"> | Traits: <elemen audio in-scene dominan>${audioTrendNote}`
      : `Context: <konteks/suasana adegan> | Note: <petunjuk intonasi/kecepatan/jeda — misal: "mulai lambat, akselerasi di kalimat ke-3, jeda 0.5 detik sebelum reveal kata kunci"> | Traits: <karakteristik vokal, misal: deep voice, energetic> | Sync: <audio event yang SYNC dengan visual — misal: "[SFX: impact] tepat saat kamera snap-zoom, [BGM] fade in di detik ke-2 bersamaan dengan ambient light warm masuk">${audioTrendNote}`;

    // ── Overlay Style & Chapter Structure ──────────────────────────────────
    const overlayStyle = videoConfig.overlayStyle || "auto";
    const sceneCount = videoConfig.targetSceneCount;
    const isLongForm = sceneCount ? sceneCount > 6 : false;

    // Build overlay instruction based on overlay style
    let overlayInstruction: string;
    switch (overlayStyle) {
      case "chapter_titles":
        overlayInstruction = `[CHAPTER TITLE] Judul bab/topik baru — teks ini muncul di awal scene sebagai penanda transisi topik lalu menghilang (fade out) saat narasi dimulai (maks 3-7 kata, bold/caps). Tulis strip "—" jika scene BUKAN pembuka bab baru.`;
        break;
      case "key_points":
        overlayInstruction = `[KEY POINT] Teks poin kunci yang menemani narasi di layar (fakta, data, quote highlight) — muncul bersamaan narasi lalu menghilang di akhir segmen (maks 3-7 kata). Tulis strip "—" jika tidak ada poin kunci.`;
        break;
      case "mixed":
        overlayInstruction = `Pilih salah satu jenis overlay yang paling sesuai konteks scene:
- [CHAPTER TITLE] Judul bab/topik baru — muncul di awal scene sebagai penanda transisi topik, lalu menghilang (fade out) saat narasi dimulai. Gunakan di scene pertama setiap bab/topik baru.
- [KEY POINT] Teks poin kunci menemani narasi (fakta, data, quote) — muncul bersama narasi lalu menghilang di akhir segmen.
Tulis prefix jenis di depan teks, contoh: "[CHAPTER TITLE] Rahasia Sukses" atau "[KEY POINT] 3x Lebih Cepat". Tulis strip "—" jika tanpa overlay.`;
        break;
      case "minimal":
        overlayInstruction = `Hanya gunakan overlay di scene yang BENAR-BENAR membutuhkannya (misal: hook pembuka, data kunci, CTA). Mayoritas scene TANPA overlay (tulis "—"). Jika overlay diperlukan, maks 3-5 kata.`;
        break;
      default: // "auto"
        overlayInstruction = isLongForm
          ? `Pilih salah satu jenis overlay yang paling sesuai konteks scene:
- [CHAPTER TITLE] Judul bab/topik baru — muncul di awal scene sebagai penanda transisi topik, lalu menghilang (fade out) saat narasi dimulai. Gunakan di scene pertama setiap bab/topik baru.
- [KEY POINT] Teks poin kunci menemani narasi (fakta, data, quote) — muncul bersama narasi lalu menghilang di akhir segmen.
Tulis prefix jenis di depan teks, contoh: "[CHAPTER TITLE] Rahasia Sukses" atau "[KEY POINT] 3x Lebih Cepat". Tulis strip "—" jika tanpa overlay.`
          : `Teks singkat yang muncul di layar (maks 3-7 kata), atau strip "—" jika tanpa overlay`;
        break;
    }

    // ── Chapter Grouping (Long-form Auto) ──────────────────────────────────
    const needsChapterGrouping = isLongForm && (overlayStyle === "auto" || overlayStyle === "chapter_titles" || overlayStyle === "mixed");
    if (needsChapterGrouping) {
      systemInstruction += `\n[STRUKTUR BAB OTOMATIS — KONTEN LONG-FORM]
Karena jumlah scene ≥ 7, kamu WAJIB mengelompokkan scene ke dalam bab-bab tematik.
Format: Tambahkan header "## BAB [nomor]: [Judul Bab]" sebelum kelompok scene pertama dari setiap bab.
Scene pertama di setiap bab WAJIB memiliki TEKS OVERLAY bertipe [CHAPTER TITLE].
Contoh struktur:
## BAB 1: Opening Hook
## SCENE 1
...
## SCENE 2
...
## BAB 2: Pembahasan Utama
## SCENE 3
...
Jumlah bab ditentukan secara natural berdasarkan alur konten (biasanya 3-6 bab untuk konten panjang).`;
    }

    formatOutputWajib += `\n## SCENE 1\nNARASI: [${narasiExample}]\nTARGET EMOSI (VET): [Target emosi spesifik penonton: misal Rasa Ingin Tahu / Shock / Empati / Kelegaan / Urgensi]\nTEKNIK EDITING & PACING: [Instruksi pacing: misal Jump Cut (0s dead-air) / B-Roll Cutaway Overlay / Visual Beat Sync / Stabilized Flow]\nTEKS OVERLAY: [${overlayInstruction}]\nPANDUAN SUARA: [${panduanSuaraExample}]\nVISUAL PROMPT: [${visualPromptInstruction}]${arSuffix}\nDURASI: [Estimasi durasi adegan dalam detik, contoh: 5 detik]\n`;
    formatOutputWajib += `\n## SCENE 2\nNARASI: [Narasi / dialog adegan kedua dengan tanda kurung intonasi (...)]\nTARGET EMOSI (VET): [Target emosi adegan kedua]\nTEKNIK EDITING & PACING: [Instruksi pacing adegan kedua]\nTEKS OVERLAY: [${overlayStyle === "minimal" ? 'Overlay hanya jika sangat diperlukan, strip "—" jika tidak' : 'Teks overlay sesuai jenis yang dipilih di atas'}]\nPANDUAN SUARA: [${panduanSuaraExample}]\nVISUAL PROMPT: [Tulis prompt visual adegan kedua secara TEMPORAL (klip berjalan, bukan snapshot): deskripsikan Subject Micro-Action, Environment Dynamics, dan Camera Movement + Timing, bahasa Inggris.]${arSuffix}\nDURASI: [Estimasi durasi]\n`;

    if (sceneCount && sceneCount > 2) {
      formatOutputWajib += `\n...dan seterusnya hingga TEPAT SCENE ${sceneCount}. Kamu WAJIB menghasilkan TEPAT ${sceneCount} SCENE.\n`;
    } else {
      formatOutputWajib += `\n...dan seterusnya sesuai alur naskah hingga selesai.\n`;
    }
  }

  if (hasThumbnail) {
    const thumbStyleNote = videoConfig.thumbnailStylePreset && videoConfig.thumbnailStylePreset !== "CUSTOM" && videoConfig.thumbnailStylePreset !== "AUTO"
      ? ` WAJIB gunakan atau adaptasi formula template teks "${videoConfig.thumbnailStylePreset.replace("_", " ")}" (pilihan anti-gagal 2026: "GILA!", "ANTI GAGAL", "3 LANGKAH SAJA", "BOOYAH!", "KAGET!").`
      : "";
    formatOutputWajib += `\n## THUMBNAIL STUDIO\nTEKS OVERLAY SEO: [Maksimal 1-3 kata huruf kapital tebal, memicu curiosity gap/reaksi ekstrem.${thumbStyleNote}]\nOPSI 1 PROMPT: [Shot Type & Camera Angle (Close-up / Medium Close-up), Subject with Extreme Emotional Facial Expression (wajah emosional mengisi 60-80% frame), Environment & High Contrast Background, Cinematic Lighting (Rim light, split lighting, warm foreground vs cool background). Sisakan 1/3 negative space bersih untuk teks di sisi kiri/kanan. Bahasa Inggris.]${arSuffix}\nOPSI 1 TEKS OVERLAY: [Teks singkat ditempel pada gambar Opsi 1 (maks 1-3 kata, punchy, font tebal)]\nOPSI 2 PROMPT: [Visual prompt alternatif kontras sudut pandang/komposisi untuk A/B testing (wajah emosional 60-80% frame, negative space bersih). Bahasa Inggris.]${arSuffix}\nOPSI 2 TEKS OVERLAY: [Teks singkat ditempel pada gambar Opsi 2 (maks 1-3 kata)]\nREKOMENDASI WARNA & ELEMEN: [Palet kontras tinggi (misal: teks kuning di latar hitam atau putih di latar biru), penempatan teks di area negative space, elemen grafis penegas]\n`;
  }

  // ── Three-Tier YouTube SEO & Pre-Flight Checklist (Strategi YouTube 2026) ──
  if (isYoutube) {
    formatOutputWajib += `\n## METADATA SEO YOUTUBE 2026\nTAG SPESIFIK: [5-8 kata kunci utama yang sangat spesifik dan relevan dengan topik]\nTAG UMUM: [3-5 kategori niche besar]\nTAG MAJEMUK (LONG-TAIL): [5-8 frasa pencarian panjang spesifik berniat tinggi]\nDESKRIPSI YOUTUBE (SEO & EMPATI): [2-3 paragraf deskripsi video yang kaya kata kunci alami, ramah pembaca manusia, menyertakan ringkasan Value Promise video]\nCHECKLIST KESIAPAN AKHIR:\n- [ ] Audio bersih dari noise dengan Fade-in/Fade-out yang halus\n- [ ] Judul mengandung Long-tail Keyword yang dicari orang\n- [ ] Teks thumbnail (maks 1-3 kata) dan ekspresi wajah 60-80% terbaca jelas di layar HP kecil\n- [ ] Hook 3 detik pertama telah menyampaikan Janji Nilai (Value Promise) yang kuat\n`;
  }

  // Fix 2.1: htmlBlog section — paid feature gate; must appear in output when enabled
  const hasHtmlBlog = videoConfig.htmlBlog === true;
  if (hasHtmlBlog) {
    formatOutputWajib += `\n## HTML BLOG\nTulis sebuah artikel blog berbasis naskah video di atas dengan ketentuan berikut:\n1. Panjang artikel: 400–600 kata, SEO-friendly, dengan sub-heading menggunakan tag <h2> dan <h3>.\n2. Meta Description: Tulis meta description 150-160 karakter di bawah judul artikel (label: META DESCRIPTION:).\n3. Judul Artikel (H1): Tulis judul artikel blog yang mengandung kata kunci utama, menarik untuk diklik.\n4. Isi Artikel: Kembangkan narasi video menjadi artikel lengkap. Gunakan paragraf pendek (2-4 kalimat), tambahkan contoh konkret, statistik fiktif yang masuk akal, dan CTA di akhir.\n5. Format output WAJIB HTML murni (bukan Markdown), siap ditempel ke CMS. Mulai dari <h1> hingga paragraf penutup.\n`;
  }

  const effectiveSpeechRate = videoConfig.speechRate || (channel.speechRate ? `${channel.speechRate} detik/kata` : null) || promptSettings?.defaultSpeechRate || "medium";

  // Extracted to avoid nested backtick syntax error
  const thumbnailGuidelineSection = hasThumbnail
    ? `
[PANDUAN PEMBUATAN THUMBNAIL HIGH-CTR (STANDAR ADPLAY 2026)]
1. FOKAL POINT & EKSPRESI WAJAH 60-80% FRAME: Subjek utama WAJIB memiliki ekspresi wajah yang sangat emosional dan intens (terkejut, heran, tegang, penasaran, atau bahagia) dengan kontak mata langsung ke arah penonton, mengisi 60-80% dari area frame gambar, ATAU objek utama berskala kontras tinggi yang langsung menangkap perhatian dalam 0.5 detik pertama scroll feed.
2. NEGATIVE SPACE BERSIH: Prompt visual WAJIB menyisakan area kosong bersih atau berlatar gelap/bokeh (di 1/3 sisi kiri atau kanan) khusus untuk penempatan teks overlay agar teks tidak menutupi wajah atau objek utama.
3. KONTRAS TINGGI & PALET WARNA KOMPLEMENTER: Gunakan pencahayaan dramatis (rim lighting tajam, volumetric light, warm foreground vs cool moody background) dan warna kontras (misal: teks kuning di latar gelap, atau putih di latar biru pekat).
4. TEKS OVERLAY MAKSIMAL 1-3 KATA: Maksimal 1-3 kata, huruf kapital, punchy, memicu curiosity gap yang tak tertahankan (BUKAN judul video, melainkan reaksi atau pengait rasa penasaran). Referensi template anti-gagal: "GILA!", "ANTI GAGAL", "3 LANGKAH SAJA", "BOOYAH!", "KAGET!".
5. FORMULA WAJIB PROMPT THUMBNAIL: [Shot Type (Close-up / Medium Close-up)], [Main Subject with Intense Facial Emotion filling 60-80% frame], [Atmospheric Environment with Clean Negative Space on One Side], [Cinematic Lighting & Striking Color Grading], [Aesthetic Style, Ultra-sharp 8k details].`
    : "";

  // ── Feature #61: Factual Visual Grounding Layer ──────────────────────────
  // Hanya aktif jika topik/konteks mengandung ≥2 sinyal faktual nyata.
  // Niche lifestyle/cooking/fiksi/motivasi tidak pernah memenuhi threshold ini.
  const isFactualContent = detectFactualContent(topic, additionalContext);
  const factualGroundingBlock = isFactualContent
    ? `
[PANDUAN VISUAL CONTEXT GROUNDING — KONTEN FAKTUAL TERDETEKSI]
Topik ini mengandung fakta dunia nyata (entitas, lokasi, data, atau peristiwa spesifik).
Terapkan langkah tambahan berikut untuk SETIAP scene:

1. EKSTRAKSI FAKTA PER-SCENE: Sebelum menulis Visual Prompt, identifikasi dari NARASI scene:
   - Siapa? (negara, institusi, tokoh, organisasi spesifik)
   - Di mana? (lokasi spesifik, landmark, kota, bangunan ikonik)
   - Kapan? (era, tahun, tanggal konkret)
   - Apa? (peristiwa, keputusan, atau fenomena konkret yang terjadi)

2. ELEMEN VISUAL KONTEKSTUAL WAJIB: Sisipkan minimal 1-2 elemen visual yang SPESIFIK
   dan RECOGNIZABLE untuk konteks faktual tersebut, bahkan dalam estetika stylized:
   - Entitas Arab/Timur Tengah → kubah masjid bergaya estetika terpilih, kaligrafi
     Arab stilasi, siluet menara adzan, lanskap gurun ikonik
   - Eropa Utara / Skandinavia → arsitektur modern minimalis, interior parlemen bersih
     dengan bangku kayu modern dan layar digital, warna netral nordik
   - Parlemen / Demokrasi modern (abad ke-21) → bangku sidang modern, layar voting
     digital, aula formal terang, jas profesional kontemporer
   - Data / Studi ilmiah → bar chart atau grafik kontemporer dengan angka yang terbaca,
     setting kantor riset modern, laptop/monitor dengan spreadsheet
   - Era Pandemi (2020–2022) → suasana kota lengang kontemporer, elemen masker
     medis stilasi, visual infrastruktur kesehatan modern
   - Konflik / Krisis geopolitik → peta dunia bergaya estetika terpilih, siluet
     delegasi di meja perundingan, elemen bendera atau simbol negara yang relevan

3. ANTI-AMBIGUITAS (WAJIB): Visual DILARANG disalahartikan sebagai era atau konteks
   yang berbeda dari fakta narasi:
   - Narasi menyebut "parlemen modern 2020" → WAJIB setting kontemporer, BUKAN
     kastil, labirin batu, atau gulungan kertas abad pertengahan
   - Narasi menyebut "studi ilmiah" → WAJIB visual riset modern, BUKAN perpustakaan
     antik dengan lilin dan perkamen
   - Narasi menyebut lokasi Arab → WAJIB ada 1+ elemen ikonik Islam/Arab yang
     recognizable, meski dirender dalam estetika Ghibli/watercolor sekalipun

4. KESEIMBANGAN ESTETIKA-KONTEKS: Elemen faktual dilebur KE DALAM estetika yang
   dipilih — bukan mengganti estetika. Tujuannya: penonton mengenali konteks
   SEKALIGUS menikmati gaya visual. Contoh:
   - "kubah masjid bergaya Ghibli watercolor dengan detail kaligrafi stilasi"
   - "bar chart modern yang bersinar dengan Pixar 3D render style"
   - "aula parlemen Skandinavia dengan flat-vector illustration aesthetic"
`
    : "";

  const allGuidelines = `
${structural.viralGuidelineSection}

[PANDUAN PEMERKAYAAN VISUAL PROMPT — TEMPORAL CLIP, BUKAN SNAPSHOT STATIS]
1. Baca NARASI per scene terlebih dahulu, lalu buat Visual Prompt secara dinamis, metaforis, dan sangat ilustratif (HINDARI penerjemahan harfiah/literal).
2. WAJIB DESKRIPSIKAN SCENE SECARA TEMPORAL — bukan foto diam. Setiap Visual Prompt harus menggambarkan apa yang TERJADI selama durasi scene berlangsung, bukan hanya kondisi awal:
   - Beat Pembuka (0–2 detik): kondisi awal / establishing visual
   - Beat Inti (tengah): aksi utama subjek / perubahan dinamis yang terjadi
   - Beat Akhir / Transisi: resolusi visual atau momen yang mempersiapkan perpindahan ke scene berikutnya
3. Pergerakan kamera aktif (khusus video): deskripsikan KAPAN gerakan dimulai, kapan settling/berhenti, dan apakah ada easing (misal: "starts immediately, eases to rest at mid-scene before settling static for final 2 seconds").
4. DILARANG menampilkan visual secara harfiah. Gunakan metafora visual (misal: DNA → glowing double-helix hologram, bukan gambar manusia berdiri).
${resolvedVisualStyle
  ? `5. GAYA ESTETIKA VISUAL WAJIB PER SCENE: "${resolvedVisualStyle}" — Terapkan gaya ini secara konsisten di SETIAP scene dalam bagian [Style/Aesthetic] Visual Prompt. Wajib dilebur ke dalam kalimat deskriptif secara natural, bukan ditempel sebagai tag terpisah di akhir kalimat.`
  : `5. Integrasi Gaya Estetika: Leburkan gaya visual ke dalam deskripsi kalimat, bukan hanya menempelkan kata kunci di akhir.`
}
6. KEBEBASAN ERA & KONTEKS: Kecuali topik secara eksplisit membutuhkan era historis tertentu, HINDARI setting historis spesifik (Romawi kuno, Yunani kuno, era abad pertengahan, dll.). Visualisasikan konsep secara kontemporer, metaforis, atau universal — karakter, pakaian, lingkungan, dan environment HARUS bisa ditempatkan di era, budaya, dan lokasi manapun. Gunakan abstraksi visual yang melampaui waktu.
7. DILARANG mencantumkan parameter referensi kosong seperti "--cref [url]" atau "--sref [url]" jika data URL tidak disediakan.

[PANDUAN DINAMISME LINGKUNGAN — ENVIRONMENTAL ACTIVITY LAYER]
Setiap scene WAJIB memiliki minimal 1 elemen lingkungan yang BERGERAK atau BERUBAH secara dinamis selama durasi scene — ini yang membedakan video hidup dari slideshow. Elemen dinamis HARUS disebutkan secara eksplisit di dalam Visual Prompt:
- Indoor / Studio: uap kopi mengepul perlahan, kipas angin blur di latar, bayangan venetian blind berpindah seiring matahari, cahaya monitor berkedip-kedip soft, dry ice smoke melayang di permukaan meja
- Outdoor / Kota: kendaraan bokeh blur melintas latar, neon sign berkedip ritmis, asap tipis dari manhole/saluran, hujan rintik di permukaan aspal, bayangan pohon bergerak karena angin
- Produk / Commercial: glare highlight berpindah di permukaan produk seiring kamera bergerak, rim light yang bergeser secara halus, uap atau partikel glossy di area produk
- Alam: dedaunan bergerak halus karena angin, dappled light berpindah di permukaan air, bayangan awan bergerak cepat di lanskap, refleksi langit di permukaan basah
- Abstrak / Sinematik: partikel cahaya melayang perlahan, volumetric light beam bergerak, color grading yang secara bertahap bergeser dari dingin ke hangat atau sebaliknya dalam satu scene
PRINSIP: Elemen dinamis ini boleh minor dan subtle — tidak harus dominan. Tujuannya membuat dunia di dalam frame terasa HIDUP, bukan dibekukan.
${thumbnailGuidelineSection}
${factualGroundingBlock}

[PANDUAN ANTI-DETEKSI AI & NATURALISASI BAHASA]
1. Burstiness: Kombinasikan kalimat pendek, sedang, dan panjang secara dinamis. Gunakan kalimat 1-2 kata untuk penekanan dramatis.
2. Perplexity: Tulis seperti manusia bercerita ke teman. Gunakan kontraksi informal Indonesia (udah, aja, nggak, tapi, kok, sih, bikin, nyesek, lho).
3. Blacklist AI Cliché: Dilarang "Ingatlah bahwa...", "Dalam era digital ini...", "Mari kita bahas...", "Secara keseluruhan...". Ganti dengan "Pernah nggak sih...", "Coba bayangin...", "Tahu gak...", "Ternyata...".
4. Sisipkan ekspresi keraguan, keterkejutan, atau jeda alami.

${audioGuidelinesText}

${loopGuidelinesText}

${videoLoopGuidelinesText}

[KONSISTENSI VISUAL KARAKTER]
1. Jika ada karakter utama berulang di beberapa scene, deskripsikan ciri fisiknya 100% konsisten di setiap scene tempat dia muncul.
2. Jika scene tidak membutuhkan karakter (b-roll produk, pemandangan, transisi), tulis visual bebas tanpa memaksakan kehadiran karakter.

[KONSISTENSI COLOR GRADE & LUT ANTAR-SCENE]
Tentukan dan pertahankan satu palet warna dominan yang konsisten di seluruh naskah, seolah seluruh video dirender dengan LUT yang sama. Pilih satu dari kategori berikut berdasarkan mood narasi, lalu terapkan secara konsisten:
- Warm & Golden (Nostalgic / Inspiratif): amber, golden hour orange, honey tones — cocok untuk storytelling personal, edukasi hangat, produk lifestyle
- Cool & Teal (Sinematik / Profesional): teal shadows, cool highlights, steel blue midtones — cocok untuk konten teknologi, bisnis, atau atmosfer urban
- Desaturated & Gritty (Dokumenter / Raw): muted colors, slight grain, lifted shadows — cocok untuk konten faktual, geopolitik, berita
- High Contrast & Vivid (Energetik / Viral): punchy saturation, deep blacks, vibrant highlights — cocok untuk hook kuat, konten aksi, dan motivasi
- Monochromatic Accent (Artistik / Branded): dominasi satu warna dengan satu accent warna komplementer — cocok untuk branding channel yang kuat

ATURAN WAJIB:
1. Sebutkan palet warna/LUT yang dipilih SEKALI di Scene 1 sebagai anchor (misal: "warm amber color grade, golden-teal split tone").
2. Referensikan palet yang sama di setiap Visual Prompt berikutnya dengan frasa singkat (misal: "matching warm amber grade", "consistent teal LUT", "same desaturated gritty tone").
3. DILARANG mengubah color grade antar-scene tanpa alasan naratif eksplisit. Perubahan hanya diperbolehkan jika narasi sendiri mengindikasikan pergeseran emosi atau waktu (misal: flashback → lebih desaturated, reveal klimaks → saturasi naik secara dramatis).
4. Jika ada elemen dynamis dalam-scene (misal: ambient light bergeser dari cool ke warm), ini BERBEDA dari perubahan LUT — pergerakan cahaya dalam scene diizinkan selama LUT dasar tetap konsisten.

${structural.pacingGuidelineSection}

[PANDUAN TEMPO & KECEPATAN BICARA (SPEECH RATE)]
Kecepatan narasi ditetapkan pada: "${effectiveSpeechRate}". Susun panjang kalimat narasi setiap scene agar pas dengan kecepatan bicara ini dan target durasi ${videoConfig.targetDurationSec || 60} detik.

${structural.emotionalArcSection}

${structural.engagementTriggerDirective}
${structural.narrationModeDirective}
`;

  // ── Exclude Titles ─────────────────────────────────────────────────────
  let excludeSection = "";
  if (excludeTitles && excludeTitles.length > 0) {
    excludeSection = `\n[EXCLUDE LIST JUDUL]\nHindari judul-judul berikut karena sudah pernah dipakai:\n${excludeTitles.map((t) => `- "${t}"`).join("\n")}\n`;
  }

  // ── Composition ────────────────────────────────────────────────────────
  let compositionText = "";
  if (videoConfig.composition) {
    const { education, entertainment, marketing } = videoConfig.composition;
    compositionText = `\n[KOMPOSISI TEMA NASKAH]\nSusun konten dengan komposisi: ${education || 0}% Edukasi/Informasi, ${entertainment || 0}% Hiburan/Storytelling, ${marketing || 0}% Marketing/CTA.`;
  }

  // ── Duration & Scene Count ─────────────────────────────────────────────
  let durationText = "";
  if (videoConfig.targetDurationSec) {
    durationText = `\n[TARGET DURASI VIDEO]\nWAJIB mengarahkan estimasi durasi agar total seluruh scene mendekati atau TEPAT ${videoConfig.targetDurationSec} detik.`;
  }

  // ── Product Context ────────────────────────────────────────────────────
  // Hanya inject productContext jika affiliateAngle TIDAK aktif.
  // Jika aktif, affiliateAngleGuide sudah mencakup data produk → hindari duplikasi.
  let productContext = "";
  if (!videoConfig.affiliateAngle) {
    if (videoConfig.selectedProduct) {
      productContext = `\n[PRODUK YANG DIPROMOSIKAN]\n- ${videoConfig.selectedProduct.name} (Rp ${videoConfig.selectedProduct.price}): ${videoConfig.selectedProduct.description || "-"}`;
    } else if (channel.products && channel.products.length > 0) {
      productContext = `\n[PRODUK UNTUK SOFT-SELLING]\n${channel.products.map((p) => `- ${p.name} (Rp ${p.price}): ${p.description || "-"}`).join("\n")}`;
    }
  }

  // ── Additional Context ─────────────────────────────────────────────────
  const contextText = additionalContext ? `\n[KONTEKS TAMBAHAN]\n${additionalContext}` : "";

  // ── Platform Strategy Guide (Tugas 3: Modul Algoritma Spesifik Per-Platform) ──
  let platformGuideText = "";
  if (videoConfig.targetPlatform) {
    const rawPlat = videoConfig.targetPlatform.trim();
    const adminGuides = (promptSettings?.platformAlgorithmGuide && typeof promptSettings.platformAlgorithmGuide === "object")
      ? (promptSettings.platformAlgorithmGuide as Record<string, string>)
      : null;

    const norm = (s: string) => s.toLowerCase().replace(/[_\s-]+/g, "");
    const normPlat = norm(rawPlat);

    // Match platform in DEFAULT_PLATFORM_ALGORITHM_GUIDE or admin override
    const matchedKey = Object.keys(DEFAULT_PLATFORM_ALGORITHM_GUIDE).find((k) => {
      const nk = norm(k);
      return nk === normPlat || normPlat.includes(nk) || nk.includes(normPlat);
    });

    const adminKey = adminGuides
      ? Object.keys(adminGuides).find((k) => {
          const nk = norm(k);
          return nk === normPlat || normPlat.includes(nk) || nk.includes(normPlat);
        })
      : null;

    const guideContent = (adminGuides && adminKey && adminGuides[adminKey])
      ? adminGuides[adminKey]
      : (matchedKey ? DEFAULT_PLATFORM_ALGORITHM_GUIDE[matchedKey] : null);

    if (guideContent) {
      // Fix #71: Strip CTA-related instructions from platform guide when CTA is disabled
      let finalGuide = guideContent;
      if (!hasCTA) {
        // Remove lines containing explicit CTA/subscribe/follow directives
        finalGuide = finalGuide
          .split("\n")
          .map((line) => {
            // Neutralize lines that contain CTA/subscribe instructions
            if (/\b(CTA|subscribe|ajakan subscribe|follow)\b/i.test(line) && !/\b(tanpa|dilarang|jangan|bukan)\b/i.test(line)) {
              return line.replace(
                /CTA|ajakan subscribe yang halus[^.]*\./gi,
                "resolusi konten yang kuat dan bermakna."
              );
            }
            return line;
          })
          .join("\n");
      }
      platformGuideText = `\n${finalGuide}\n`;
    } else {
      const defaultAr = (normPlat.includes("long") || ar === "16:9") ? "16:9" : "9:16";
      platformGuideText = `\n[PLATFORM TARGET: ${videoConfig.targetPlatform}]\nSesuaikan format bahasa, durasi, pacing scene, dan layout visual ${defaultAr} agar optimal untuk algoritma ${videoConfig.targetPlatform}.\n`;
    }
  }

  // ── Closed-Loop Performance Learnings (Tugas 5: Pembelajaran Konten Terbaik) ──
  let closedLoopSection = "";
  if (topPerformers && topPerformers.length > 0) {
    closedLoopSection = `\n[PEMBELAJARAN DARI KONTEN TERBAIK CHANNEL INI (CLOSED-LOOP INSIGHT)]\n` +
      `Sistem menganalisis data historis performa naskah terdahulu yang menghasilkan tontonan/retensi tertinggi pada channel "${channel.channelName}":\n` +
      topPerformers.map((d, i) => {
        let line = `${i + 1}. Judul: "${d.title}" | Metrik Nyata: ${d.views.toLocaleString()} Views`;
        if (d.retentionPct !== undefined && d.retentionPct !== null) line += `, ${d.retentionPct}% Retensi`;
        if (d.likes) line += `, ${d.likes.toLocaleString()} Likes`;
        if (d.hookText) line += `\n   - Pola Hook Pembuka yang Sukses: "${d.hookText}"`;
        if (d.toneOfVoice) line += `\n   - Gaya/Nada Bicara: ${d.toneOfVoice}`;
        if (d.targetKeywords) {
          const kws = Array.isArray(d.targetKeywords) ? d.targetKeywords.join(", ") : d.targetKeywords;
          line += `\n   - Keyword Relevan: ${kws}`;
        }
        return line;
      }).join("\n") +
      `\n\nINSTRUKSI ADAPTASI PERFORMA TINGGI (CLOSED-LOOP):\n` +
      `1. Pelajari pola rasa penasaran (curiosity gap), tempo pembuka, dan resonansi emosional yang terbukti berhasil pada konten-konten di atas.\n` +
      `2. Terapkan intensitas hook, struktur kalimat, dan gaya penyampaian yang setara atau lebih kuat ke dalam naskah baru ini, sehingga selaras dengan preferensi nyata audiens channel ini.\n`;
  }

  // ── SEO & Keywords Section (Strategi YouTube 2026: 3-Tier Keyword Architecture) ──
  let seoSection = "";
  const specificKws = Array.isArray(videoConfig.targetKeywordsSpecific)
    ? videoConfig.targetKeywordsSpecific
    : (typeof videoConfig.targetKeywordsSpecific === "string" ? videoConfig.targetKeywordsSpecific.split(",").map(k => k.trim()).filter(Boolean) : []);
  const generalKws = Array.isArray(videoConfig.targetKeywordsGeneral)
    ? videoConfig.targetKeywordsGeneral
    : (typeof videoConfig.targetKeywordsGeneral === "string" ? videoConfig.targetKeywordsGeneral.split(",").map(k => k.trim()).filter(Boolean) : []);
  const longTailKws = Array.isArray(videoConfig.targetKeywordsLongTail)
    ? videoConfig.targetKeywordsLongTail
    : (typeof videoConfig.targetKeywordsLongTail === "string" ? videoConfig.targetKeywordsLongTail.split(",").map(k => k.trim()).filter(Boolean) : []);

  if (specificKws.length > 0 || generalKws.length > 0 || longTailKws.length > 0) {
    seoSection = `\n[ARSITEKTUR KATA KUNCI SEO 3 LAPIS (YOUTUBE 2026)]\n`;
    if (specificKws.length > 0) seoSection += `1. Tag Spesifik (Kata Kunci Utama): ${specificKws.join(", ")}\n`;
    if (generalKws.length > 0) seoSection += `2. Tag Umum (Kategori Niche): ${generalKws.join(", ")}\n`;
    if (longTailKws.length > 0) seoSection += `3. Tag Majemuk (Long-Tail Search Queries): ${longTailKws.join(", ")}\n`;
    seoSection += `Instruksi SEO 3 Lapis:\n` +
      `- Sisipkan minimal 1 kata kunci spesifik dan 1 frasa long-tail pada minimal 5 opsi judul di Tahap 1.\n` +
      `- Integrasikan kata kunci spesifik secara natural di 3 detik pertama narasi (Scene 1).\n` +
      `- Susun Deskripsi YouTube dengan mengalirkan kata kunci ini ke dalam paragraf naratif yang ramah manusia.\n`;
  } else if (targetKeywordsList.length > 0) {
    seoSection = `\n[TARGET SEO & KATA KUNCI TREN (VIDIQ/YOUTUBE)]\n` +
      `Fokuskan konten untuk menargetkan kata kunci bervolume tinggi berikut:\n` +
      targetKeywordsList.map((kw) => `- ${kw}`).join("\n") +
      `\nInstruksi SEO:\n` +
      `1. Sisipkan kata kunci utama pada minimal 5 opsi judul di Tahap 1.\n` +
      `2. Integrasikan kata kunci secara natural pada kalimat pembuka/hook narasi.\n` +
      `3. Sertakan kata kunci relevan ke dalam hashtag dan caption platform.\n`;
  }

  // ── Retention & Pacing Engine (Strategi YouTube 2026) ───────────────────
  let retentionPacingGuide = "";
  if (videoConfig.retentionPacingProEnabled) {
    retentionPacingGuide = `\n[PANDUAN RETENSI & PACING — MODE RETENSI EKSEKUTIF (PRO 2026)]
Kamu bertindak sebagai Executive Video Editor & Audience Retention Specialist profesional 2026. Terapkan prinsip retensi tertinggi berikut pada SETIAP scene:
1. ANTI-DROP 0-3 DETIK (WAJIB): Scene 1 harus memberikan Janji Nilai (Value Promise) yang jelas dan hook agresif untuk memutus kebiasaan scroll/skip penonton dalam 3 detik pertama.
2. SILENCE ELIMINATION / JUMP CUT: Rancang naskah tanpa jeda hening (dead air < 0.3 detik). Tulis narasi padat, mengalir, dan dinamis antar kalimat.
3. VISUAL BEAT SYNC: Cantumkan instruksi pergantian visual/angle yang selaras dengan ketukan birama musik (BGM beat drops) pada kolom TEKNIK EDITING & PACING.
4. B-ROLL & STOCK ASSET CUTAWAYS: Setiap scene dengan durasi ≥4 detik WAJIB mencantumkan rekomendasi B-roll pelengkap atau cutaways dinamis untuk menyegarkan mata penonton.
5. MID-ROLL RE-ENGAGEMENT: Di pertengahan durasi (50% video), sisipkan 'plot pivot', fakta mengejutkan baru, atau kontras visual tajam untuk mengangkat kembali grafik retensi agar tidak anjlok.\n`;
  } else if (videoConfig.retentionPacingMode) {
    const pacingMap: Record<string, string> = {
      JUMP_CUT: "Fokus pada Jump Cut Pacing: kalimat cepat, minim jeda hening (<0.3s), tempo energetik tanpa dead-air.",
      B_ROLL_HEAVY: "Fokus pada B-Roll Variety: variasikan footage pendukung, cutaways, dan overlay dinamis agar penonton tidak bosan.",
      BEAT_SYNC: "Fokus pada Visual Beat Sync: selaraskan pergantian adegan dan efek suara dengan ketukan beat musik latar.",
      CONTEMPLATIVE: "Fokus pada Alur Kontemplatif: pacing tenang, ruang bernapas emosional, dan transisi halus.",
    };
    const desc = pacingMap[videoConfig.retentionPacingMode] || "Sesuaikan ritme editing agar penonton betah menonton hingga tuntas.";
    retentionPacingGuide = `\n[PANDUAN EDITING & PACING RETENSI — ${videoConfig.retentionPacingMode}]\n${desc}\n`;
  }

  // ── Storytelling Framework (VET 3-Act / PAS / AIDA) ────────────────────
  let storytellingGuide = "";
  if (videoConfig.storytellingFramework === "VET_3ACT") {
    storytellingGuide = `\n[FRAMEWORK STORYTELLING: VET 3-ACT (VISUAL, EMOTIONAL, TECHNICAL - 2026)]
1. Visual: Rancang penceritaan gambar yang metaforis, dinamis, dan bergerak (temporal clip).
2. Emotional: Rancang busur emosi beresonansi (penasaran → keterikatan empati → resolusi memuaskan).
3. Technical: Rancang petunjuk transisi, timing kamera, cutaways, dan sinkronisasi audio per scene.
Terapkan struktur 3 babak ini secara konsisten di seluruh scene.\n`;
  }

  // ── Value Promise 3 Detik ──────────────────────────────────────────────
  let valuePromiseDirective = "";
  if (videoConfig.valuePromise3Sec && videoConfig.valuePromise3Sec.trim()) {
    valuePromiseDirective = `\n[JANJI NILAI 3 DETIK PERTAMA (VALUE PROMISE WAJIB)]: "${videoConfig.valuePromise3Sec.trim()}" — Integrasikan janji nilai ini secara eksplisit pada detik ke-0 hingga ke-3 di Scene 1 untuk menghentikan scroll penonton.\n`;
  }

  // ── Audio Dynamics (Fade-in/out & Beat Sync) ───────────────────────────
  let audioDynamicsGuide = "";
  if (videoConfig.audioFadeInOut) {
    audioDynamicsGuide += `- Audio Dynamics: Terapkan Fade-in halus pada pembuka Scene 1 dan Fade-out teratur pada penutup Scene Terakhir.\n`;
  }
  if (videoConfig.audioBeatSync) {
    audioDynamicsGuide += `- Visual Beat Sync: Sinkronkan potongan adegan dan transisi scene dengan tempo ketukan musik latar (BGM).\n`;
  }
  if (audioDynamicsGuide) {
    audioDynamicsGuide = `\n[DINAMIKA AUDIO & SINKRONISASI BEAT 2026]\n${audioDynamicsGuide}`;
  }

  // ── Fitur 4: Directive Anti-Halusinasi ──────────────────────────────────
  const antiHallucinationDirective = `\n[ATURAN INTEGRITAS KONTEN — ANTI-HALUSINASI]
1. DILARANG KERAS memfabrikasi statistik, angka persentase, data survei, atau hasil riset yang tidak disediakan di prompt ini. Jika data diperlukan, gunakan frasa placeholder seperti "menurut data terbaru" atau "berdasarkan penelitian" TANPA menciptakan angka spesifik.
2. DILARANG mengarang kutipan atau atribusi ke tokoh/ahli/institusi nyata kecuali secara eksplisit disediakan di [KONTEKS TAMBAHAN].
3. DILARANG mengklaim khasiat medis, hukum, atau finansial yang bersifat absolut. Gunakan frasa mitigasi ("dapat membantu", "berpotensi", "menurut beberapa sumber").
4. Jika topik memerlukan data faktual yang tidak tersedia, tandai dengan [VERIFIKASI: klaim yang perlu dicek] agar creator dapat memvalidasi sebelum produksi.\n`;

  // ── Fix #71: Hook Style Directive (was disconnected) ────────────────────
  let hookStyleDirective = "";
  if (hasHook && videoConfig.hookStyle) {
    const hookDescriptions: Record<string, string> = {
      "Pertanyaan Provokatif": "Buka Scene 1 dengan PERTANYAAN PROVOKATIF yang memancing rasa penasaran atau menantang asumsi audiens. Contoh pola: \"Pernah nggak sih kamu...\", \"Kenapa sih semua orang salah soal...\", \"Kalau gue bilang [klaim kontroversial], kamu percaya?\"",
      "Fakta Mengejutkan": "Buka Scene 1 dengan FAKTA MENGEJUTKAN atau statistik kontraintuitif yang langsung menghentikan scroll. Contoh pola: \"Tahukah kamu bahwa...\", \"Ternyata [fakta tak terduga]...\", \"[Angka besar] orang nggak sadar bahwa...\"",
      "Tantangan": "Buka Scene 1 dengan TANTANGAN LANGSUNG ke audiens yang memicu ego atau rasa penasaran. Contoh pola: \"Coba buktikan gue salah\", \"Tes apakah kamu...\", \"Berani nggak kamu...\"",
      "Negative Hook": "Buka Scene 1 dengan NEGATIVE HOOK — pernyataan negatif atau peringatan yang memicu fear of missing out. Contoh pola: \"Jangan pernah lakukan ini...\", \"Kesalahan fatal yang...\", \"Stop sebelum kamu...\"",
    };
    const desc = hookDescriptions[videoConfig.hookStyle];
    if (desc) {
      hookStyleDirective = `\n[GAYA HOOK PEMBUKA — ${videoConfig.hookStyle.toUpperCase()}]\n${desc}\n`;
    }
  }

  // ── Fix #71: Ending Style Directive (was disconnected) ──────────────────
  let endingStyleDirective = "";
  if (videoConfig.endingStyle) {
    if (hasCTA) {
      const endingDescriptions: Record<string, string> = {
        "Pertanyaan Terbuka": "Akhiri naskah dengan PERTANYAAN TERBUKA yang memancing diskusi dan komentar audiens (misal: \"Kalian tim mana nih?\", \"Menurut kalian gimana?\"). Boleh diikuti CTA ringan.",
        "Hard Sell CTA": "Akhiri naskah dengan HARD SELL CTA — ajakan bertindak yang tegas, berenergi tinggi, dan imperatif. Gunakan kalimat CTA channel jika tersedia. Contoh: \"Klik link di bio SEKARANG!\", \"Langsung checkout sebelum kehabisan!\"",
        "Ajakan Simpan/Share": "Akhiri naskah dengan kalimat yang memicu penonton MENYIMPAN (bookmark) atau MEMBAGIKAN video ke teman mereka, secara natural dan tidak memaksa.",
      };
      const desc = endingDescriptions[videoConfig.endingStyle];
      if (desc) {
        endingStyleDirective = `\n[GAYA PENUTUP NASKAH — ${videoConfig.endingStyle.toUpperCase()}]\n${desc}\n`;
      }
    } else if (videoConfig.endingStyle !== "Hard Sell CTA") {
      // CTA off — non-CTA ending styles are still valid but with prohibition
      const nonCtaEndingDescriptions: Record<string, string> = {
        "Pertanyaan Terbuka": "Akhiri naskah dengan PERTANYAAN TERBUKA yang memancing diskusi dan komentar audiens. DILARANG menyertakan ajakan follow/subscribe/share.",
        "Ajakan Simpan/Share": "Akhiri naskah dengan kalimat yang memicu penonton MENYIMPAN (bookmark) video, TANPA ajakan follow/subscribe/retensi.",
      };
      const desc = nonCtaEndingDescriptions[videoConfig.endingStyle];
      if (desc) {
        endingStyleDirective = `\n[GAYA PENUTUP NASKAH — ${videoConfig.endingStyle.toUpperCase()}]\n${desc}\n`;
      }
    }
  }

  // ── Fix #71: Negative CTA Directive (when CTA is explicitly disabled) ──
  let negativeCTADirective = "";
  if (!hasCTA) {
    negativeCTADirective = `\n[LARANGAN MUTLAK — CTA DINONAKTIFKAN OLEH USER]
DILARANG KERAS dalam seluruh naskah:
1. Menyisipkan ajakan follow, subscribe, like, share, atau komentar dalam bentuk apa pun — eksplisit MAUPUN implisit.
2. Menambahkan kalimat penutup bernada "worth sticking around", "follow for more", "see you next time", "jangan lupa subscribe", atau frasa retensi serupa.
3. Menggunakan CTA channel ("${channel.cta1 || ""}") meskipun tersedia di data profil — data ini SENGAJA DITAHAN karena user menonaktifkan CTA.
4. Menyisipkan scene khusus CTA di akhir video.
Satu-satunya penutup yang diizinkan: resolusi cerita, pertanyaan diskusi, plot twist, momen emosional, atau fade-out natural.\n`;
  }

  // ── Assemble Master Prompt ─────────────────────────────────────────────
  const youtubeMasterDocSection = isYoutube
    ? `\n${YOUTUBE_2026_STRATEGY_MASTER_DOC}\n\n`
    : "";
  const masterPrompt = `${povSection}${youtubeMasterDocSection}[TOPIK UTAMA]\n${topic}${seoSection}${closedLoopSection}${contextText}${productContext}${affiliateAngleGuide}${compositionText}${platformGuideText}${excludeSection}${durationText}${formatOutputWajib}${hookStyleDirective}${endingStyleDirective}${cameraMovementGuide}${retentionPacingGuide}${storytellingGuide}${valuePromiseDirective}${audioDynamicsGuide}${negativeCTADirective}${antiHallucinationDirective}\n\n${allGuidelines}`;

  return { masterPrompt, systemInstruction };
}
