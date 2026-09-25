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

/** Extract [SFX: …] and [BGM: …] cues and diegetic status from narration text. */
export function extractAudioCues(text: string): AudioCues {
  const bgmRegex = /\[(?:bgm|backsound):\s*([^\]]+)\]/gi;
  const sfxRegex = /\[(?:sfx|sound):\s*([^\]]+)\]/gi;
  const diegeticRegex = /\[(?:diegetic|tanpa\s*voice-?over|no\s*voice-?over)(?:\s*-\s*[^\]]+)?\]/gi;

  const bgmCues = Array.from(text.matchAll(bgmRegex)).map((m) => m[1].trim());
  const sfxCues = Array.from(text.matchAll(sfxRegex)).map((m) => m[1].trim());
  const isDiegetic = diegeticRegex.test(text) || /diegetic\s*only/i.test(text);

  let cleanNarasi = text
    .replace(/\[(?:SFX|sfx)\b[^\]]*\]/gi, "")
    .replace(/\[(?:Sound|sound)\s*[:\-][^\]]*\]/gi, "")
    .replace(/\[(?:BGM|bgm|Backsound|backsound)\b[^\]]*\]/gi, "")
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

// ── Scene Extraction & Parsing ──────────────────────────────────────────────

export interface Scene {
  id: number;
  sceneNumber: string;
  narasi: string;
  teksOverlay?: string;
  overlayType?: "chapter_title" | "key_point";
  chapter?: number;
  chapterTitle?: string;
  chapterPrefix?: string;
  visual: string;
  durasi: string;
  bgmCues?: string[];
  sfxCues?: string[];
  isDiegetic?: boolean;
  voiceGuidelines?: VoiceGuidelines;
  targetEmosi?: string;
  teknikPacing?: string;
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

    // Ignore SFX/BGM technical cues like [SFX: explosion], [BGM: epic]
    if (/^(?:sfx|bgm|audio|visual|music)\b/i.test(rawTag)) {
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

/**
 * Parse AI generated script text into structured Scene items with support for:
 * - Chapter markers (BAB N: Title or CHAPTER N: Title)
 * - Narration, Audio cues (BGM, SFX, Diegetic)
 * - Target Emosi (VET 3-Act Storytelling)
 * - Teknik Editing & Pacing (Jump cut, beat-sync, b-roll cutaways)
 * - Overlay types (Chapter Title / Key Point)
 * - Visual prompts and durations
 */
export function parseScenes(text: string): Scene[] {
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
  const delimiters = "(?:Target\\s*Emosi(?:\\s*\\(VET\\))?|Emosi|Teknik\\s*(?:Editing(?:\\s*&\\s*Pacing)?|Pacing)|Pacing|Teks\\s*Overlay|Text\\s*Overlay|Overlay|Panduan\\s*Suara|Voice\\s*Guidelines|Visual\\s*Prompt|Visual|Deskripsi\\s*Visual|Prompt|Durasi|Time|Duration)";
  const delimLookahead = `(?=(?:\\r?\\n)+(?:\\*\\*)?${delimiters}(?::\\s*\\*\\*|\\*\\*\\s*:|:)|\\r?\\n+[-*_]{3,}|\\r?\\n+(?:#{1,6}\\s*|\\*{2,3}\\s*|={2,4}\\s*)*(?:Scene|Adegan|Bagian|Part)\\s+[a-zA-Z0-9_\\-]+|\\r?\\n+(?:#{1,6}\\s*|\\*{2,3}\\s*|={2,4}\\s*)*(?:TOTAL|THUMBNAIL|METADATA|RINGKASAN|HASHTAG|CAPTION)|$)`;

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
      const sceneNum = parts[i], content = parts[i + 1] || "";
      charOffset += sceneNum.length;
      const sceneStartOffset = charOffset;
      charOffset += content.length;

      const stop = /(?:^|\r?\n)(?:#{1,6}\s*|\*{2,3}\s*|={2,4}\s*)*(?:TOTAL\s*DURASI|TOTAL|RINGKASAN|THUMBNAIL|ARTIKEL|HASHTAG|CAPTION|JUDUL\s*TERPILIH|HTML\s*BLOG|REKOMENDASI|METADATA\s*SEO)/i;
      const m = content.match(stop);
      const c = m ? content.slice(0, m.index) : content;

      const matchField = (keys: string) => {
        const reg = new RegExp(`(?:^|\\r?\\n)(?:\\*\\*)?(?:${keys})(?::\\s*\\*\\*|\\*\\*\\s*:|:)\\s*([\\s\\S]*?)${delimLookahead}`, "i");
        return c.match(reg);
      };

      const nar = matchField("Narasi|Dialog|Voice\\s*Over|VO|Audio");
      const emosi = matchField("Target\\s*Emosi(?:\\s*\\(VET\\))?|Emosi");
      const pacing = matchField("Teknik\\s*(?:Editing(?:\\s*&\\s*Pacing)?|Pacing)|Pacing");
      const overlay = matchField("Teks\\s*Overlay|Text\\s*Overlay|Overlay");
      const vis = matchField("Visual\\s*Prompt|Visual|Deskripsi\\s*Visual|Prompt");
      const dur = matchField("Durasi|Time|Duration");
      const voi = matchField("Panduan\\s*Suara|Voice\\s*Guidelines");

      const narVal = nar ? cleanParsedValue(nar[1]) : "";
      const emosiVal = emosi ? cleanParsedValue(emosi[1]) : "";
      const pacingVal = pacing ? cleanParsedValue(pacing[1]) : "";
      const rawOverlay = overlay ? cleanParsedValue(overlay[1]).replace(/^["']|["']$/g, "").trim() : "";
      const visVal = vis ? cleanParsedValue(vis[1]) : "";
      const durVal = dur ? normalizeDurasi(dur[1]) : "5s";

      if (narVal || visVal || rawOverlay || emosiVal || pacingVal) {
        const audio = extractAudioCues(narVal);
        const overlayParsed = rawOverlay ? parseOverlayType(rawOverlay) : null;
        const overlayText = overlayParsed?.text || undefined;
        const overlayType = overlayParsed?.type || undefined;
        const chapterInfo = findChapterAt(sceneStartOffset);

        scenes.push({
          id: count,
          sceneNumber: isNaN(Number(sceneNum)) ? sceneNum : `Scene ${sceneNum}`,
          narasi: audio.cleanNarasi || "—",
          teksOverlay: overlayText && overlayText !== "—" ? overlayText : undefined,
          overlayType,
          chapter: chapterInfo?.num,
          chapterTitle: chapterInfo?.title,
          chapterPrefix: chapterInfo?.prefix,
          visual: visVal || "—",
          durasi: durVal,
          bgmCues: audio.bgmCues,
          sfxCues: audio.sfxCues,
          isDiegetic: audio.isDiegetic,
          voiceGuidelines: voi ? parseVoiceGuidelines(cleanParsedValue(voi[1])) : undefined,
          targetEmosi: emosiVal && emosiVal !== "—" ? emosiVal : undefined,
          teknikPacing: pacingVal && pacingVal !== "—" ? pacingVal : undefined,
        });
        count++;
      }
    }
  }

  if (!scenes.length) {
    const audio = extractAudioCues(text);
    scenes.push({
      id: 1,
      sceneNumber: "Scene 1",
      narasi: audio.cleanNarasi.slice(0, 120) || (audio.isDiegetic ? "—" : text.slice(0, 120)),
      visual: text,
      durasi: "15s",
      bgmCues: audio.bgmCues,
      sfxCues: audio.sfxCues,
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


