import type { Scene, MultiPlatformSeoData, ThumbnailData } from "@/lib/parsers";

export interface PublishChannelProfile {
  channelName: string;
  niche?: string | null;
  targetPlatform?: string | null;
  cta1?: string | null;
  cta2?: string | null;
  personaPov?: string | null;
  socialLinks?: Record<string, string> | null;
}

export interface PublishInputContent {
  title?: string;
  projectTitle?: string;
  scenes?: Scene[];
  caption?: string;
  hashtags?: string;
  multiPlatformSeo?: MultiPlatformSeoData | null;
  thumbnailData?: ThumbnailData | null;
  segmentKey?: "short1" | "short2" | "long" | null;
  aspectRatio?: "9:16" | "16:9" | string;
  channel?: PublishChannelProfile | null;
  privacyStatus?: "public" | "unlisted" | "private";
}

export interface AdaptedYouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
  privacyStatus: "public" | "unlisted" | "private";
  isShorts: boolean;
}

export interface AdaptedInstagramMetadata {
  caption: string;
  mediaType: "REELS" | "FEED";
}

export interface AdaptedFacebookMetadata {
  title: string;
  description: string;
}

export interface AdaptedPublishMetadata {
  youtube: AdaptedYouTubeMetadata;
  instagram: AdaptedInstagramMetadata;
  facebook: AdaptedFacebookMetadata;
}

/**
 * Truncate text cleanly at word boundaries up to maxLen characters.
 */
function cleanTruncate(text: string, maxLen: number): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  const sub = trimmed.substring(0, maxLen);
  const lastSpace = sub.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.7) {
    return sub.substring(0, lastSpace).trim();
  }
  return sub.trim();
}

/**
 * Extract an array of distinct hashtags from raw string.
 */
function parseHashtagList(rawHashtags?: string): string[] {
  if (!rawHashtags) return [];
  const matches = rawHashtags.match(/#[a-zA-Z0-9_]+/g);
  if (matches) {
    return Array.from(new Set(matches.map((h) => h.trim())));
  }
  return rawHashtags
    .split(/[\s,]+/)
    .map((w) => w.trim())
    .filter((w) => Boolean(w))
    .map((w) => (w.startsWith("#") ? w : `#${w}`));
}

/**
 * Extract clean keyword tags without hashtag symbols.
 */
function parseTagsList(rawTags?: string): string[] {
  if (!rawTags) return [];
  return Array.from(
    new Set(
      rawTags
        .split(/[,;\n]+/)
        .map((t) => t.replace(/[[\]*#]/g, "").trim())
        .filter((t) => t.length > 1)
    )
  );
}

/**
 * Adaptasi output dari Parse Engine menjadi payload metadata siap publikasi
 * untuk YouTube, Instagram Reels, dan Facebook Page.
 */
export function adaptPublishMetadata(input: PublishInputContent): AdaptedPublishMetadata {
  const {
    title,
    projectTitle,
    scenes = [],
    caption,
    hashtags,
    multiPlatformSeo,
    aspectRatio = "9:16",
    channel,
    privacyStatus = "public",
  } = input;

  // 1. Tentukan Judul Utama
  const rawTitle = title || projectTitle || "Video Konten Baru";
  const cleanTitle = rawTitle.replace(/[[\]"*]/g, "").trim();

  // 2. Tentukan Narasi / Ringkasan Skrip
  const narrationBody =
    caption ||
    scenes
      .slice(0, 3)
      .map((s) => s.narasi)
      .filter(Boolean)
      .join(" ")
      .trim();

  const isVertical = aspectRatio === "9:16";

  // ── YOUTUBE METADATA ────────────────────────────────────────────────────────
  const ytSeo = multiPlatformSeo?.youtube;
  const ytTitleCandidate = ytSeo?.description
    ? cleanTitle
    : cleanTitle;
  const youtubeTitle = cleanTruncate(ytTitleCandidate, 100);

  // Komposisi Deskripsi YouTube (Maks 5000 karakter)
  const ytDescParts: string[] = [];
  if (ytSeo?.description) {
    ytDescParts.push(ytSeo.description.trim());
  } else if (narrationBody) {
    ytDescParts.push(narrationBody);
  }

  // Tambahkan Channel CTA
  if (channel?.cta1) {
    ytDescParts.push(`\n👉 ${channel.cta1.trim()}`);
  }
  if (channel?.cta2) {
    ytDescParts.push(`🔔 ${channel.cta2.trim()}`);
  }

  // Tambahkan Bab / Chapters jika ada di naskah scene
  const chapters = scenes
    .filter((s) => Boolean(s.chapterTitle))
    .map((s, idx) => `00:${String(idx * 15).padStart(2, "0")} - ${s.chapterTitle}`);
  if (chapters.length > 1) {
    ytDescParts.push(`\n📌 Chapters:\n${chapters.join("\n")}`);
  }

  // Tambahkan Hashtags di akhir deskripsi
  const allHashtags = parseHashtagList(ytSeo?.hashtags || hashtags);
  if (allHashtags.length > 0) {
    ytDescParts.push(`\n${allHashtags.slice(0, 10).join(" ")}`);
  }

  const youtubeDescription = cleanTruncate(ytDescParts.join("\n"), 5000);

  // YouTube Tags box
  let ytTags = parseTagsList(ytSeo?.tags);
  if (ytTags.length === 0 && channel?.niche) {
    ytTags.push(channel.niche);
  }
  if (allHashtags.length > 0) {
    ytTags.push(...allHashtags.map((h) => h.replace("#", "")));
  }
  // Batasi total panjang karakter tag di YouTube (~450 karakter)
  const boundedYtTags: string[] = [];
  let totalTagChars = 0;
  for (const tag of Array.from(new Set(ytTags))) {
    if (totalTagChars + tag.length + 1 > 450) break;
    boundedYtTags.push(tag);
    totalTagChars += tag.length + 1;
  }

  // ── INSTAGRAM REELS / FEED METADATA ─────────────────────────────────────────
  const igSeo = multiPlatformSeo?.instagram;
  const igCaptionParts: string[] = [];

  // Baris 1: Catchy Hook / Judul
  igCaptionParts.push(`🎬 ${cleanTitle}`);

  // Narasi / Inti pesan
  if (igSeo?.description) {
    igCaptionParts.push(`\n${igSeo.description.trim()}`);
  } else if (narrationBody) {
    igCaptionParts.push(`\n${cleanTruncate(narrationBody, 400)}`);
  }

  // Call to action
  if (channel?.cta1) {
    igCaptionParts.push(`\n👉 ${channel.cta1.trim()}`);
  } else {
    igCaptionParts.push("\n👉 Simpan & share video ini ke teman kamu!");
  }

  // Spacing & Hashtags (Ideal 5-10 targeted tags)
  const igHashtags = parseHashtagList(igSeo?.hashtags || hashtags);
  if (igHashtags.length > 0) {
    igCaptionParts.push(`\n.\n.\n${igHashtags.slice(0, 15).join(" ")}`);
  }

  const instagramCaption = cleanTruncate(igCaptionParts.join(""), 2200);

  // ── FACEBOOK PAGE METADATA ──────────────────────────────────────────────────
  const fbSeo = multiPlatformSeo?.facebook;
  const fbDescParts: string[] = [];
  if (fbSeo?.description) {
    fbDescParts.push(fbSeo.description.trim());
  } else if (narrationBody) {
    fbDescParts.push(narrationBody);
  }
  if (channel?.cta1) {
    fbDescParts.push(`\n👉 ${channel.cta1.trim()}`);
  }
  const fbHashtags = parseHashtagList(fbSeo?.hashtags || hashtags);
  if (fbHashtags.length > 0) {
    fbDescParts.push(`\n${fbHashtags.slice(0, 5).join(" ")}`);
  }

  const facebookDescription = cleanTruncate(fbDescParts.join("\n"), 3000);

  return {
    youtube: {
      title: youtubeTitle,
      description: youtubeDescription,
      tags: boundedYtTags,
      privacyStatus,
      isShorts: isVertical,
    },
    instagram: {
      caption: instagramCaption,
      mediaType: isVertical ? "REELS" : "FEED",
    },
    facebook: {
      title: cleanTruncate(cleanTitle, 100),
      description: facebookDescription,
    },
  };
}
