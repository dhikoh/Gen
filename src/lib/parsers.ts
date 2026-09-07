/**
 * Shared parsing utilities for both the Prompt Generator and Scene Prompt
 * Studio pages. Ported from Push app and adapted for Prompt Gen i18n/SaaS.
 *
 * All functions are client-safe (no server-only imports).
 */

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
    /(?:##|###|\*\*|\b)\s*(?:THUMBNAIL STUDIO|IMAGE PROMPT|THUMBNAIL VISUAL PROMPT|THUMBNAIL PROMPT|THUMBNAIL)/i,
  );
  const index = match?.index !== undefined ? match.index : -1;
  if (index === -1) return null;

  let thumbnailPart = text.substring(index).trim();
  const stopMatch = thumbnailPart.match(/(?:\r?\n|^)\s*(?:##\s*|###\s*|\*\*\s*|\b)(?:HTML\s*BLOG|REKOMENDASI\s*PRODUK)/i);
  if (stopMatch && stopMatch.index !== undefined && stopMatch.index > 0) {
    thumbnailPart = thumbnailPart.substring(0, stopMatch.index).trim();
  }

  const keys = [
    { field: "seoText" as const, pattern: /(?:TEKS\s+OVERLAY\s+SEO|SEO\s+TEXT|TEKS\s+OVERLAY)\s*(?:\*\*|\*)*\s*:\s*/i },
    { field: "opsi1Prompt" as const, pattern: /(?:OPSI\s+1\s+PROMPT|OPSI\s+1|OPTION\s+1\s+PROMPT|OPTION\s+1)\s*(?:\*\*|\*)*\s*:\s*/i },
    { field: "opsi1Overlay" as const, pattern: /(?:OPSI\s+1\s+TEKS\s+OVERLAY|OPTION\s+1\s+TEXT\s+OVERLAY|TEXT\s+OVERLAY\s+OPTION\s+1|TEKS\s+OVERLAY\s+OPSI\s+1)\s*(?:\*\*|\*)*\s*:\s*/i },
    { field: "opsi2Prompt" as const, pattern: /(?:OPSI\s+2\s+PROMPT|OPSI\s+2|OPTION\s+2\s+PROMPT|OPTION\s+2)\s*(?:\*\*|\*)*\s*:\s*/i },
    { field: "opsi2Overlay" as const, pattern: /(?:OPSI\s+2\s+TEKS\s+OVERLAY|OPTION\s+2\s+TEXT\s+OVERLAY|TEXT\s+OVERLAY\s+OPTION\s+2|TEKS\s+OVERLAY\s+OPSI\s+2)\s*(?:\*\*|\*)*\s*:\s*/i },
    { field: "recommendations" as const, pattern: /(?:REKOMENDASI\s+WARNA\s*(?:&\s*ELEMEN)?|REKOMENDASI|RECOMMENDATIONS)\s*(?:\*\*|\*)*\s*:\s*/i },
  ];

  const cv = (v: string) => {
    if (!v) return "";
    const qm = v.match(/^"([^"]+)"$/);
    if (qm) return qm[1].trim();
    return v.replace(/^["'\s]+|["'\s]+$/g, "").trim();
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
  isDiegetic?: boolean;
}

/** Extract [SFX: …] and [BGM: …] cues and diegetic status from narration text. */
export function extractAudioCues(text: string): AudioCues {
  const bgmRegex = /\[(?:bgm|backsound):\s*([^\]]+)\]/gi;
  const sfxRegex = /\[(?:sfx|sound):\s*([^\]]+)\]/gi;
  const diegeticRegex = /\[(?:diegetic|tanpa\s*voice-?over|no\s*voice-?over)(?:\s*-\s*[^\]]+)?\]/gi;

  const bgmCues = Array.from(text.matchAll(bgmRegex)).map((m) => m[1].trim());
  const sfxCues = Array.from(text.matchAll(sfxRegex)).map((m) => m[1].trim());
  const isDiegetic = diegeticRegex.test(text) || /diegetic\s*only/i.test(text);

  let cleanNarasi = text
    .replace(/\[(?:SFX|sfx|Sound|sound|Sfx)\b[^\]]*\]/gi, "")
    .replace(/\[(?:BGM|bgm|Backsound|backsound)\b[^\]]*\]/gi, "")
    .replace(/\[(?:diegetic|tanpa\s*voice-?over|no\s*voice-?over)(?:\s*-\s*[^\]]+)?\]/gi, "")
    .replace(/dilarang ada narasi\/voice-over luar adegan[^\n.]*(?:\.|$)/gi, "")
    .replace(/hanya suara diegetic\/in-scene[^\n.]*(?:\.|$)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // If narration is empty or only hyphens/quotes/whitespace
  if (/^[-—\s"':]+$/.test(cleanNarasi)) {
    cleanNarasi = "";
  }

  return { cleanNarasi, bgmCues, sfxCues, isDiegetic };
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

  const bgmMatches = Array.from(visualText.matchAll(bgmRegex)).map((m) => `BGM: ${m[1].trim()}`);
  const sfxMatches = Array.from(visualText.matchAll(sfxRegex)).map((m) => `SFX: ${m[1].trim()}`);

  const combined = [...hints, ...bgmMatches, ...sfxMatches];
  return combined.length > 0 ? combined.join(" | ") : null;
}

// ── Voice Guidelines ──────────────────────────────────────────────────────

export interface VoiceGuidelines {
  sampleContext?: string;
  directorsNote?: string;
  traits?: string;
}

/** Parse voice guidelines from a "Context: … | Note: … | Traits: …" string. */
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

/**
 * Extract the ## HTML BLOG section from a video generator Markdown output.
 * Returns the raw HTML string (which may contain <h1>, <p>, <h2>, <h3> tags)
 * ready to be stored in parsedData.html_blog and rendered via sanitize-html.
 *
 * Stops at the next ## header or end-of-string.
 */
export function extractHtmlBlog(text: string): string {
  if (!text) return "";

  // Find the HTML BLOG section header (supports ## header, **bold**, or plain text)
  const match = text.match(/(?:##\s*|###\s*|\*\*\s*|\b)HTML\s*BLOG\s*/i);
  if (!match || match.index === undefined) return "";

  const startIdx = match.index + match[0].length;
  // Stop at the next ## header or REKOMENDASI PRODUK / THUMBNAIL header or end of text
  const afterSection = text.substring(startIdx);
  const nextHeader = afterSection.search(/(?:\n##\s+|\n(?:\*\*\s*)?REKOMENDASI\s+PRODUK|\n(?:\*\*\s*)?THUMBNAIL)/i);
  const rawBlock = nextHeader !== -1
    ? afterSection.substring(0, nextHeader).trim()
    : afterSection.trim();

  return rawBlock;
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

