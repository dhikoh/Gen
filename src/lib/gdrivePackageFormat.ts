import {
  buildSegmentMultiPlatformSeo,
  type Scene,
  type ThumbnailData,
  type PlatformSeoItem,
  type MultiPlatformSeoData,
} from "@/lib/parsers";

/**
 * Format teks metadata SEO per platform untuk Google Drive.
 */
export function formatPlatformSeoText(
  platform: "youtube" | "tiktok" | "instagram" | "facebook",
  data: Partial<PlatformSeoItem> & { description?: string; hashtags?: string; tags?: string },
  projectTitle: string
): string {
  const platformNames: Record<typeof platform, string> = {
    youtube: "YOUTUBE METADATA & SEO — PROMPT GEN",
    tiktok: "TIKTOK CAPTION & SEARCH KEYWORDS — PROMPT GEN",
    instagram: "INSTAGRAM REELS & FEED CAPTION — PROMPT GEN",
    facebook: "FACEBOOK VIDEO & COMMUNITY POST — PROMPT GEN",
  };

  const banner = platformNames[platform];
  const dateStr = new Date().toISOString().slice(0, 10);

  const lines: string[] = [
    "=".repeat(80),
    banner,
    `Judul Konten : ${projectTitle || "Untitled"}`,
    `Platform     : ${platform.toUpperCase()}`,
    `Dibuat Pada  : ${dateStr}`,
    "=".repeat(80),
    "",
  ];

  if (platform === "youtube") {
    lines.push("[DESKRIPSI VIDEO (SEO & VALUE PROMISE)]");
    lines.push(data.description || "-");
    lines.push("");
    lines.push("-".repeat(80));
    lines.push("[HASHTAGS]");
    lines.push(data.hashtags || "-");
    lines.push("");
    lines.push("-".repeat(80));
    lines.push("[TAGS YOUTUBE STUDIO (KOMA-SEPARATED)]");
    lines.push(data.tags || "-");
    lines.push("");
  } else if (platform === "tiktok") {
    lines.push("[TIKTOK CAPTION & SEARCH HOOK (<300 KARAKTER)]");
    lines.push(data.description || "-");
    lines.push("");
    lines.push("-".repeat(80));
    lines.push("[TARGETED HASHTAGS]");
    lines.push(data.hashtags || "-");
    lines.push("");
    lines.push("-".repeat(80));
    lines.push("[PREDICTIVE SEARCH BAR KEYWORDS]");
    lines.push(data.tags || "-");
    lines.push("");
  } else if (platform === "instagram") {
    lines.push("[INSTAGRAM CAPTION (HOOK BARIS-1 + CLEAN SPACING)]");
    lines.push(data.description || "-");
    lines.push("");
    lines.push("-".repeat(80));
    lines.push("[COMMUNITY & NICHE HASHTAGS]");
    lines.push(data.hashtags || "-");
    lines.push("");
    lines.push("-".repeat(80));
    lines.push("[EXPLORE SEARCH TOPICS]");
    lines.push(data.tags || "-");
    lines.push("");
  } else {
    // facebook
    lines.push("[FACEBOOK CAPTION & COMMUNITY HOOK]");
    lines.push(data.description || "-");
    lines.push("");
    lines.push("-".repeat(80));
    lines.push("[CLEAN HASHTAGS]");
    lines.push(data.hashtags || "-");
    lines.push("");
    lines.push("-".repeat(80));
    lines.push("[INTERACTION TOPICS]");
    lines.push(data.tags || "-");
    lines.push("");
  }

  if (data.charCount) {
    lines.push("-".repeat(80));
    lines.push("[STATISTIK PANJANG TEKS]");
    lines.push(`• Panjang Deskripsi : ${data.charCount.description} karakter`);
    lines.push(`• Panjang Hashtags  : ${data.charCount.hashtags} karakter`);
    lines.push(`• Panjang Tags      : ${data.charCount.tags} karakter`);
    if (data.status?.descriptionWarning) {
      lines.push(`• Catatan Evaluasi  : ⚠️ ${data.status.descriptionWarning}`);
    } else if (data.status?.descriptionIdeal) {
      lines.push("• Catatan Evaluasi  : ✨ Panjang deskripsi ideal sesuai standar platform.");
    }
  }

  lines.push("=".repeat(80));
  return lines.join("\n");
}

/**
 * Format naskah breakdown scene lengkap untuk Google Drive.
 */
export function formatFullScriptText(
  scenes: Scene[],
  projectTitle: string,
  segmentLabel?: string
): string {
  const totalDuration = scenes.reduce(
    (acc, s) => acc + (s.estimatedDurationSec || Number(s.durasi?.replace(/\D/g, "")) || 0),
    0
  );
  const totalWords = scenes.reduce(
    (acc, s) => acc + (s.narasi ? s.narasi.trim().split(/\s+/).filter(Boolean).length : 0),
    0
  );

  const lines: string[] = [
    "=".repeat(80),
    "NASKAH LENGKAP & BREAKDOWN SCENE — PROMPT GEN",
    `Judul Konten  : ${projectTitle || "Untitled"}`,
    ...(segmentLabel ? [`Segmen Konten : ${segmentLabel}`] : []),
    `Total Scene   : ${scenes.length} Adegan`,
    `Estimasi Waktu: ~${totalDuration} Detik (${Math.round(totalDuration / 60)} Menit)`,
    `Estimasi Kata : ~${totalWords} Kata Narasi`,
    "=".repeat(80),
    "",
  ];

  scenes.forEach((s) => {
    const durSec = s.estimatedDurationSec || Number(s.durasi?.replace(/\D/g, "")) || 0;
    lines.push(`### SCENE ${s.sceneNumber} (${durSec}s | ${s.durasi || ""})`);
    if (s.chapterTitle || s.chapter) {
      lines.push(`[BAB / CHAPTER]: ${s.chapterTitle || `Bab ${s.chapter}`}`);
    }
    if (s.targetEmosi) {
      lines.push(`[TARGET EMOSI]: ${s.targetEmosi}`);
    }
    if (s.teknikPacing) {
      lines.push(`[PACING]: ${s.teknikPacing}`);
    }
    lines.push(`[NARASI AUDIO / VO]:`);
    lines.push(s.narasi || "-");
    lines.push("");

    if (s.visual) {
      lines.push(`[VISUAL PROMPT]:`);
      lines.push(s.visual);
      lines.push("");
    }
    if (s.sceneContext) {
      lines.push(`[KONTEKS VISUAL]: ${s.sceneContext}`);
    }
    if (s.settingKamera) {
      lines.push(`[SETTING KAMERA / KOMPONEN]: ${s.settingKamera}`);
    }
    if (s.teksOverlay) {
      lines.push(`[TEXT OVERLAY]: ${s.teksOverlay}`);
    }
    lines.push("-".repeat(40));
    lines.push("");
  });

  lines.push("=".repeat(80));
  return lines.join("\n");
}

/**
 * Format konsep thumbnail dan prompt Midjourney untuk Google Drive.
 */
export function formatThumbnailPromptText(
  thumbnail: ThumbnailData,
  projectTitle: string
): string {
  const lines: string[] = [
    "=".repeat(80),
    "KONSEP & PROMPT THUMBNAIL STUDIO — PROMPT GEN",
    `Judul Konten: ${projectTitle || "Untitled"}`,
    "=".repeat(80),
    "",
  ];

  if (thumbnail.opsi1Overlay || thumbnail.opsi1Prompt) {
    lines.push("--- OPSI THUMBNAIL 1 ---");
    if (thumbnail.opsi1Overlay) {
      lines.push(`[TEKS OVERLAY]: ${thumbnail.opsi1Overlay}`);
    }
    if (thumbnail.opsi1Prompt) {
      lines.push(`[PROMPT MIDJOURNEY / FLUX]:`);
      lines.push(thumbnail.opsi1Prompt);
    }
    lines.push("");
  }

  if (thumbnail.opsi2Overlay || thumbnail.opsi2Prompt) {
    lines.push("--- OPSI THUMBNAIL 2 ---");
    if (thumbnail.opsi2Overlay) {
      lines.push(`[TEKS OVERLAY]: ${thumbnail.opsi2Overlay}`);
    }
    if (thumbnail.opsi2Prompt) {
      lines.push(`[PROMPT MIDJOURNEY / FLUX]:`);
      lines.push(thumbnail.opsi2Prompt);
    }
    lines.push("");
  }

  if (thumbnail.seoText) {
    lines.push(`[DESKRIPSI / KONSEP VISUAL]:`);
    lines.push(thumbnail.seoText);
    lines.push("");
  }

  if (thumbnail.recommendations) {
    lines.push(`[REKOMENDASI KOMPOSISI]:`);
    lines.push(thumbnail.recommendations);
    lines.push("");
  }

  lines.push("=".repeat(80));
  return lines.join("\n");
}

/**
 * Mengemas paket file teks metadata & naskah untuk suatu segmen/konten.
 */
export function buildTextPackageFiles(params: {
  projectTitle: string;
  scenes: Scene[];
  caption?: string;
  hashtags?: string;
  multiPlatformSeo?: MultiPlatformSeoData | null;
  thumbnailData?: ThumbnailData | null;
  segmentLabel?: string;
  aspectRatio?: string;
}): Array<{ filename: string; mimeType: string; content: string }> {
  const { projectTitle, scenes, caption, hashtags, multiPlatformSeo, thumbnailData, segmentLabel, aspectRatio } = params;
  const files: Array<{ filename: string; mimeType: string; content: string }> = [];

  const defaultDesc = caption || "";
  const defaultHashtags = hashtags || "";
  const hasPlatformData = Boolean(
    multiPlatformSeo ||
    defaultDesc ||
    defaultHashtags
  );

  // 1. Metadata 4 Platform terpisah (Gunakan multiPlatformSeo jika ada, atau adaptasikan cerdas dari segmen)
  if (hasPlatformData) {
    const effectiveSeo = multiPlatformSeo || buildSegmentMultiPlatformSeo({
      title: projectTitle,
      caption: defaultDesc,
      hashtags: defaultHashtags,
      scenes,
      aspectRatio: aspectRatio === "9:16" ? "9:16" : "16:9",
    });

    const ytData = effectiveSeo.youtube || {
      platform: "youtube" as const,
      description: defaultDesc,
      hashtags: defaultHashtags,
      tags: "",
      charCount: { description: defaultDesc.length, hashtags: defaultHashtags.length, tags: 0 },
      status: { descriptionIdeal: true },
    };
    files.push({
      filename: "youtube_metadata.txt",
      mimeType: "text/plain",
      content: formatPlatformSeoText("youtube", ytData, projectTitle),
    });

    const ttData = effectiveSeo.tiktok || {
      platform: "tiktok" as const,
      description: defaultDesc.slice(0, 300),
      hashtags: defaultHashtags,
      tags: "",
      charCount: { description: Math.min(defaultDesc.length, 300), hashtags: defaultHashtags.length, tags: 0 },
      status: { descriptionIdeal: true },
    };
    files.push({
      filename: "tiktok_metadata.txt",
      mimeType: "text/plain",
      content: formatPlatformSeoText("tiktok", ttData, projectTitle),
    });

    const igData = effectiveSeo.instagram || {
      platform: "instagram" as const,
      description: defaultDesc,
      hashtags: defaultHashtags,
      tags: "",
      charCount: { description: defaultDesc.length, hashtags: defaultHashtags.length, tags: 0 },
      status: { descriptionIdeal: true },
    };
    files.push({
      filename: "instagram_metadata.txt",
      mimeType: "text/plain",
      content: formatPlatformSeoText("instagram", igData, projectTitle),
    });

    const fbData = effectiveSeo.facebook || {
      platform: "facebook" as const,
      description: defaultDesc,
      hashtags: defaultHashtags,
      tags: "",
      charCount: { description: defaultDesc.length, hashtags: defaultHashtags.length, tags: 0 },
      status: { descriptionIdeal: true },
    };
    files.push({
      filename: "facebook_metadata.txt",
      mimeType: "text/plain",
      content: formatPlatformSeoText("facebook", fbData, projectTitle),
    });
  }

  // 2. Naskah scene lengkap
  if (scenes && scenes.length > 0) {
    files.push({
      filename: "naskah_scene_lengkap.txt",
      mimeType: "text/plain",
      content: formatFullScriptText(scenes, projectTitle, segmentLabel),
    });
  }

  // 3. Konsep thumbnail jika ada
  if (
    thumbnailData &&
    (thumbnailData.opsi1Prompt ||
      thumbnailData.opsi2Prompt ||
      thumbnailData.opsi1Overlay ||
      thumbnailData.seoText)
  ) {
    files.push({
      filename: "thumbnail_prompt.txt",
      mimeType: "text/plain",
      content: formatThumbnailPromptText(thumbnailData, projectTitle),
    });
  }

  return files;
}
