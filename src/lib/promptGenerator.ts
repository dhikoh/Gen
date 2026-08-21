import { resolveVisualStyle } from "./visualStyleMap";

export interface ProfileChannelData {
  channelName: string;
  niche?: string | null;
  description?: string | null;
  visualAesthetic?: string | null;
  cta1?: string | null;
  cta2?: string | null;
  audioBGM?: boolean | null;
  audioSFX?: boolean | null;
  audioVO?: boolean | null;
  products?: Array<{ name: string; price: number; description?: string | null }>;
  socialLinks?: Array<{ platform: string; url: string }> | null;
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
  // Push-ported enrichment params
  rolePOV?: string | null;
  toneOfVoice?: string | null;
  visualStyle?: string | null;
  hookStyleType?: string | null;
  customHookText?: string | null;
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
}

export interface PromptSettingsData {
  videoSystemInstruction?: string | null;
  imageSystemInstruction?: string | null;
  defaultSpeechRate?: string | null;
  defaultNegativePrompt?: string | null;
  bannedWords?: string[] | string | unknown;
}

export function generateMasterPrompt(
  channel: ProfileChannelData,
  topic: string,
  additionalContext: string,
  videoConfig: VideoConfigData,
  promptSettings?: PromptSettingsData | null,
  excludeTitles?: string[],
  outputLanguage?: string | null
): { masterPrompt: string; systemInstruction: string } {

  // ── System Instruction ─────────────────────────────────────────────────
  let systemInstruction = `Kamu adalah AI Content Strategist dan Scriptwriter profesional yang berpengalaman dalam membuat naskah konten video pendek viral.`;
  if (promptSettings?.videoSystemInstruction?.trim()) {
    systemInstruction += `\n${promptSettings.videoSystemInstruction.trim()}`;
  }
  if (outputLanguage && outputLanguage.trim().length > 0) {
    systemInstruction += `\nWAJIB: Seluruh naskah narasi, dialog, teks overlay, dan tulisan ide lainnya HARUS ditulis dalam bahasa ${outputLanguage.trim()}.`;
  }

  // ── Audio Config ───────────────────────────────────────────────────────
  const finalMusic = videoConfig.musicPreference !== undefined ? Boolean(videoConfig.musicPreference) : Boolean(channel.audioBGM !== false);
  const finalSfx   = videoConfig.sfxPreference   !== undefined ? Boolean(videoConfig.sfxPreference)   : Boolean(channel.audioSFX !== false);
  const finalVo    = videoConfig.voPreference     !== undefined ? Boolean(videoConfig.voPreference)    : Boolean(channel.audioVO  !== false);
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

  const isMarketingZero = videoConfig.composition?.marketing === 0;
  if (!isMarketingZero) {
    if (channel.cta1) povSection += `  - Kalimat CTA Utama: "${channel.cta1}"\n`;
    if (channel.cta2) povSection += `  - Kalimat CTA Alternatif: "${channel.cta2}"\n`;
  } else {
    if (channel.cta1) povSection += `  - Kalimat CTA Utama: "${channel.cta1}"\n`;
    povSection += `- Catatan Penting: Karena bobot Marketing 0%, tulislah naskah yang murni edukatif/hiburan tanpa promosi komersial.\n`;
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

  if (videoConfig.visualStyle) {
    const resolved = resolveVisualStyle(videoConfig.visualStyle);
    if (resolved) {
      povSection += `- Estetika Visual (Visual Style): Pada setiap VISUAL PROMPT per scene, sertakan elemen gaya estetika "${resolved}".\n`;
    }
  }

  povSection += `Gabungkan keahlian, nada bicara, peran persona, dan gaya visual di atas secara harmonis.\n\n`;

  // ── Audio Guidelines ───────────────────────────────────────────────────
  const audioParts: string[] = [];
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

  let narasiExample = "Narasi / dialog untuk adegan ini. Tulis teks yang diucapkan secara lengkap. Gunakan bahasa natural, conversational, relatable, hindari gaya kaku/robotik";
  if (finalSfx && finalMusic) narasiExample += ". Sisipkan [SFX: Nama Efek Suara] dan [BGM: Jenis Musik] di posisi relevan";
  else if (finalSfx) narasiExample += ". Sisipkan [SFX: Nama Efek Suara] di posisi relevan. DILARANG [BGM: ...]";
  else if (finalMusic) narasiExample += ". Sisipkan [BGM: Jenis Musik] saat perubahan mood. DILARANG [SFX: ...]";
  else narasiExample += ". DILARANG menyisipkan [SFX: ...] atau [BGM: ...]";

  // ── Loop Guidelines ────────────────────────────────────────────────────
  const loopGuidelinesText = isLoopable
    ? `[PANDUAN LOOP VIDEO PENDEK (SEAMLESS LOOP - AKTIF)]\n1. WAJIB merancang naskah agar dapat diputar terus-menerus tanpa henti secara mulus.\n2. Kalimat paling akhir di SCENE TERAKHIR harus langsung menyambung ke kalimat pertama SCENE 1.\n3. Periksa kalimat pertama Scene 1, lalu sesuaikan kata demi kata di akhir Scene Terakhir agar membentuk tata bahasa yang 100% benar dan mengalir natural.`
    : `[PANDUAN PENUTUP NASKAH (NORMAL/KLASIK)]\n1. DILARANG membuat kalimat penutup yang menggantung.\n2. Naskah harus diakhiri dengan kesimpulan solid atau CTA yang bermakna tuntas.`;

  const videoLoopGuidelinesText = isVideoLoop
    ? `[PANDUAN LOOP VIDEO (SEAMLESS VISUAL LOOP - AKTIF)]\n1. WAJIB merancang Visual Prompt agar video awal dan akhir tampak menyambung secara visual.\n2. Di SCENE TERAKHIR, akhir Visual Prompt harus kembali ke kondisi visual awal SCENE 1.\n3. Sesuaikan camera movement, lighting, posisi subjek, dan environment agar transisinya mulus.`
    : `[PANDUAN VISUAL VIDEO (NORMAL ENDING)]\n1. Visual scene terakhir tidak perlu menyambung ke scene pertama.\n2. Fokuskan pada resolusi cerita atau adegan penutup yang natural.`;

  // ── Camera Movement Guide ──────────────────────────────────────────────
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
      // Default ON but no preset selected — give AI creative freedom with guidance
      cameraMovementGuide = `[PANDUAN CAMERA MOVEMENT — AUTO]\nAI bebas memilih dan memvariasikan gerakan kamera yang paling sinematik dan sesuai dengan mood setiap scene. Referensi pilihan yang disarankan (tidak terbatas):\n- Untuk scene pembuka/hook: slow push-in, whip pan, crane down and tilt up\n- Untuk scene emosional: slow zoom in, handheld shaky, arc shot\n- Untuk scene aksi/dinamis: tracking shot, sweeping orbital, dolly zoom\n- Untuk scene penutup/CTA: slow pull-out, crane up and wide reveal\nWAJIB: Variasikan gerakan kamera antar scene. Hindari static shot berturut-turut kecuali untuk efek dramatis yang disengaja.`;
    }
  }

  // ── Format Output Wajib (Markdown — Push Style) ──────────────────────
  let formatOutputWajib = "\n\n[FORMAT OUTPUT WAJIB]\n";

  const hasTitleSection = !videoConfig.selectedSections || videoConfig.selectedSections.includes("TITLE");

  if (hasTitleSection) {
    formatOutputWajib += `Proses pembuatan konten ini WAJIB dilakukan dalam 2 TAHAP interaktif:\n\nTAHAP 1: Tampilkan Ide Konten & Tunggu Konfirmasi (BERHENTI SEBELUM MENULIS NASKAH)\n1. Tampilkan tepat 10 ide judul konten kreatif yang memiliki potensi viral tinggi.\n2. Setiap ide ditulis dengan format:\n   [NOMOR]. [JUDUL IDE KONTEN] (Potensi Viral: [Persentase])\n   Deskripsi Singkat: [Penjelasan mengapa berpotensi viral]\n3. Setelah menampilkan 10 ide, WAJIB BERHENTI dan ketik:\n   "Silakan pilih nomor ide konten (1-10) yang ingin Anda buat naskah lengkapnya."\n\nTAHAP 2: Pembuatan Naskah Lengkap (Setelah Konfirmasi User)\nSetelah user memilih, tulis naskah lengkap dengan format berikut:\n\n## RISET & VARIASI JUDUL\nJUDUL TERPILIH: [Judul yang dipilih user]\n\n## ANALISIS STRATEGI KONTEN & HOOK\nAUDIENS PERSONA & PSIKOLOGI: [Analisis singkat]\nSTRATEGI HOOK (0-3 DETIK): [Cara menciptakan curiosity gap]\nALUR KONTEN PAS/AIDA: [Alur penyampaian]\n`;
  } else {
    formatOutputWajib += `Kamu WAJIB mengembalikan output dengan format terstruktur berikut:\n\n## ANALISIS STRATEGI KONTEN & HOOK\nAUDIENS PERSONA & PSIKOLOGI: [Analisis singkat]\nSTRATEGI HOOK (0-3 DETIK): [Cara menciptakan curiosity gap]\nALUR KONTEN PAS/AIDA: [Alur penyampaian]\n`;
  }

  const hasCaption  = !videoConfig.selectedSections || videoConfig.selectedSections.includes("CAPTION");
  const hasHashtag  = !videoConfig.selectedSections || videoConfig.selectedSections.includes("HASHTAG");
  const hasScene    = !videoConfig.selectedSections || videoConfig.selectedSections.some(s => ["HOOK","BODY","CTA"].includes(s));
  const hasThumbnail = videoConfig.thumbnailIdea || videoConfig.selectedSections?.includes("THUMBNAIL");

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
      ? `Tulis prompt video/visual sinematik siap-pakai dalam bahasa Inggris. WAJIB formula 5-bagian: [Shot Type & Camera Angle], [Subject & Action], [Environment & Lighting], [Camera Movement Path], [Style/Aesthetic]. Sangat ilustratif, dinamis, metaforis (HINDARI penerjemahan literal). Contoh: "Extreme macro shot, glowing double-helix DNA strands morphing, surrounded by holographic data streams, cinematic volumetric lighting, slow push-in${visualAudioSuffix}".`
      : `Tulis prompt gambar/visual sinematik siap-pakai dalam bahasa Inggris untuk Midjourney V6. WAJIB formula 5-bagian: [Shot Type & Camera Angle], [Subject & Action], [Environment & Lighting], [Cinematic Composition], [Style/Aesthetic]. Sangat ilustratif, dinamis, metaforis. Contoh: "Extreme macro shot, glowing double-helix DNA strands morphing, holographic biological data streams, cinematic volumetric lighting, shallow depth of field${visualAudioSuffix}".`;

    formatOutputWajib += `\n## SCENE 1\nNARASI: [${narasiExample}]\nPANDUAN SUARA: [Context: <konteks/suasana adegan> | Note: <petunjuk intonasi/kecepatan/jeda> | Traits: <karakteristik vokal, misal: deep voice, energetic>]\nVISUAL PROMPT: [${visualPromptInstruction}]${arSuffix}\nDURASI: [Estimasi durasi adegan dalam detik, contoh: 5 detik]\n`;
    formatOutputWajib += `\n## SCENE 2\nNARASI: [Narasi / dialog adegan kedua]\nPANDUAN SUARA: [Context: <konteks adegan kedua> | Note: <petunjuk pembacaan> | Traits: <karakteristik vokal>]\nVISUAL PROMPT: [Tulis prompt visual adegan kedua, formula 5-bagian, bahasa Inggris.]${arSuffix}\nDURASI: [Estimasi durasi]\n`;

    const sceneCount = videoConfig.targetSceneCount;
    if (sceneCount && sceneCount > 2) {
      formatOutputWajib += `\n...dan seterusnya hingga TEPAT SCENE ${sceneCount}. Kamu WAJIB menghasilkan TEPAT ${sceneCount} SCENE.\n`;
    } else {
      formatOutputWajib += `\n...dan seterusnya sesuai alur naskah hingga selesai.\n`;
    }
  }

  if (hasThumbnail) {
    formatOutputWajib += `\n## THUMBNAIL STUDIO\nTEKS OVERLAY SEO: [3-4 kata memicu rasa ingin tahu, huruf kapital semua, SEO-friendly]\nOPSI 1 PROMPT: [Shot Type, Subject/Action, Environment, Emotion, Lighting, Style. Visual dramatis, kontras tinggi. Bahasa Inggris.]${arSuffix}\nOPSI 1 TEKS OVERLAY: [Teks singkat ditempel pada gambar Opsi 1 (maks 3-4 kata)]\nOPSI 2 PROMPT: [Visual prompt alternatif yang kontras dengan Opsi 1. Bahasa Inggris.]${arSuffix}\nOPSI 2 TEKS OVERLAY: [Teks singkat ditempel pada gambar Opsi 2 (maks 3-4 kata)]\nREKOMENDASI WARNA & ELEMEN: [Palet warna kontras, penempatan teks, elemen visual utama]\n`;
  }

  // Fix 2.1: htmlBlog section — paid feature gate; must appear in output when enabled
  const hasHtmlBlog = videoConfig.htmlBlog === true;
  if (hasHtmlBlog) {
    formatOutputWajib += `\n## HTML BLOG\nTulis sebuah artikel blog berbasis naskah video di atas dengan ketentuan berikut:\n1. Panjang artikel: 400–600 kata, SEO-friendly, dengan sub-heading menggunakan tag <h2> dan <h3>.\n2. Meta Description: Tulis meta description 150-160 karakter di bawah judul artikel (label: META DESCRIPTION:).\n3. Judul Artikel (H1): Tulis judul artikel blog yang mengandung kata kunci utama, menarik untuk diklik.\n4. Isi Artikel: Kembangkan narasi video menjadi artikel lengkap. Gunakan paragraf pendek (2-4 kalimat), tambahkan contoh konkret, statistik fiktif yang masuk akal, dan CTA di akhir.\n5. Format output WAJIB HTML murni (bukan Markdown), siap ditempel ke CMS. Mulai dari <h1> hingga paragraf penutup.\n`;
  }

  // ── All Guidelines (Push-ported) ───────────────────────────────────────
  const allGuidelines = `
[PANDUAN STRATEGI & VIRALITAS KONTEN]
1. Hook & Retensi: 3 detik pertama WAJIB memiliki visual/auditori hook yang kuat (pertanyaan provokatif, statemen kontroversial).
2. Open Loops: Sisipkan 'open loops' (rasa penasaran yang ditunda) di tengah narasi agar penonton bertahan.
3. Spesifikasi Platform: Optimalkan pacing cepat, hindari jeda diam (dead air) lebih dari 1 detik.
4. Arsitektur Konten & Tren: Buat narasi autentik, rentan, retro, dan organik. Hindari gaya bahasa terlampau formal. Hubungkan secara relatable ke audiens modern.
5. Psikologi Copywriting: Gunakan kerangka PAS (Problem → Agitate → Solution) atau AIDA (Attention → Interest → Desire → Action).

[PANDUAN PEMERKAYAAN VISUAL PROMPT]
1. Baca NARASI per scene terlebih dahulu, lalu buat Visual Prompt secara dinamis, metaforis, dan sangat ilustratif (HINDARI penerjemahan harfiah/literal).
2. FORMULA WAJIB: [Shot Type & Camera Angle], [Subject & Action], [Environment & Lighting], [Camera Movement/Composition], [Style/Aesthetic].
3. Pergerakan kamera aktif (khusus video): "slow push-in", "sweeping orbital", "crane down and tilt up", "zoom out to reveal".
4. DILARANG menampilkan visual secara harfiah. Gunakan metafora visual (misal: DNA → glowing double-helix hologram, bukan gambar manusia berdiri).
5. Integrasi Gaya Estetika: Leburkan gaya visual ke dalam deskripsi kalimat, bukan hanya menempelkan kata kunci di akhir.
6. DILARANG mencantumkan parameter referensi kosong seperti "--cref [url]" atau "--sref [url]" jika data URL tidak disediakan.

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

[PANDUAN PACING & RHYTHM NARASI]
1. Scene 1 (Hook): Kalimat pendek, cepat, staccato. Maksimal 2-3 kalimat singkat. Tujuan: menghentikan scroll dalam 3 detik.
2. Scene Tengah (Body): Perlambat pacing. Kalimat lebih panjang dan detail.
3. Scene Akhir (CTA): Kembali ke pacing cepat. Kalimat imperatif dan berenergi.

[PANDUAN EMOTIONAL ARC / BUSUR EMOSI]
1. Rancang busur emosi: Kejutan/Rasa Ingin Tahu (Hook) → Empati/Kekhawatiran (Problem) → Harapan (Solution) → Motivasi (CTA).
2. Setiap scene punya satu emosi dominan yang jelas.
3. Gunakan Visual Prompt untuk memperkuat emosi dominan.

[PANDUAN ENGAGEMENT TRIGGERS]
1. Sisipkan minimal 1-2 trigger interaksi (misal: "Coba tebak...", "Kalian tim mana nih?", "Tulis di komentar...").
2. Engagement trigger harus terasa natural dan relevan dengan konteks cerita.
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
  let productContext = "";
  if (videoConfig.selectedProduct) {
    productContext = `\n[PRODUK YANG DIPROMOSIKAN]\n- ${videoConfig.selectedProduct.name} (Rp ${videoConfig.selectedProduct.price}): ${videoConfig.selectedProduct.description || "-"}`;
  } else if (channel.products && channel.products.length > 0) {
    productContext = `\n[PRODUK UNTUK SOFT-SELLING]\n${channel.products.map((p) => `- ${p.name} (Rp ${p.price}): ${p.description || "-"}`).join("\n")}`;
  }

  // ── Additional Context ─────────────────────────────────────────────────
  const contextText = additionalContext ? `\n[KONTEKS TAMBAHAN]\n${additionalContext}` : "";

  // ── Platform ───────────────────────────────────────────────────────────
  const platformText = videoConfig.targetPlatform
    ? `\n[PLATFORM TARGET]\nKonten ini ditargetkan untuk: ${videoConfig.targetPlatform}. Sesuaikan format bahasa, durasi, dan layout visual.`
    : "";

  // ── Assemble Master Prompt ─────────────────────────────────────────────
  const masterPrompt = `${povSection}[TOPIK UTAMA]\n${topic}${contextText}${productContext}${compositionText}${platformText}${excludeSection}${durationText}${formatOutputWajib}${cameraMovementGuide}\n\n${allGuidelines}`;

  return { masterPrompt, systemInstruction };
}
