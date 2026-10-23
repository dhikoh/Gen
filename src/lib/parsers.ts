/**
 * Shared parsing utilities for both the Prompt Generator and Scene Prompt
 * Studio pages. Ported from Push app and adapted for Prompt Gen i18n/SaaS.
 *
 * All functions are client-safe (no server-only imports).
 */

import { MAX_SCENE_COUNT } from "@/lib/sceneLimits";
import type { SourceAuditData, FunnelPackData, FunnelSegment } from "@/types/generator";

// ── Markdown / Value Cleaning ─────────────────────────────────────────────

/** Strip Markdown link wrappers, returning only the raw URL. */
export function cleanMarkdownLinks(text: string): string {
  if (!text) return "";
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, _label, url) => {
    return url.trim();
  });
}

/** Remove leading/trailing brackets, quotes, asterisks, colons, underscores, and horizontal rules. */
export function cleanValue(val: string): string {
  let cleaned = val.trim();
  if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  return cleaned;
}

/** Deep-clean a parsed value: strip trailing HR, leading/trailing asterisks, colons, underscores. */
export function cleanParsedValue(val: string): string {
  if (!val) return "";
  let cleaned = val.trim();

  // 1. Remove trailing horizontal rules (e.g., \n---\n or \n***\n)
  cleaned = cleaned.replace(/[\r\n\s]*[-*_]{3,}[\r\n\s]*$/, "");

  // 2. Loop to clean leading/trailing asterisks, underscores, colons, and whitespace
  while (true) {
    const prev = cleaned;
    cleaned = cleaned
      .replace(/^[\s*:*_*]+/, "")
      .replace(/[\s*:*_*]+$/, "")
      .trim();
    if (cleaned === prev) break;
  }
  return cleaned;
}

// ── Thumbnail Extraction ──────────────────────────────────────────────────

export interface ThumbnailData {
  raw: string;
  seoText: string;
  opsi1Prompt: string;
  opsi1Overlay: string;
  opsi2Prompt: string;
  opsi2Overlay: string;
  recommendations: string;
}

/** Extract structured thumbnail data from an AI-generated output string. */
export function extractThumbnailData(text: string): ThumbnailData | null {
  const match = text.match(
    /(?:^|\r?\n|^)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:THUMBNAIL STUDIO|IMAGE PROMPT|THUMBNAIL VISUAL PROMPT|THUMBNAIL PROMPT|THUMBNAIL)/i,
  );
  const index = match?.index !== undefined ? match.index : -1;
  if (index === -1) return null;

  let thumbnailPart = text.substring(index).trim();
  const stopMatch = thumbnailPart.match(/(?:\r?\n|^)\s*(?:#{1,6}\s*|\*{2,3}\s*|\b)(?:HTML\s*BLOG|REKOMENDASI\s*PRODUK)/i);
  if (stopMatch && stopMatch.index !== undefined && stopMatch.index > 0) {
    thumbnailPart = thumbnailPart.substring(0, stopMatch.index).trim();
  }

  const keys = [
    { field: "seoText" as const, pattern: /(?:^|\r?\n|^)\s*(?:\*\*)?(?:TEKS\s+OVERLAY\s+SEO|SEO\s+OVERLAY\s+TEXT|SEO\s+TEXT|TEKS\s+OVERLAY)(?::\s*\*\*|\*\*\s*:|:)\s*/i },
    { field: "opsi1Prompt" as const, pattern: /(?:^|\r?\n|^)\s*(?:\*\*)?(?:OPSI\s+1\s+(?:VISUAL\s+)?PROMPT|OPSI\s+1|OPTION\s+1\s+(?:VISUAL\s+)?PROMPT|OPTION\s+1)(?::\s*\*\*|\*\*\s*:|:)\s*/i },
    { field: "opsi1Overlay" as const, pattern: /(?:^|\r?\n|^)\s*(?:\*\*)?(?:OPSI\s+1\s+TEKS\s+OVERLAY|OPTION\s+1\s+TEXT\s+OVERLAY|TEXT\s+OVERLAY\s+OPTION\s+1|TEKS\s+OVERLAY\s+OPSI\s+1)(?::\s*\*\*|\*\*\s*:|:)\s*/i },
    { field: "opsi2Prompt" as const, pattern: /(?:^|\r?\n|^)\s*(?:\*\*)?(?:OPSI\s+2\s+(?:VISUAL\s+)?PROMPT|OPSI\s+2|OPTION\s+2\s+(?:VISUAL\s+)?PROMPT|OPTION\s+2)(?::\s*\*\*|\*\*\s*:|:)\s*/i },
    { field: "opsi2Overlay" as const, pattern: /(?:^|\r?\n|^)\s*(?:\*\*)?(?:OPSI\s+2\s+TEKS\s+OVERLAY|OPTION\s+2\s+TEXT\s+OVERLAY|TEXT\s+OVERLAY\s+OPTION\s+2|TEKS\s+OVERLAY\s+OPSI\s+2)(?::\s*\*\*|\*\*\s*:|:)\s*/i },
    { field: "recommendations" as const, pattern: /(?:^|\r?\n|^)\s*(?:\*\*)?(?:REKOMENDASI\s+WARNA\s*(?:&\s*ELEMEN)?|REKOMENDASI|RECOMMENDATIONS)(?::\s*\*\*|\*\*\s*:|:)\s*/i },
  ];

  const cv = (v: string) => {
    if (!v) return "";
    return cleanParsedValue(v);
  };

  const keyPatternStr = keys.map(k => k.pattern.source).join("|");

  const result: ThumbnailData = {
    raw: thumbnailPart,
    seoText: "",
    opsi1Prompt: "",
    opsi1Overlay: "",
    opsi2Prompt: "",
    opsi2Overlay: "",
    recommendations: "",
  };

  for (const k of keys) {
    const reg = new RegExp(`(?:${k.pattern.source})([\\s\\S]*?)(?=(?:${keyPatternStr})|$)`, "i");
    const m = thumbnailPart.match(reg);
    if (m && m[1]) {
      result[k.field] = cv(m[1]);
    }
  }

  return result;
}

// ── Caption & Hashtags ────────────────────────────────────────────────────

/** Extract the CAPTION block from an AI output. */
export function extractCaption(text: string): string {
  if (!text) return "";
  const m = text.match(
    /(?:CAPTION|DESKRIPSI)\s*:?\s*([\s\S]*?)(?=(?:HASHTAGS|HASHTAG|SCENE|ADEGAN|BAGIAN|##|$))/i,
  );
  return m ? cleanMarkdownLinks(cleanParsedValue(m[1])) : "";
}

/** Extract the HASHTAGS block from an AI output. */
export function extractHashtags(text: string): string {
  if (!text) return "";
  const m = text.match(
    /(?:HASHTAGS|HASHTAG)\s*:?\s*([\s\S]*?)(?=(?:CAPTION|SCENE|ADEGAN|BAGIAN|##|$))/i,
  );
  return m ? cleanMarkdownLinks(cleanParsedValue(m[1])) : "";
}

// ── Audio Cue Extraction ──────────────────────────────────────────────────

export interface AudioCues {
  cleanNarasi: string;
  bgmCues: string[];
  sfxCues: string[];
  ambientCues: string[];
  isDiegetic?: boolean;
}

/**
 * Normalizes stage direction and acting cues in narration from parentheses into standard bracket notation.
 * e.g. "(wide-eyed, urgent whisper)" -> "[wide-eyed, urgent whisper]"
 * "(beat)" -> "[beat]", "(pause)" -> "[pause]", "*(urgent)*" -> "[urgent]"
 * Preserves cues that are already in bracket notation.
 */
export function normalizeActingCuesToBrackets(text: string): string {
  if (!text) return "";
  return text
    // Convert *(stage direction)*, _(stage direction)_, or (stage direction) to [stage direction]
    .replace(/(?:\*|_)?\s*\(([^)]+)\)\s*(?:\*|_)?/g, (_match, cue) => ` [${cue.trim()}] `)
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract [SFX: …], [AMBIENT: …], and [BGM: …] cues and diegetic status from narration text. */
export function extractAudioCues(text: string): AudioCues {
  const bgmRegex = /\[(?:bgm|backsound):\s*([^\]]+)\]/gi;
  const sfxRegex = /\[(?:sfx|sound):\s*([^\]]+)\]/gi;
  const ambientRegex = /\[(?:ambient|foley|atmos|atmosphere|suara\s*alami):\s*([^\]]+)\]/gi;
  const diegeticRegex = /\[(?:diegetic|tanpa\s*voice-?over|no\s*voice-?over)(?:\s*-\s*[^\]]+)?\]/gi;

  const bgmCues = Array.from(text.matchAll(bgmRegex)).map((m) => m[1].trim());
  const sfxCues = Array.from(text.matchAll(sfxRegex)).map((m) => m[1].trim());
  const ambientCues = Array.from(text.matchAll(ambientRegex)).map((m) => m[1].trim());
  const isDiegetic = diegeticRegex.test(text) || /diegetic\s*only/i.test(text);

  let cleanNarasi = text
    .replace(/\[(?:SFX|sfx)\b[^\]]*\]/gi, "")
    .replace(/\[(?:Sound|sound)\s*[:\-][^\]]*\]/gi, "")
    .replace(/\[(?:BGM|bgm|Backsound|backsound)\b[^\]]*\]/gi, "")
    .replace(/\[(?:ambient|foley|atmos|atmosphere|suara\s*alami)\b[^\]]*\]/gi, "")
    .replace(/\[(?:diegetic|tanpa\s*voice-?over|no\s*voice-?over)(?:\s*-\s*[^\]]+)?\]/gi, "")
    .replace(/dilarang ada narasi\/voice-over luar adegan[^\n.]*(?:\.|$)/gi, "")
    .replace(/hanya suara diegetic\/in-scene[^\n.]*(?:\.|$)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Normalize acting / stage direction cues from parentheses (...) into standard bracket [...] notation
  cleanNarasi = normalizeActingCuesToBrackets(cleanNarasi);

  // If narration is empty or only hyphens/quotes/whitespace
  if (/^[-—\s"':]+$/.test(cleanNarasi)) {
    cleanNarasi = "";
  }

  return { cleanNarasi, bgmCues, sfxCues, ambientCues, isDiegetic };
}

/** Detect audio hints embedded in a Visual Prompt string. */
export function extractVisualAudioHint(visualText: string): string | null {
  if (!visualText) return null;

  const hints: string[] = [];

  if (/silent\s*audio|no\s*(?:sound\s*effects?|background\s*music)/i.test(visualText)) {
    hints.push("Silent - No Audio");
  }
  if (/no\s*voice\s*over|no\s*voiceover/i.test(visualText)) {
    hints.push("No Voice Over");
  }

  const sfxRegex = /\[(?:sfx|sound):\s*([^\]]+)\]/gi;
  const bgmRegex = /\[(?:bgm|backsound):\s*([^\]]+)\]/gi;
  const ambientRegex = /\[(?:ambient|foley|atmos|atmosphere|suara\s*alami):\s*([^\]]+)\]/gi;

  const bgmMatches = Array.from(visualText.matchAll(bgmRegex)).map((m) => `BGM: ${m[1].trim()}`);
  const sfxMatches = Array.from(visualText.matchAll(sfxRegex)).map((m) => `SFX: ${m[1].trim()}`);
  const ambientMatches = Array.from(visualText.matchAll(ambientRegex)).map((m) => `Ambient: ${m[1].trim()}`);

  const combined = [...hints, ...bgmMatches, ...sfxMatches, ...ambientMatches];
  return combined.length > 0 ? combined.join(" | ") : null;
}

// ── Voice Guidelines ──────────────────────────────────────────────────────

export interface VoiceGuidelines {
  sampleContext?: string;
  directorsNote?: string;
  traits?: string;
  sync?: string;
}

/** Parse voice guidelines from a "Context: … | Note: … | Traits: … | Sync: …" string. */
export function parseVoiceGuidelines(val: string): VoiceGuidelines | undefined {
  if (!val) return undefined;
  const cleanVal = val.trim().replace(/^\[|\]$/g, "");
  const parts = cleanVal.split("|").reduce(
    (acc, part) => {
      const colonIdx = part.indexOf(":");
      if (colonIdx !== -1) {
        const key = part.substring(0, colonIdx).trim().toLowerCase();
        const value = part.substring(colonIdx + 1).trim();
        if (key.includes("context")) acc.sampleContext = value;
        else if (key.includes("note") || key.includes("direct")) acc.directorsNote = value;
        else if (key.includes("trait")) acc.traits = value;
        else if (key.includes("sync")) acc.sync = value;
      }
      return acc;
    },
    {} as VoiceGuidelines,
  );

  return Object.keys(parts).length > 0 ? parts : undefined;
}

// ── Title Extraction ──────────────────────────────────────────────────────

/** Words that indicate a line is part of the script body, not a title. */
const TITLE_BLACKLIST_KEYWORDS = [
  "analisis", "strategi", "audiens", "persona", "psikologi", "hook",
  "alur", "platform", "caption", "hashtag", "scene", "adegan",
  "visual", "durasi", "thumbnail", "sfx", "bgm", "blogger", "artikel",
  "rekomendasi", "over-the-shoulder", "dialog", "voice over", "vo",
  "alasan", "potensi", "target", "format", "dekonstruksi", "intisari",
  "pain point", "transformasi", "value promise", "kontras", "masalah",
];

/** Extract up to 10 title candidates from an AI output. */
export function extractTitles(text: string): string[] {
  const titles: string[] = [];
  const lines = text.split("\n");
  // Pattern 1: "JUDUL 1: ..." or "JUDUL: ..."
  const exactPattern =
    /^(?:\d+[.\-)]|-|\*|\s)*\s*(?:JUDUL|TITLE|JUDUL\s+TERPILIH|JUDUL\s+PILIHAN|SELECTED\s+TITLE|JUDUL\s+UTAMA|MAIN\s+TITLE)\s*\d*\s*:\s*(.+)/i;
  // Pattern 2: "1. \"Judul ini\"" or "1. *Judul ini*" (numbered list with quotes or bold)
  const numberedPattern = /^\d+[.)\-]\s*["*\u201c\u201d]?(.+?)["*\u201c\u201d]?\s*(?:\(\d+%\))?$/;
  let inTitleSection = false;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const lowerLine = line.toLowerCase();

    // Activate on title header
    const isTitleHeader = line.startsWith("#") && (lowerLine.includes("judul") || lowerLine.includes("title"));
    const isTitleKeywordHeader =
      lowerLine.includes("bagian title") ||
      lowerLine.includes("variasi judul") ||
      lowerLine.includes("rekomendasi judul") ||
      lowerLine.includes("riset & variasi judul");

    if (isTitleHeader || isTitleKeywordHeader) {
      inTitleSection = true;
      continue;
    } else if (
      (line.startsWith("#") && !lowerLine.includes("judul") && !lowerLine.includes("title")) ||
      (line.startsWith("**") && line.endsWith("**") && !lowerLine.includes("judul") && !lowerLine.includes("title")) ||
      /^[A-Z0-9\s&]+:/.test(line.replace(/^(?:\d+[.\-)]|-|\*)?\s*/, "").replace(/[[\]*#]/g, "").trim())
    ) {
      inTitleSection = false;
    }

    const exactMatch = line.match(exactPattern);
    if (exactMatch) {
      const titleText = exactMatch[1].replace(/[[\]"*]/g, "").trim();
      if (titleText && !titles.includes(titleText)) {
        const lt = titleText.toLowerCase();
        if (!TITLE_BLACKLIST_KEYWORDS.some((kw) => lt.includes(kw))) {
          titles.push(titleText);
        }
      }
    } else if (inTitleSection) {
      // Try numbered list pattern inside title section ("1. \"Title\" (85%)")  
      const numberedMatch = line.match(numberedPattern);
      const rawLine = numberedMatch ? numberedMatch[1].trim() : line;
      const cleanLine = rawLine
        .replace(/^(?:\d+[.\-)]|-|\*)?\s*/, "")
        .replace(/[[\]*#"]/g, "")
        .replace(/\(\d+%\)$/, "")
        .trim();

      if (
        cleanLine &&
        cleanLine.length > 5 &&
        !cleanLine.toLowerCase().includes("pilih") &&
        !cleanLine.toLowerCase().includes("silakan") &&
        !cleanLine.toLowerCase().includes("berikut")
      ) {
        const lc = cleanLine.toLowerCase();
        const isBlacklisted = TITLE_BLACKLIST_KEYWORDS.some((kw) => lc.includes(kw));
        const isHeaderOrLabel = lc.startsWith("judul") || lc.startsWith("title") || cleanLine.startsWith("#");
        if (!titles.includes(cleanLine) && !isBlacklisted && !isHeaderOrLabel) {
          titles.push(cleanLine);
        }
      }
    }
  }
  return titles.slice(0, 10);
}

/** Extract the single chosen title line ("JUDUL TERPILIH: …"). */
export function extractChosenTitle(text: string): string | null {
  const pattern =
    /^(?:\d+[.\-)]|-|\*|\s)*\**\s*(?:JUDUL\s+TERPILIH|SELECTED\s+TITLE|CHOSEN\s+TITLE)\s*\**\s*🛑?\s*:\s*(.+)/iu;
  for (const line of text.split("\n")) {
    const m = line.trim().match(pattern);
    if (m) return m[1].replace(/[[\]*#]/g, "").trim();
  }
  return null;
}

// ── Image Content Parsers ─────────────────────────────────────────────────

export interface ImageContentData {
  headline: string;
  description: string;
  imagePrompt: string;
  circleInsetPrompt: string;
  designRecommendations: string;
  researchFacts: string;
  caption: string;
  hashtags: string;
  brandingText: string;
  carouselSlides: ImageCarouselSlide[];
}

export interface ImageCarouselSlide {
  slideNumber: number;
  headline: string;
  description: string;
  imagePrompt: string;
  overlayText: string;
}

/**
 * Generic section extractor: finds "KEY: value" patterns with multi-line support.
 * Stops at the next known section header or end of text.
 */
function extractSection(text: string, keys: string[], stopKeys: string[]): string {
  const keyPattern = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const stopPattern = stopKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  const regex = new RegExp(
    `(?:^|\\n)\\s*(?:\\*\\*|\\*|-|##?\\s*)?\\s*(?:${keyPattern})\\s*(?:\\*\\*|\\*)*\\s*:?\\s*([\\s\\S]*?)(?=(?:\\n\\s*(?:\\*\\*|\\*|-|##?\\s*)?\\s*(?:${stopPattern})\\s*(?:\\*\\*|\\*)*\\s*:)|$)`,
    'i'
  );

  const match = text.match(regex);
  if (!match || !match[1]) return "";
  return cleanParsedValue(match[1]);
}

/** All known image content section header keywords for boundary detection. */
const IMAGE_SECTION_HEADERS = [
  "HEADLINE", "JUDUL OVERLAY", "TEKS OVERLAY", "OVERLAY TEXT",
  "DESKRIPSI", "DESCRIPTION", "NARASI SINGKAT", "BODY TEXT",
  "IMAGE PROMPT", "VISUAL PROMPT", "AI IMAGE PROMPT", "PROMPT GAMBAR",
  "CIRCLE INSET", "INSET PROMPT", "GAMBAR INSET",
  "REKOMENDASI DESAIN", "DESIGN RECOMMENDATIONS", "SARAN DESAIN", "PANDUAN DESAIN",
  "RISET", "RESEARCH", "FAKTA", "FACTS", "SUMBER", "REFERENSI",
  "CAPTION", "DESKRIPSI PLATFORM",
  "HASHTAGS", "HASHTAG",
  "BRANDING", "WATERMARK", "NAMA CHANNEL",
  "SLIDE", "CAROUSEL",
  "REKOMENDASI WARNA", "COLOR PALETTE", "FONT",
];

/** Extract the main headline / overlay text from image content output. */
export function extractImageHeadline(text: string): string {
  return extractSection(
    text,
    ["HEADLINE", "JUDUL OVERLAY", "TEKS OVERLAY UTAMA", "OVERLAY TEXT", "JUDUL GAMBAR"],
    IMAGE_SECTION_HEADERS
  );
}

/** Extract the description / body text. */
export function extractImageDescription(text: string): string {
  return extractSection(
    text,
    ["DESKRIPSI", "DESCRIPTION", "NARASI SINGKAT", "BODY TEXT", "TEKS DESKRIPSI"],
    IMAGE_SECTION_HEADERS
  );
}

/** Extract the AI image prompt (for Midjourney or similar). */
export function extractImagePrompt(text: string): string {
  return extractSection(
    text,
    ["IMAGE PROMPT", "VISUAL PROMPT", "AI IMAGE PROMPT", "PROMPT GAMBAR", "MIDJOURNEY PROMPT"],
    IMAGE_SECTION_HEADERS
  );
}

/** Extract the circle inset / secondary image prompt. */
export function extractCircleInsetPrompt(text: string): string {
  return extractSection(
    text,
    ["CIRCLE INSET", "INSET PROMPT", "GAMBAR INSET", "CIRCLE IMAGE", "SECONDARY IMAGE"],
    IMAGE_SECTION_HEADERS
  );
}

/** Extract design recommendations (font, color, layout). */
export function extractDesignRecommendations(text: string): string {
  return extractSection(
    text,
    ["REKOMENDASI DESAIN", "DESIGN RECOMMENDATIONS", "SARAN DESAIN", "PANDUAN DESAIN", "REKOMENDASI WARNA"],
    IMAGE_SECTION_HEADERS
  );
}

/** Extract research facts and references. */
export function extractResearchFacts(text: string): string {
  return extractSection(
    text,
    ["RISET", "RESEARCH", "FAKTA", "FACTS", "SUMBER", "REFERENSI", "RISET & FAKTA"],
    IMAGE_SECTION_HEADERS
  );
}

/** Extract branding text (channel name / watermark). */
export function extractBrandingText(text: string): string {
  return extractSection(
    text,
    ["BRANDING", "WATERMARK", "NAMA CHANNEL", "BRANDING TEXT"],
    IMAGE_SECTION_HEADERS
  );
}

/** Extract image-specific caption (different from video caption). */
export function extractImageCaption(text: string): string {
  const result = extractSection(
    text,
    ["CAPTION", "DESKRIPSI PLATFORM", "CAPTION PLATFORM"],
    IMAGE_SECTION_HEADERS
  );
  return cleanMarkdownLinks(result);
}

/** Extract image-specific hashtags. */
export function extractImageHashtags(text: string): string {
  return extractSection(
    text,
    ["HASHTAGS", "HASHTAG"],
    IMAGE_SECTION_HEADERS
  );
}

/** Extract carousel slides from structured AI output. */
export function extractCarouselSlides(text: string): ImageCarouselSlide[] {
  const slides: ImageCarouselSlide[] = [];

  // Match "SLIDE 1", "SLIDE 2", etc. or "## SLIDE 1"
  const slideRegex = /(?:^|\n)\s*(?:##?\s*)?(?:SLIDE|HALAMAN|PAGE)\s+(\d+)/gi;
  const matches = [...text.matchAll(slideRegex)];

  if (matches.length === 0) return slides;

  for (let i = 0; i < matches.length; i++) {
    const slideNum = parseInt(matches[i][1], 10);
    const startIdx = matches[i].index!;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const slideBlock = text.substring(startIdx, endIdx);

    slides.push({
      slideNumber: slideNum,
      headline: extractSection(slideBlock, ["HEADLINE", "JUDUL", "TEKS OVERLAY"], IMAGE_SECTION_HEADERS),
      description: extractSection(slideBlock, ["DESKRIPSI", "DESCRIPTION", "BODY"], IMAGE_SECTION_HEADERS),
      imagePrompt: extractSection(slideBlock, ["IMAGE PROMPT", "VISUAL PROMPT", "PROMPT"], IMAGE_SECTION_HEADERS),
      overlayText: extractSection(slideBlock, ["OVERLAY TEXT", "TEKS OVERLAY", "OVERLAY"], IMAGE_SECTION_HEADERS),
    });
  }

  return slides;
}

/**
 * Parse a full AI-generated image content output into structured data.
 * This is the main entry point used by the Image Prompt Studio page.
 */
export function parseImageContent(text: string): ImageContentData {
  return {
    headline: extractImageHeadline(text),
    description: extractImageDescription(text),
    imagePrompt: extractImagePrompt(text),
    circleInsetPrompt: extractCircleInsetPrompt(text),
    designRecommendations: extractDesignRecommendations(text),
    researchFacts: extractResearchFacts(text),
    caption: extractImageCaption(text),
    hashtags: extractImageHashtags(text),
    brandingText: extractBrandingText(text),
    carouselSlides: extractCarouselSlides(text),
  };
}

// ── HTML Blog Extraction (Fix 2.4) ───────────────────────────────────────────

export interface BlogPublishingPack {
  html: string;
  metaDescription: string;
  tags: string[];
  thumbnailPrompt: string;
  supportingImagePrompts: string[];
  affiliateCallouts: string[];
  hasTable: boolean;
  hasSvgChart: boolean;
  hasInteractiveCalculator: boolean;
}

/**
 * Extract structured Blog Publishing Pack elements from Markdown output,
 * including clean pure HTML, SEO meta description, 16:9 thumbnail prompt,
 * in-article image prompts, affiliate callouts, and feature detection flags.
 */
export function extractBlogPublishingPack(text: string): BlogPublishingPack {
  const emptyResult: BlogPublishingPack = {
    html: "",
    metaDescription: "",
    tags: [],
    thumbnailPrompt: "",
    supportingImagePrompts: [],
    affiliateCallouts: [],
    hasTable: false,
    hasSvgChart: false,
    hasInteractiveCalculator: false,
  };

  if (!text) return emptyResult;

  // Find the HTML BLOG section header (supports ## header, **bold**, or plain text)
  const match = text.match(/(?:##\s*|###\s*|\*\*\s*|\b)HTML\s*BLOG\s*/i);
  if (!match || match.index === undefined) return emptyResult;

  const startIdx = match.index + match[0].length;
  // Stop at the next major ## header (that is NOT an internal sub-heading) or end of text
  const afterSection = text.substring(startIdx);
  const nextHeader = afterSection.search(/(?:\n##\s+(?!#|HTML|KODE|PROMPT|META)[^\n]+)/i);
  const rawBlock = nextHeader !== -1
    ? afterSection.substring(0, nextHeader).trim()
    : afterSection.trim();

  if (!rawBlock) return emptyResult;

  // 1. Meta Description
  const metaDescMatch = rawBlock.match(/(?:META\s+DESCRIPTION|DESKRIPSI\s+META)\s*:\s*([^\n]+)/i);
  const metaDescription = metaDescMatch ? cleanParsedValue(metaDescMatch[1]) : "";

  // 2. Tags / Labels / Categories
  const tagsMatch = rawBlock.match(/(?:KATEGORI(?:\/TAGS)?|TAGS|LABELS|CATEGORIES|CATEGORY\/TAGS)\s*:\s*([^\n]+)/i);
  const tags = tagsMatch
    ? tagsMatch[1].split(",").map(t => cleanParsedValue(t.trim())).filter(Boolean)
    : [];

  // 3. 16:9 Blog Thumbnail Prompt
  const thumbMatch = rawBlock.match(
    /(?:PROMPT\s+THUMBNAIL\s+16:9|16:9\s+BLOG\s+THUMBNAIL\s+PROMPT|THUMBNAIL\s+PROMPT)\s*:\s*([^\n]+(?:\n(?!(?:PROMPT|REKOMENDASI|AFFILIATE|```|<h1|<h2|<p|##))[^\n]+)*)/i
  );
  const thumbnailPrompt = thumbMatch ? thumbMatch[1].trim() : "";

  // 4. In-Article Supporting Image Prompts
  const supportingMatch = rawBlock.match(
    /(?:PROMPT\s+GAMBAR\s+PENDUKUNG|IN-ARTICLE\s+IMAGE\s+PROMPTS)\s*:\s*([\s\S]*?)(?=(?:REKOMENDASI|AFFILIATE|```|<h1|<h2|<p|##|$))/i
  );
  let supportingImagePrompts: string[] = [];
  if (supportingMatch) {
    supportingImagePrompts = supportingMatch[1]
      .split(/\n\s*(?:\d+[\.\)]|-|\*)\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 5);
  }

  // 5. Affiliate Callouts
  const affiliateMatch = rawBlock.match(
    /(?:REKOMENDASI\s+PRODUK\s+AFILIASI|AFFILIATE\s+RECOMMENDATIONS?)\s*:\s*([\s\S]*?)(?=(?:```|<h1|<h2|<p|##|$))/i
  );
  let affiliateCallouts: string[] = [];
  if (affiliateMatch) {
    affiliateCallouts = affiliateMatch[1]
      .split(/\n\s*(?:\d+[\.\)]|-|\*)\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 3);
  }

  // 6. Extract clean HTML
  let html = rawBlock;
  const codeBlockMatch = rawBlock.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    html = codeBlockMatch[1].trim();
  } else {
    // If no code fence, strip any metadata block preceding the first HTML tag
    const firstTagIdx = rawBlock.search(/<(?:h1|h2|p|article|div|table|main)/i);
    if (firstTagIdx !== -1) {
      html = rawBlock.substring(firstTagIdx).trim();
    }
  }

  // Detect rich dynamic elements
  const hasTable = /<table\b/i.test(html);
  const hasSvgChart = /<svg\b/i.test(html);
  const hasInteractiveCalculator = /interactive-calculator|calculator|<input|<select|<button/i.test(html);

  return {
    html,
    metaDescription,
    tags,
    thumbnailPrompt,
    supportingImagePrompts,
    affiliateCallouts,
    hasTable,
    hasSvgChart,
    hasInteractiveCalculator,
  };
}

/**
 * Extract the ## HTML BLOG section from a video generator Markdown output.
 * Returns the clean pure HTML string (which may contain <h1>, <p>, <h2>, <h3>, <table>, <svg> tags)
 * ready to be stored in parsedData.html_blog and rendered safely.
 */
export function extractHtmlBlog(text: string): string {
  if (!text) return "";
  const pack = extractBlogPublishingPack(text);
  return pack.html || "";
}

// ── Affiliate Product Recommendations ──────────────────────────────────────

export interface AffiliateProductLink {
  marketplace: string;
  url: string;
}

export interface AffiliateRecommendation {
  productName: string;
  reason: string;
  links: AffiliateProductLink[];
}

/**
 * Extract structured affiliate product recommendations from the
 * ## REKOMENDASI PRODUK AFFILIATE section generated by the AI.
 *
 * Expected AI format per product block:
 *   PRODUK: [name]
 *   ALASAN: [reason]
 *   LINK TOKOPEDIA: [url]
 *   LINK SHOPEE: [url]
 *   ... (any marketplace)
 *
 * Blocks are separated by blank lines.
 */
export function extractAffiliateRecommendations(text: string): AffiliateRecommendation[] {
  if (!text) return [];

  // Find section header — support ## header, **bold** header, or plain text variants
  const headerMatch = text.match(
    /(?:##\s*|###\s*|\*\*\s*|\b)REKOMENDASI\s*PRODUK(?:\s+AFFILIATE)?(?:\s*\*\*)?/i
  );
  if (!headerMatch || headerMatch.index === undefined) return [];

  const startIdx = headerMatch.index + headerMatch[0].length;
  // Stop at the next ## header or end of text
  const afterSection = text.substring(startIdx);
  const nextHeader = afterSection.search(/(?:\n##\s+|\n(?:\*\*\s*)?HTML\s*BLOG|\n(?:\*\*\s*)?THUMBNAIL)/i);
  const sectionRaw = nextHeader !== -1
    ? afterSection.substring(0, nextHeader).trim()
    : afterSection.trim();

  if (!sectionRaw) return [];

  // Split into product blocks by blank lines OR numbered/bulleted blocks
  const blocks = sectionRaw.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const results: AffiliateRecommendation[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    let productName = "";
    let reason = "";
    const links: AffiliateProductLink[] = [];

    for (const line of lines) {
      // PRODUK: value  (supports **PRODUK:** and plain)
      const prodMatch = line.match(/^(?:\*\*)?PRODUK(?:\*\*)?\s*:\s*(.+)/i);
      if (prodMatch) {
        productName = cleanParsedValue(prodMatch[1]);
        continue;
      }
      // ALASAN: value
      const alasanMatch = line.match(/^(?:\*\*)?ALASAN(?:\*\*)?\s*:\s*(.+)/i);
      if (alasanMatch) {
        reason = cleanParsedValue(alasanMatch[1]);
        continue;
      }
      // LINK [MARKETPLACE]: url — also handles markdown links [text](url)
      const linkMatch = line.match(/^(?:\*\*)?LINK\s+([A-Z0-9\s_]+?)(?:\*\*)?\s*:\s*(.+)/i);
      if (linkMatch) {
        const marketplace = linkMatch[1].trim();
        let rawUrl = linkMatch[2].trim();
        // Unwrap markdown link format: [label](url)
        const mdLink = rawUrl.match(/\[.*?\]\((https?:\/\/[^)]+)\)/);
        if (mdLink) rawUrl = mdLink[1].trim();
        // Unwrap plain brackets
        rawUrl = rawUrl.replace(/^\[|\]$/g, "").trim();
        // Only add if URL looks real (not a placeholder)
        if (rawUrl && rawUrl.startsWith("http")) {
          links.push({ marketplace, url: rawUrl });
        }
        continue;
      }
    }

    // Only push if we have at minimum a product name
    if (productName) {
      results.push({ productName, reason, links });
    }
  }

  return results;
}

// ── Scene Extraction & Parsing ──────────────────────────────────────────────

export interface Scene {
  id: number;
  sceneNumber: string;
  sceneContext?: string;
  narasi: string;
  wordCount?: number;
  pauseSec?: number;
  estimatedDurationSec?: number;
  teksOverlay?: string;
  overlayType?: "chapter_title" | "key_point";
  chapter?: number;
  chapterTitle?: string;
  chapterPrefix?: string;
  visual: string;
  durasi: string;
  bgmCues?: string[];
  sfxCues?: string[];
  ambientCues?: string[];
  isDiegetic?: boolean;
  voiceGuidelines?: VoiceGuidelines;
  targetEmosi?: string;
  teknikPacing?: string;
  settingKamera?: string; // Baris SETTING KAMERA dari output AI
}

export function parseOverlayType(raw: string): { text: string; type?: "chapter_title" | "key_point" } {
  const chapterMatch = raw.match(/^\[CHAPTER\s*TITLE\]\s*/i);
  if (chapterMatch) return { text: raw.slice(chapterMatch[0].length).trim(), type: "chapter_title" };
  const keyPointMatch = raw.match(/^\[KEY\s*POINT\]\s*/i);
  if (keyPointMatch) return { text: raw.slice(keyPointMatch[0].length).trim(), type: "key_point" };
  return { text: raw };
}

/**
 * Strip acting instructions, parenthetical stage directions, sound cues, quotation marks,
 * and emotion cues (e.g. "(tersenyum ramah)", "(intonasi berbisik)", "(hushed, urgent whisper)", "(pause)", "[SFX: ...]")
 * before sending to TTS engine so the narrator speaks pure spoken text cleanly without awkward pauses or reading instructions aloud.
 */
export function cleanNarasiForTts(text: string): string {
  if (!text) return "";
  return text
    // 1. Strip sound effect, music cue, and acting brackets like [SFX: ...], [BGM: ...], [beat], [whisper]
    .replace(/\*?\s*\[[^\]]*\]\s*\*?/g, " ")
    // 2. Strip stage directions / acting instructions in parentheses e.g. (hushed, urgent whisper), (pause), *(urgent)*
    .replace(/\*?\s*\([^)]*\)\s*\*?/g, " ")
    // 3. Strip quotation marks (both straight and curly double quotes)
    .replace(/["“”]/g, "")
    // 4. Strip standalone or wrapping single quotes while preserving inner word apostrophes (e.g. can't, it's, reptile's)
    .replace(/(?:^|\s)['‘]+|['’]+(?:\s|[.,!?;:]|$)/g, " ")
    // 5. Strip leftover markdown formatting asterisks and underscores (*, **, ***, _, __)
    .replace(/(?:\*{1,3}|_{1,3})/g, "")
    // 6. Normalize punctuation spacing (e.g. "word ." -> "word.", multiple spaces -> single space)
    .replace(/\s+([,.:;?!])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Accurately count words in a given text string, filtering out empty tokens.
 */
export function countWords(text?: string | null): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Estimates real expressive pause / acting dead-air time in seconds from brackets/parentheticals.
 * E.g., [beat] (~0.5s), [silence]/[pause] (~1.0s), [pause 2s] (~2.0s), [sigh] (~0.8s), [gasp] (~0.6s).
 */
export function estimateExpressivePauseSeconds(text?: string | null): number {
  if (!text || !text.trim()) return 0;

  let totalPauseSec = 0;

  // 1. Explicit numbered pause tags: [pause 2s], (jeda 1.5 detik), [silence 3s]
  const explicitNumberRegex = /[\[\(](?:pause|jeda|silence|hening)\s+(\d+(?:\.\d+)?)\s*(?:s|detik|sec|secs|seconds)?[\]\)]/gi;
  let match: RegExpExecArray | null;
  const strippedText = text.replace(explicitNumberRegex, (_, numStr) => {
    const val = parseFloat(numStr);
    if (!isNaN(val) && val > 0) {
      totalPauseSec += val;
    }
    return " ";
  });

  // 2. Standard bracketed tags and parentheticals
  const tagRegex = /[\[\(]([^\]\)]+)[\]\)]/g;
  while ((match = tagRegex.exec(strippedText)) !== null) {
    const rawTag = match[1].trim().toLowerCase();

    // Ignore SFX/BGM/Ambient technical cues like [SFX: explosion], [BGM: epic], [AMBIENT: rain]
    if (/^(?:sfx|bgm|audio|visual|music|ambient|foley|atmos|atmosphere)\b/i.test(rawTag)) {
      continue;
    }

    if (/\b(?:beat|jeda(?:\s+singkat)?)\b/.test(rawTag)) {
      totalPauseSec += 0.5;
    } else if (/\b(?:silence|hening|pause)\b/.test(rawTag)) {
      totalPauseSec += 1.0;
    } else if (/\b(?:sigh|hela(?:\s+napas)?|tarik(?:\s+napas)?)\b/.test(rawTag)) {
      totalPauseSec += 0.8;
    } else if (/\b(?:gasp|terkesiap)\b/.test(rawTag)) {
      totalPauseSec += 0.6;
    } else if (/\b(?:chuckle|tertawa|kekeh|giggle)\b/.test(rawTag)) {
      totalPauseSec += 0.8;
    } else if (/\b(?:whisper|berbisik)\b/.test(rawTag)) {
      totalPauseSec += 0.5;
    } else if (/\b(?:clears?\s+throat|berdeham)\b/.test(rawTag)) {
      totalPauseSec += 0.8;
    }
  }

  return Number(totalPauseSec.toFixed(1));
}

export interface NarrationDurationEstimate {
  spokenWords: number;
  wordDurationSec: number;
  pauseDurationSec: number;
  totalDurationSec: number;
}

/**
 * Calculates a complete, accurate estimate of narration duration by combining
 * spoken words (at a given speech rate) with expressive pause overheads.
 */
export function estimateNarrationDuration(
  text?: string | null,
  speechRateSec: number = 0.35
): NarrationDurationEstimate {
  const cleanSpoken = cleanNarasiForTts(text || "");
  const spokenWords = countWords(cleanSpoken || text);
  const wordDurationSec = Number((spokenWords * speechRateSec).toFixed(1));
  const pauseDurationSec = estimateExpressivePauseSeconds(text);
  const totalDurationSec = Number((wordDurationSec + pauseDurationSec).toFixed(1));

  return {
    spokenWords,
    wordDurationSec,
    pauseDurationSec,
    totalDurationSec,
  };
}

export interface ScriptTimingSummary {
  totalDurationSec: number;
  formattedTotalDuration: string; // "mm:ss"
  totalWords: number;
  totalPausesSec: number;
  sceneCount: number;
  isShortsReady: boolean; // totalDurationSec <= 60
  speechRateSec: number;
}

/**
 * Calculates aggregated script timing across all scenes using a specific speech rate.
 * Reuses estimateNarrationDuration for 100% consistency without duplicate logic.
 */
export function calculateScriptTiming(
  scenes: Scene[],
  speechRateSec: number = 0.35
): ScriptTimingSummary {
  let totalWords = 0;
  let totalPausesSec = 0;
  let totalDurationSec = 0;

  for (const scene of scenes) {
    const timing = estimateNarrationDuration(scene.narasi, speechRateSec);
    totalWords += timing.spokenWords;
    totalPausesSec += timing.pauseDurationSec;
    totalDurationSec += timing.totalDurationSec;
  }

  totalDurationSec = Number(totalDurationSec.toFixed(1));
  totalPausesSec = Number(totalPausesSec.toFixed(1));

  const totalSecondsRound = Math.round(totalDurationSec);
  const minutes = Math.floor(totalSecondsRound / 60);
  const seconds = totalSecondsRound % 60;
  const formattedTotalDuration = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return {
    totalDurationSec,
    formattedTotalDuration,
    totalWords,
    totalPausesSec,
    sceneCount: scenes.length,
    isShortsReady: totalDurationSec > 0 && totalDurationSec <= 60,
    speechRateSec,
  };
}

/**
 * Parse AI generated script text into structured Scene items with support for:
 * - Chapter markers (BAB N: Title or CHAPTER N: Title)
 * - Narration, Audio cues (BGM, SFX, Diegetic)
 * - Target Emosi (VET 3-Act Storytelling)
 * - Teknik Editing & Pacing (Jump cut, beat-sync, b-roll cutaways)
 * - Overlay types (Chapter Title / Key Point)
 * - Visual prompts and durations
 */
export function parseScenes(text: string, speechRateSec: number = 0.35, idOffset: number = 0): Scene[] {
  if (!text || !text.trim()) return [];

  // Extract chapter markers: ## BAB N: Title or ## CHAPTER N: Title
  const chapterMarkers: { index: number; prefix: string; num: number; title: string }[] = [];
  const chapterPattern = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(BAB|CHAPTER)\s+(\d+)\s*:\s*(.+?)(?=\r?\n|$)/gi;
  let chMatch;
  while ((chMatch = chapterPattern.exec(text)) !== null) {
    chapterMarkers.push({
      index: chMatch.index,
      prefix: chMatch[1].toUpperCase(),
      num: parseInt(chMatch[2], 10),
      title: chMatch[3].trim(),
    });
  }

  const splitter = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:Scene|Adegan|Bagian|Part)\s*([a-zA-Z0-9_\-]+)(?:[:\s\*\-=_]*)(?=\r?\n|$)/gi;
  const parts = text.split(splitter);
  const scenes: Scene[] = [];
  // CATATAN: string ini memakai empat backslash sehingga runtime-nya menjadi dua
  // backslash, yang berarti alternatif di sini COCOK LITERAL DENGAN BACKSLASH,
  // bukan dengan spasi. Artinya daftar ini secara efektif tidak pernah cocok.
  // Ekstraksi field tetap bekerja lewat alternatif `$` di delimLookahead dan
  // lewat parameter `keys` pada matchField (escaping-nya benar di sana).
  // Jangan menambah daftar ini tanpa memperbaiki escaping-nya lebih dulu, dan
  // jalankan tests/parsers.scenes.test.ts bila mengubahnya.
  const delimiters = "(?:Konteks\\s*Scene|Konteks\\s*Adegan|Scene\\s*Context|Konteks|Context|Narasi|Dialog|Voice\\s*Over|VO|Audio|Target\\s*Emosi(?:\\s*\\(VET\\))?|Emosi|Teknik\\s*(?:Editing(?:\\s*&\\s*Pacing)?|Pacing)|Pacing|Teks\\s*Overlay|Text\\s*Overlay|Overlay|Panduan\\s*Suara|Voice\\s*Guidelines|Setting\\s*Kamera|Camera\\s*Setup|Visual\\s*Prompt|Visual|Deskripsi\\s*Visual|Prompt|Komponen\\s*Remotion|Remotion\\s*Component|Motion\\s*Design|Elemen\\s*Visual|Animasi(?:\\s*&\\s*Spring)?|Spring(?:\\s*Animation)?|Transisi|Durasi|Time|Duration)";
  const delimLookahead = `(?=(?:\\r?\\n)+(?:\\*\\*)?${delimiters}(?::\\s*\\*\\*|\\*\\*\\s*:|:)|\\r?\\n+[-*_]{3,}|\\r?\\n+(?:#{1,6}\\s*|\\*{2,3}\\s*|={2,4}\\s*)*(?:Scene|Adegan|Bagian|Part)\\s+[a-zA-Z0-9_\\-]+|\\r?\\n+(?:#{1,6}\\s*|\\*{2,3}\\s*|={2,4}\\s*)*(?:TOTAL|THUMBNAIL|METADATA|RINGKASAN|HASHTAG|CAPTION|KODE\\s*REMOTION|REMOTION\\s*CODE)|$)`;

  // Helper: find which chapter a given text offset belongs to
  function findChapterAt(offset: number): { prefix: string; num: number; title: string } | undefined {
    let best: (typeof chapterMarkers)[0] | undefined;
    for (const cm of chapterMarkers) {
      if (cm.index <= offset) best = cm;
    }
    return best ? { prefix: best.prefix, num: best.num, title: best.title } : undefined;
  }

  function normalizeDurasi(val: string): string {
    const cleaned = cleanParsedValue(val);
    if (!cleaned) return "5s";
    const numMatch = cleaned.match(/^(\d+)\s*(?:seconds?|secs?|detik|s)?$/i);
    return numMatch ? `${numMatch[1]}s` : cleaned;
  }

  if (parts.length > 1) {
    let count = 1;
    let charOffset = parts[0].length;
    for (let i = 1; i < parts.length; i += 2) {
      if (scenes.length >= MAX_SCENE_COUNT) break;
      const sceneNum = parts[i], content = parts[i + 1] || "";
      charOffset += sceneNum.length;
      const sceneStartOffset = charOffset;
      charOffset += content.length;

      const stop = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:TOTAL\s*DURASI|TOTAL|RINGKASAN|THUMBNAIL|ARTIKEL|HASHTAG|CAPTION|JUDUL\s*TERPILIH|HTML\s*BLOG|REKOMENDASI|METADATA\s*SEO|KONTEN\s*PLATFORM|PLATFORM|KODE\s*REMOTION|REMOTION\s*CODE)/i;
      const m = content.match(stop);
      const c = m ? content.slice(0, m.index) : content;

      const matchField = (keys: string) => {
        const reg = new RegExp(`(?:^|\\r?\\n)(?:\\*\\*)?(?:${keys})(?::\\s*\\*\\*|\\*\\*\\s*:|:)\\s*([\\s\\S]*?)${delimLookahead}`, "i");
        return c.match(reg);
      };

      const context = matchField("Konteks\\s*Scene|Konteks\\s*Adegan|Scene\\s*Context|Konteks|Context");
      const nar = matchField("Narasi|Dialog|Voice\\s*Over|VO|Audio");
      const emosi = matchField("Target\\s*Emosi(?:\\s*\\(VET\\))?|Emosi");
      const pacing = matchField("Teknik\\s*(?:Editing(?:\\s*&\\s*Pacing)?|Pacing)|Pacing");
      const overlay = matchField("Teks\\s*Overlay|Text\\s*Overlay|Overlay");
      const vis = matchField("Visual\\s*Prompt|Visual|Deskripsi\\s*Visual|Prompt|Motion\\s*Design|Elemen\\s*Visual");
      const dur = matchField("Durasi|Time|Duration");
      const voi = matchField("Panduan\\s*Suara|Voice\\s*Guidelines");
      const cam = matchField("Setting\\s*Kamera|Camera\\s*Setup|Komponen\\s*Remotion|Remotion\\s*Component|Animasi(?:\\s*&\\s*Spring)?|Spring(?:\\s*Animation)?|Transisi");

      let contextVal = context ? cleanParsedValue(context[1]) : "";
      if (contextVal.startsWith("[") && contextVal.endsWith("]")) {
        contextVal = contextVal.slice(1, -1).trim();
      }
      const narVal = nar ? cleanParsedValue(nar[1]) : "";
      const emosiVal = emosi ? cleanParsedValue(emosi[1]) : "";
      const pacingVal = pacing ? cleanParsedValue(pacing[1]) : "";
      const rawOverlay = overlay ? cleanParsedValue(overlay[1]).replace(/^["']|["']$/g, "").trim() : "";
      let visVal = vis ? cleanParsedValue(vis[1]) : "";
      const durVal = dur ? normalizeDurasi(dur[1]) : "5s";
      const camVal = cam ? cleanParsedValue(cam[1]) : "";

      // Fallback: If context wasn't parsed as an explicit field, check if visual prompt started with [Scene: ...] or [Konteks: ...]
      if (!contextVal && visVal) {
        const embeddedContextMatch = visVal.match(/^\[(?:Scene|Konteks|Context)\s*:\s*([^\]]+)\]\s*/i);
        if (embeddedContextMatch) {
          contextVal = embeddedContextMatch[1].trim();
          visVal = visVal.slice(embeddedContextMatch[0].length).trim();
        }
      }

      if (narVal || visVal || rawOverlay || emosiVal || pacingVal || contextVal) {
        const audio = extractAudioCues(narVal);
        const timing = estimateNarrationDuration(audio.cleanNarasi || "", speechRateSec);
        const overlayParsed = rawOverlay ? parseOverlayType(rawOverlay) : null;
        const overlayText = overlayParsed?.text || undefined;
        const overlayType = overlayParsed?.type || undefined;
        const chapterInfo = findChapterAt(sceneStartOffset);

        scenes.push({
          id: idOffset + count,
          sceneNumber: isNaN(Number(sceneNum)) ? sceneNum : `Scene ${sceneNum}`,
          sceneContext: contextVal && contextVal !== "—" ? contextVal : undefined,
          narasi: audio.cleanNarasi || "—",
          wordCount: timing.spokenWords,
          pauseSec: timing.pauseDurationSec,
          estimatedDurationSec: timing.totalDurationSec,
          teksOverlay: overlayText && overlayText !== "—" ? overlayText : undefined,
          overlayType,
          chapter: chapterInfo?.num,
          chapterTitle: chapterInfo?.title,
          chapterPrefix: chapterInfo?.prefix,
          visual: visVal || "—",
          durasi: durVal,
          bgmCues: audio.bgmCues,
          sfxCues: audio.sfxCues,
          ambientCues: audio.ambientCues,
          isDiegetic: audio.isDiegetic,
          voiceGuidelines: voi ? parseVoiceGuidelines(cleanParsedValue(voi[1])) : undefined,
          targetEmosi: emosiVal && emosiVal !== "—" ? emosiVal : undefined,
          teknikPacing: pacingVal && pacingVal !== "—" ? pacingVal : undefined,
          settingKamera: camVal && camVal !== "—" ? camVal : undefined,
        });
        count++;
      }
    }
  }

  if (!scenes.length) {
    const audio = extractAudioCues(text);
    const timing = estimateNarrationDuration(audio.cleanNarasi || text, speechRateSec);
    scenes.push({
      id: 1,
      sceneNumber: "Scene 1",
      narasi: audio.cleanNarasi.slice(0, 120) || (audio.isDiegetic ? "—" : text.slice(0, 120)),
      wordCount: timing.spokenWords,
      pauseSec: timing.pauseDurationSec,
      estimatedDurationSec: timing.totalDurationSec,
      visual: text,
      durasi: "15s",
      bgmCues: audio.bgmCues,
      sfxCues: audio.sfxCues,
      ambientCues: audio.ambientCues,
      isDiegetic: audio.isDiegetic,
    });
  }

  return scenes;
}

// ── YouTube 2026: 3-Tier SEO & Pre-Flight Checklist ─────────────────────────

export interface ThreeTierSeoData {
  raw: string;
  tagSpesifik: string;
  tagUmum: string;
  tagMajemuk: string;
  deskripsi: string;
  checklist: string[];
}

/**
 * Extract YouTube 2026 3-Tier SEO metadata and pre-flight checklist from AI output.
 */
export function extractThreeTierSeo(text: string): ThreeTierSeoData | null {
  if (!text) return null;

  const match = text.match(
    /(?:^|\r?\n|^)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:METADATA\s*SEO\s*(?:YOUTUBE)?(?:\s*2026)?|SEO\s*METADATA)/i
  );
  if (!match || match.index === undefined) return null;

  const startIdx = match.index;
  const afterSection = text.substring(startIdx);
  const firstNewline = afterSection.indexOf("\n");
  const rest = firstNewline !== -1 ? afterSection.substring(firstNewline + 1) : "";
  const nextHeaderMatch = rest.search(/(?:\r?\n)(?:#{1,6}\s*|\*{2,3}\s*)*(?:HTML\s*BLOG|REKOMENDASI|THUMBNAIL|SCENE|ADEGAN)/i);
  const sectionRaw = nextHeaderMatch !== -1
    ? afterSection.substring(0, firstNewline + 1 + nextHeaderMatch).trim()
    : afterSection.trim();

  const tagSpesifikMatch = sectionRaw.match(/(?:\*\*)?(?:TAG\s+SPESIFIK|SPECIFIC\s+TAGS?)(?::\s*\*\*|\*\*\s*:|:)\s*([^\n]+)/i);
  const tagUmumMatch = sectionRaw.match(/(?:\*\*)?(?:TAG\s+UMUM|GENERAL\s+TAGS?)(?::\s*\*\*|\*\*\s*:|:)\s*([^\n]+)/i);
  const tagMajemukMatch = sectionRaw.match(/(?:\*\*)?(?:TAG\s+MAJEMUK(?:\s*\(LONG-TAIL\))?|LONG-?TAIL\s+TAGS?)(?::\s*\*\*|\*\*\s*:|:)\s*([^\n]+)/i);
  const deskripsiMatch = sectionRaw.match(/(?:\*\*)?(?:DESKRIPSI\s+(?:YOUTUBE)?(?:\s*\(SEO\s*&\s*EMPATI\))?|DESKRIPSI)(?::\s*\*\*|\*\*\s*:|:)\s*([\s\S]*?)(?=(?:CHECKLIST|##|$))/i);

  // Extract checklist items
  const checklist: string[] = [];
  const checklistBlockMatch = sectionRaw.match(/CHECKLIST(?:\s+KESIAPAN\s+AKHIR)?\s*:?([\s\S]*?)(?=(?:##|$))/i);
  if (checklistBlockMatch && checklistBlockMatch[1]) {
    const lines = checklistBlockMatch[1].split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[-*]\s*(?:\[[ xX]\])?\s*.+/.test(trimmed)) {
        const itemText = trimmed.replace(/^[-*]\s*(?:\[[ xX]\])?\s*/, "").trim();
        if (itemText) checklist.push(itemText);
      }
    }
  }

  // Fallback defaults if checklist block was empty but section existed
  if (checklist.length === 0) {
    checklist.push(
      "Audio bersih dari noise dengan Fade-in/Fade-out yang halus",
      "Judul mengandung Long-tail Keyword yang dicari penonton",
      "Teks thumbnail (maks 1-3 kata) & ekspresi wajah 60-80% terbaca jelas di layar HP kecil",
      "Hook 3 detik pertama telah menyampaikan Janji Nilai (Value Promise) yang kuat"
    );
  }

  const tagSpesifik = tagSpesifikMatch ? cleanParsedValue(tagSpesifikMatch[1]) : "";
  const tagUmum = tagUmumMatch ? cleanParsedValue(tagUmumMatch[1]) : "";
  const tagMajemuk = tagMajemukMatch ? cleanParsedValue(tagMajemukMatch[1]) : "";
  const deskripsi = deskripsiMatch ? cleanParsedValue(deskripsiMatch[1]) : "";

  return {
    raw: sectionRaw,
    tagSpesifik,
    tagUmum,
    tagMajemuk,
    deskripsi,
    checklist,
  };
}

/**
 * Format raw tags string into clean, comma-separated YouTube Studio keywords.
 * Removes leading '#' or quotes, trims whitespace, deduplicates, and joins with ', '.
 */
export function formatAsYouTubeTags(rawText: string): string {
  if (!rawText) return "";
  const items = rawText
    .split(/[,;\n]+/)
    .map((t) => t.replace(/^[#\s"']+|[#\s"']+$/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of items) {
    const lower = item.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(item);
    }
  }
  return unique.join(", ");
}

/**
 * Format tag keywords into valid social media / video description hashtags.
 * Converts multi-word phrases to PascalCase (e.g. "reptile third eye" -> "#ReptileThirdEye").
 * Strips spaces and invalid characters, joins with space.
 */
export function formatAsHashtags(rawText: string): string {
  if (!rawText) return "";
  const items = rawText
    .split(/[,;\n]+/)
    .map((t) => t.replace(/^[#\s"']+|[#\s"']+$/g, "").trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of items) {
    const words = item.split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    const pascal = words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("")
      .replace(/[^a-zA-Z0-9_]/g, "");
    if (!pascal) continue;
    const tag = `#${pascal}`;
    const lower = tag.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      tags.push(tag);
    }
  }
  return tags.join(" ");
}

/**
 * Combines 3-Tier tags (Specific + General + Long-tail) into a single comma-separated string
 * bounded by YouTube's maximum tag box limit (default: 500 characters).
 */
export function buildCombinedYouTubeTags(
  tagSpesifik: string,
  tagUmum: string,
  tagMajemuk: string,
  maxChars = 500
): string {
  const combinedRaw = [tagSpesifik, tagUmum, tagMajemuk].filter(Boolean).join(", ");
  const allTags = formatAsYouTubeTags(combinedRaw).split(", ").filter(Boolean);

  const result: string[] = [];
  let currentLength = 0;

  for (const tag of allTags) {
    const additional = result.length === 0 ? tag.length : tag.length + 2; // "+2" for ", "
    if (currentLength + additional <= maxChars) {
      result.push(tag);
      currentLength += additional;
    } else {
      break;
    }
  }

  return result.join(", ");
}

// ── Multi-Platform SEO & Metadata (YouTube, TikTok, Instagram, Facebook 2026) ──

export interface PlatformSeoItem {
  platform: "youtube" | "tiktok" | "instagram" | "facebook";
  description: string;
  hashtags: string;
  tags: string;
  charCount: {
    description: number;
    hashtags: number;
    tags: number;
  };
  status: {
    descriptionIdeal: boolean;
    descriptionWarning?: string;
    tagsWarning?: string;
  };
}

export interface MultiPlatformSeoData {
  youtube?: PlatformSeoItem;
  tiktok?: PlatformSeoItem;
  instagram?: PlatformSeoItem;
  facebook?: PlatformSeoItem;
}

/**
 * Menghitung keselarasan batasan karakter teknis & sweet-spot SEO per platform.
 */
export function evaluatePlatformSeoStatus(
  platform: "youtube" | "tiktok" | "instagram" | "facebook",
  descLen: number,
  tagsLen: number
): { descriptionIdeal: boolean; descriptionWarning?: string; tagsWarning?: string } {
  let descriptionIdeal = false;
  let descriptionWarning: string | undefined;
  let tagsWarning: string | undefined;

  switch (platform) {
    case "youtube":
      descriptionIdeal = descLen >= 150 && descLen <= 2500;
      if (descLen > 5000) {
        descriptionWarning = "Melebihi batas maksimal 5.000 karakter YouTube";
      } else if (descLen > 0 && descLen < 150) {
        descriptionWarning = "Deskripsi relatif pendek untuk optimasi SEO YouTube (rekomendasi: 800–1.500 karakter)";
      }
      if (tagsLen > 500) {
        tagsWarning = "Total tag melebihi batas 500 karakter YouTube Studio";
      }
      break;

    case "tiktok":
      descriptionIdeal = descLen >= 70 && descLen <= 350;
      if (descLen > 2200) {
        descriptionWarning = "Melebihi batas maksimal TikTok";
      } else if (descLen > 350) {
        descriptionWarning = "Caption panjang berpotensi menutupi video di layar HP (rekomendasi: 150–300 karakter)";
      }
      break;

    case "instagram":
      descriptionIdeal = descLen >= 100 && descLen <= 500;
      if (descLen > 2200) {
        descriptionWarning = "Melebihi batas maksimal 2.200 karakter Instagram";
      } else if (descLen > 500) {
        descriptionWarning = "Caption panjang, pastikan hook utama tuntas sebelum titik potong 125 karakter (...more)";
      }
      break;

    case "facebook":
      descriptionIdeal = descLen >= 150 && descLen <= 600;
      if (descLen > 2000) {
        descriptionWarning = "Caption relatif panjang untuk format video/Reels Facebook";
      }
      break;
  }

  return { descriptionIdeal, descriptionWarning, tagsWarning };
}

/**
 * Ekstrak metadata SEO & Konten khusus 4 Platform (YouTube, TikTok, Instagram, Facebook).
 * Mendukung variasi sintaks, backward compatibility untuk naskah format lama,
 * dan kalkulasi otomatis jumlah karakter beserta evaluasi sweet-spot SEO.
 */
export function extractMultiPlatformSeo(text: string): MultiPlatformSeoData | null {
  if (!text || typeof text !== "string") return null;

  const platforms: Array<{
    key: "youtube" | "tiktok" | "instagram" | "facebook";
    pattern: RegExp;
  }> = [
    {
      key: "youtube",
      pattern: /(?:^|\r?\n)(?:#{1,6}\s*|\*{1,3}\s*|={2,4}\s*)*(?:\[?(?:PLATFORM\s*[:\-]\s*)?(?:1[\.\-]?\s*)?YOUTUBE(?:(?:\s*SHORTS)?(?:\s*SEO)?(?:(?:\s*2026)?)?)\]?)(?::\s*)?(?:\r?\n|$)/i,
    },
    {
      key: "tiktok",
      pattern: /(?:^|\r?\n)(?:#{1,6}\s*|\*{1,3}\s*|={2,4}\s*)*(?:\[?(?:PLATFORM\s*[:\-]\s*)?(?:2[\.\-]?\s*)?TIKTOK(?:(?:\s*SEO)?(?:(?:\s*2026)?)?)\]?)(?::\s*)?(?:\r?\n|$)/i,
    },
    {
      key: "instagram",
      pattern: /(?:^|\r?\n)(?:#{1,6}\s*|\*{1,3}\s*|={2,4}\s*)*(?:\[?(?:PLATFORM\s*[:\-]\s*)?(?:3[\.\-]?\s*)?(?:INSTAGRAM|IG)(?:(?:\s*REELS)?(?:\s*SEO)?(?:(?:\s*2026)?)?)\]?)(?::\s*)?(?:\r?\n|$)/i,
    },
    {
      key: "facebook",
      pattern: /(?:^|\r?\n)(?:#{1,6}\s*|\*{1,3}\s*|={2,4}\s*)*(?:\[?(?:PLATFORM\s*[:\-]\s*)?(?:4[\.\-]?\s*)?(?:FACEBOOK|FB)(?:(?:\s*REELS)?(?:\s*SEO)?(?:(?:\s*2026)?)?)\]?)(?::\s*)?(?:\r?\n|$)/i,
    },
  ];

  const matchedPositions: Array<{
    key: "youtube" | "tiktok" | "instagram" | "facebook";
    index: number;
    matchLength: number;
  }> = [];

  for (const p of platforms) {
    const match = p.pattern.exec(text);
    if (match && match.index !== undefined) {
      matchedPositions.push({
        key: p.key,
        index: match.index,
        matchLength: match[0].length,
      });
    }
  }

  const result: MultiPlatformSeoData = {};

  if (matchedPositions.length > 0) {
    matchedPositions.sort((a, b) => a.index - b.index);

    for (let i = 0; i < matchedPositions.length; i++) {
      const cur = matchedPositions[i];
      const startContent = cur.index + cur.matchLength;
      let endContent = text.length;

      if (i + 1 < matchedPositions.length) {
        endContent = matchedPositions[i + 1].index;
      } else {
        const nextHeaderMatch = text.slice(startContent).search(/(?:\r?\n)(?:#{1,6}\s*|\*{2,3}\s*)*(?:THUMBNAIL|SCENE|ADEGAN|SEGMENT|CHECKLIST|HTML\s*BLOG|REKOMENDASI|KODE\s*REMOTION)/i);
        if (nextHeaderMatch !== -1) {
          endContent = startContent + nextHeaderMatch;
        }
      }

      const blockText = text.substring(startContent, endContent).trim();

      const descPattern = /(?:^|\r?\n)\s*(?:\*\*)?(?:DESKRIPSI|CAPTION|STATUS)(?:\s+(?:YOUTUBE|TIKTOK|INSTAGRAM|FACEBOOK|STATUS))?(?:\s*\([^)]*\))?(?::\s*\*\*|\*\*\s*:|:)\s*/i;
      const hashPattern = /(?:^|\r?\n)\s*(?:\*\*)?(?:HASHTAGS?)(?:\s+(?:YOUTUBE|TIKTOK|INSTAGRAM|FACEBOOK))?(?:\s*\([^)]*\))?(?::\s*\*\*|\*\*\s*:|:)\s*/i;
      const tagsPattern = /(?:^|\r?\n)\s*(?:\*\*)?(?:TAGS?[^\n:]*|TAG\s*REKOMENDASI|KATA\s*KUNCI[^\n:]*|REKOMENDASI\s*(?:KEYWORD|KATA\s*KUNCI)[^\n:]*|TOPIK[^\n:]*)(?:\s*\([^)]*\))?(?::\s*\*\*|\*\*\s*:|:)\s*/i;
      const allFieldPatterns = [descPattern, hashPattern, tagsPattern];

      const extractField = (pattern: RegExp) => {
        const m = pattern.exec(blockText);
        if (!m || m.index === undefined) return "";
        const start = m.index + m[0].length;
        let end = blockText.length;
        for (const p of allFieldPatterns) {
          if (p === pattern) continue;
          const other = p.exec(blockText);
          if (other && other.index !== undefined && other.index > m.index) {
            if (other.index < end) {
              end = other.index;
            }
          }
        }
        return cleanMarkdownLinks(cleanParsedValue(blockText.substring(start, end)));
      };

      const description = extractField(descPattern);
      const hashtags = extractField(hashPattern);
      const tags = extractField(tagsPattern);

      const charCount = {
        description: description.length,
        hashtags: hashtags.length,
        tags: tags.length,
      };

      const status = evaluatePlatformSeoStatus(cur.key, charCount.description, charCount.tags);

      result[cur.key] = {
        platform: cur.key,
        description,
        hashtags,
        tags,
        charCount,
        status,
      };
    }
  }

  // Graceful fallback: If no platform sections were found, check if legacy caption/hashtags exist
  const legacyCaption = extractCaption(text);
  const legacyHashtags = extractHashtags(text);
  const legacySeo = extractThreeTierSeo(text);

  if (Object.keys(result).length === 0) {
    if (legacyCaption || legacyHashtags || legacySeo) {
      const combinedLegacyTags = legacySeo ? [legacySeo.tagSpesifik, legacySeo.tagUmum, legacySeo.tagMajemuk].filter(Boolean).join(", ") : "";
      const ytDesc = legacySeo?.deskripsi || legacyCaption;
      const ytTags = combinedLegacyTags;
      const ytHashtags = legacyHashtags;

      const ytCharCount = {
        description: ytDesc.length,
        hashtags: ytHashtags.length,
        tags: ytTags.length,
      };

      result.youtube = {
        platform: "youtube",
        description: ytDesc,
        hashtags: ytHashtags,
        tags: ytTags,
        charCount: ytCharCount,
        status: evaluatePlatformSeoStatus("youtube", ytCharCount.description, ytCharCount.tags),
      };

      // Also provide fallback for other platforms using legacy caption & hashtags
      if (legacyCaption || legacyHashtags) {
        for (const p of ["tiktok", "instagram", "facebook"] as const) {
          const charCount = {
            description: legacyCaption.length,
            hashtags: legacyHashtags.length,
            tags: 0,
          };
          result[p] = {
            platform: p,
            description: legacyCaption,
            hashtags: legacyHashtags,
            tags: "",
            charCount,
            status: evaluatePlatformSeoStatus(p, charCount.description, charCount.tags),
          };
        }
      }
    } else {
      return null;
    }
  }

  return result;
}

/**
 * Ekstrak blok kode TypeScript/TSX Remotion dari teks naskah jika ada.
 * Mendeteksi blok ```tsx atau ```typescript yang memuat import dari 'remotion'
 * atau komponen Remotion bawaan seperti AbsoluteFill / useCurrentFrame.
 */
export function extractRemotionCode(text: string): string | null {
  if (!text || !text.trim()) return null;

  // Pola 1: Iterasi seluruh blok kode terpagar (fenced code blocks)
  const codeBlockRegex = /```(?:[a-zA-Z0-9_\-]+)?\s*([\s\S]*?)```/g;
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = codeBlockRegex.exec(text)) !== null) {
    const rawContent = blockMatch[1]?.trim();
    if (!rawContent) continue;
    const isRemotion =
      /(?:from\s+['"]remotion['"]|<AbsoluteFill|useCurrentFrame|useVideoConfig|Composition)/i.test(rawContent);
    if (isRemotion) {
      return rawContent;
    }
  }

  // Pola 2: Fallback jika kode Remotion diletakkan di bawah header ## KODE REMOTION tanpa markdown backticks
  const headerMatch = text.match(/(?:##\s*|###\s*|\*\*\s*|\b)(?:KODE\s*REMOTION|REMOTION\s*CODE)[^\n]*\n([\s\S]*)/i);
  if (headerMatch && headerMatch[1]) {
    const afterHeader = headerMatch[1].trim();
    const nextHeaderIdx = afterHeader.search(/\n##\s+/);
    const candidate = (nextHeaderIdx !== -1 ? afterHeader.substring(0, nextHeaderIdx) : afterHeader).trim();
    const cleaned = candidate.replace(/^```[a-zA-Z0-9_\-]*\s*/i, "").replace(/```\s*$/i, "").trim();
    if (/(?:from\s+['"]remotion['"]|<AbsoluteFill|useCurrentFrame|useVideoConfig|Composition)/i.test(cleaned)) {
      return cleaned;
    }
  }

  return null;
}

// ── Multi-Segment Funnel Pack Parsing ─────────────────────────────────────

/**
 * Detects whether the generated script contains a 3-in-1 Funnel Pack or Single video.
 */
export function detectOutputStructure(text: string): "FUNNEL_BUNDLE" | "SINGLE" {
  if (!text || typeof text !== "string") return "SINGLE";

  const hasShort1 = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:\[?SEGMENT[:\s]+(?:SHORT\s*1|1\s*[-:]\s*SHORT)\]?)/i.test(text);
  const hasShort2 = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:\[?SEGMENT[:\s]+(?:SHORT\s*2|2\s*[-:]\s*SHORT)\]?)/i.test(text);
  const hasLong = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:\[?SEGMENT[:\s]+(?:LONG\s*PILLAR|LONG|3\s*[-:]\s*LONG)\]?)/i.test(text);

  let matchCount = 0;
  if (hasShort1) matchCount++;
  if (hasShort2) matchCount++;
  if (hasLong) matchCount++;

  return matchCount >= 2 ? "FUNNEL_BUNDLE" : "SINGLE";
}

/**
 * Extracts structured source audit and anti-hallucination metadata from the script.
 */
export function extractSourceAudit(text: string): SourceAuditData | null {
  if (!text || typeof text !== "string") return null;

  const headerRegex = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:\[?SOURCE\s*AUDIT\]?|\[?AUDIT\s*(?:LINK\s*REFERENSI|DATA\s*SUMBER)\]?)[^\n]*/i;
  const match = text.match(headerRegex);
  if (!match || match.index === undefined) return null;

  const startIndex = match.index + match[0].length;
  const afterHeader = text.substring(startIndex);

  // Stop at the next major section (e.g. ### [SEGMENT: ..., ## SCENE, etc.)
  const stopRegex = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:\[?SEGMENT|SCENE\s*1|TAHAP\s*1)/i;
  const stopMatch = afterHeader.match(stopRegex);
  const auditSection = stopMatch && stopMatch.index !== undefined
    ? afterHeader.substring(0, stopMatch.index)
    : afterHeader.substring(0, 1500);

  // Helper to extract a single line value
  const extractField = (pattern: RegExp): string | undefined => {
    const m = auditSection.match(pattern);
    return m && m[1] ? cleanParsedValue(m[1]) : undefined;
  };

  const sourceUrl = extractField(/(?:^|\r?\n)\s*[-*•]?\s*(?:\*\*)?(?:URL\s*Sumber|Source\s*URL)(?:\*\*)?[:\s]+([^\r\n]+)/i);
  const angleShift = extractField(/(?:^|\r?\n)\s*[-*•]?\s*(?:\*\*)?(?:Sudut\s*Pandang\s*Baru\s*(?:\(Angle\s*Shift\))?|Angle\s*Shift)(?:\*\*)?[:\s]+([^\r\n]+)/i);
  const pillarBridge = extractField(/(?:^|\r?\n)\s*[-*•]?\s*(?:\*\*)?(?:Jembatan\s*Funnel|Pillar\s*Bridge|Funnel\s*Bridge)(?:\*\*)?[:\s]+([^\r\n]+)/i);
  const disclaimer = extractField(/(?:^|\r?\n)\s*[-*•]?\s*(?:\*\*)?(?:Disclaimer|Catatan\s*Integritas)(?:\*\*)?[:\s]+([^\r\n]+)/i);

  // Extract key facts (bullets or numbers)
  const factsHeaderMatch = auditSection.match(/(?:^|\r?\n)\s*[-*•]?\s*(?:\*\*)?(?:Fakta\s*&\s*Data\s*Kunci|Key\s*Facts|Data\s*Kunci)(?:\*\*)?[:\s]*\r?\n([\s\S]*?)(?=(?:\r?\n\s*[-*•]?\s*(?:\*\*)?(?:Sudut\s*Pandang|Jembatan|Disclaimer|URL)|$))/i);
  let keyFacts: string[] | undefined = undefined;

  if (factsHeaderMatch && factsHeaderMatch[1]) {
    const rawLines = factsHeaderMatch[1].split(/\r?\n/);
    const facts = rawLines
      .map(l => l.replace(/^\s*[-*•\d\.]+\s*/, "").trim())
      .filter(l => l.length > 0 && !l.startsWith("###"));
    if (facts.length > 0) {
      keyFacts = facts;
    }
  }

  if (!sourceUrl && !angleShift && !pillarBridge && (!keyFacts || keyFacts.length === 0)) {
    return null;
  }

  return {
    sourceUrl,
    angleShift,
    pillarBridge,
    keyFacts,
    disclaimer,
  };
}

/**
 * Extract specific segment title from segment text (e.g., "Judul: [Judul Short 1 - Hook Penasaran]").
 */
export function extractSegmentTitle(segmentText: string): string | undefined {
  if (!segmentText) return undefined;
  const match = segmentText.match(
    /(?:^|\r?\n)\s*(?:[-*•]\s*)?(?:\*{1,2})?(?:Judul|Title|Judul\s+Video|Judul\s+Segmen|Segment\s+Title)(?:\*{1,2})?\s*:\s*([^\r\n]+)/i
  );
  if (!match) return undefined;
  let raw = match[1].replace(/[[\]"*]/g, "").trim();
  raw = raw.replace(/^\*+|\*+$/g, "").trim();
  return raw || undefined;
}

/**
 * Parses a 3-in-1 Funnel Pack script containing:
 * - SOURCE AUDIT
 * - SEGMENT: SHORT 1 (9:16)
 * - SEGMENT: SHORT 2 (9:16)
 * - SEGMENT: LONG PILLAR (16:9)
 */
export function parseFunnelPack(text: string, speechRateSec: number = 0.35): FunnelPackData {
  const sourceAudit = extractSourceAudit(text);

  // Delimiters for segments
  const short1Regex = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:\[?SEGMENT[:\s]+(?:SHORT\s*1|1\s*[-:]\s*SHORT)\]?)/i;
  const short2Regex = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:\[?SEGMENT[:\s]+(?:SHORT\s*2|2\s*[-:]\s*SHORT)\]?)/i;
  const longRegex = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:\[?SEGMENT[:\s]+(?:LONG\s*PILLAR|LONG|3\s*[-:]\s*LONG)\]?)/i;

  const mS1 = text.match(short1Regex);
  const mS2 = text.match(short2Regex);
  const mLong = text.match(longRegex);

  const idxS1 = mS1?.index !== undefined ? mS1.index : -1;
  const idxS2 = mS2?.index !== undefined ? mS2.index : -1;
  const idxLong = mLong?.index !== undefined ? mLong.index : -1;

  let s1Text = "";
  let s2Text = "";
  let longText = "";

  if (idxS1 !== -1 && idxS2 !== -1 && idxLong !== -1) {
    // Normal case: S1 -> S2 -> Long
    s1Text = text.substring(idxS1, idxS2);
    s2Text = text.substring(idxS2, idxLong);
    longText = text.substring(idxLong);
  } else {
    // Fallback if some delimiters missing
    if (idxS1 !== -1) {
      const end1 = idxS2 !== -1 ? idxS2 : (idxLong !== -1 ? idxLong : text.length);
      s1Text = text.substring(idxS1, end1);
    }
    if (idxS2 !== -1) {
      const end2 = idxLong !== -1 ? idxLong : text.length;
      s2Text = text.substring(idxS2, end2);
    }
    if (idxLong !== -1) {
      longText = text.substring(idxLong);
    }
  }

  // Titles for each segment
  const s1Title = extractSegmentTitle(s1Text);
  const s2Title = extractSegmentTitle(s2Text);
  const longTitle = extractSegmentTitle(longText);

  // Parse scenes for each segment with dedicated isolated namespace IDs
  const s1Scenes = parseScenes(s1Text, speechRateSec, 100);
  const s2Scenes = parseScenes(s2Text, speechRateSec, 200);
  const longScenes = parseScenes(longText, speechRateSec, 300);

  // Timing
  const s1Timing = calculateScriptTiming(s1Scenes, speechRateSec);
  const s2Timing = calculateScriptTiming(s2Scenes, speechRateSec);
  const longTiming = calculateScriptTiming(longScenes, speechRateSec);

  // Captions & Hashtags
  const s1Caption = extractCaption(s1Text) || undefined;
  const s1Hashtags = extractHashtags(s1Text) || undefined;
  const s2Caption = extractCaption(s2Text) || undefined;
  const s2Hashtags = extractHashtags(s2Text) || undefined;
  const longCaption = extractCaption(longText) || undefined;
  const longHashtags = extractHashtags(longText) || undefined;

  // Thumbnails (Long video typically has thumbnail studio)
  const longThumbnail = extractThumbnailData(longText) || extractThumbnailData(text);
  const s1Thumbnail = extractThumbnailData(s1Text);
  const s2Thumbnail = extractThumbnailData(s2Text);

  // SEO & Blog
  const threeTierSeo = extractThreeTierSeo(longText) || extractThreeTierSeo(text);
  const globalHtmlBlog = extractHtmlBlog(text);
  const globalBlogPack = extractBlogPublishingPack(text);

  // Multi-Platform SEO 2026
  const s1MultiPlatform = extractMultiPlatformSeo(s1Text);
  const s2MultiPlatform = extractMultiPlatformSeo(s2Text);
  const longMultiPlatform = extractMultiPlatformSeo(longText);
  const globalMultiPlatform = extractMultiPlatformSeo(text) || longMultiPlatform || s1MultiPlatform || null;

  return {
    isFunnel: true,
    sourceAudit,
    segments: {
      short1: {
        id: "short1",
        label: "Short 1 (Spark Hook)",
        title: s1Title,
        aspectRatio: "9:16",
        targetDurationSec: s1Timing.totalDurationSec || 45,
        scenes: s1Scenes,
        timingSummary: s1Timing,
        caption: s1Caption,
        hashtags: s1Hashtags,
        thumbnailData: s1Thumbnail,
        multiPlatformSeo: s1MultiPlatform || globalMultiPlatform || null,
      },
      short2: {
        id: "short2",
        label: "Short 2 (Problem & Contrarian)",
        title: s2Title,
        aspectRatio: "9:16",
        targetDurationSec: s2Timing.totalDurationSec || 45,
        scenes: s2Scenes,
        timingSummary: s2Timing,
        caption: s2Caption,
        hashtags: s2Hashtags,
        thumbnailData: s2Thumbnail,
        multiPlatformSeo: s2MultiPlatform || globalMultiPlatform || null,
      },
      long: {
        id: "long",
        label: "Long Pillar (Masterclass)",
        title: longTitle,
        aspectRatio: "16:9",
        targetDurationSec: longTiming.totalDurationSec || 600,
        scenes: longScenes,
        timingSummary: longTiming,
        caption: longCaption,
        hashtags: longHashtags,
        thumbnailData: longThumbnail,
        multiPlatformSeo: longMultiPlatform || globalMultiPlatform || null,
      },
    },
    globalHtmlBlog,
    globalBlogPack,
    threeTierSeo,
    multiPlatformSeo: globalMultiPlatform,
  };
}


