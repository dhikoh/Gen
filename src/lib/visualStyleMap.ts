/**
 * Visual Style Map — 15 preset gaya estetika untuk visual prompt generation.
 * Ported from Push App's generate route and adapted for Prompt Gen SaaS.
 *
 * Used by:
 *  - src/app/api/generate/route.ts (server-side prompt injection)
 *  - src/components/generator/GeneratorForm.tsx (UI dropdown)
 */

export interface VisualStyleEntry {
  label: string;
  prompt: string;
}

export const VISUAL_STYLE_MAP: Record<string, VisualStyleEntry> = {
  "photorealistic": {
    label: "Fotografi Realistis (Photorealistic)",
    prompt: "8k photography, hyper-detailed, photorealistic, cinematic lighting, shot on 35mm lens --style raw"
  },
  "pixar": {
    label: "Animasi 3D Pixar Style",
    prompt: "3D cartoon animation style, Pixar aesthetic, cute character design, soft lighting, vibrant pastel colors"
  },
  "ghibli": {
    label: "Anime & Manga Studio Ghibli",
    prompt: "hand-drawn anime style, Studio Ghibli aesthetic, watercolor backgrounds, soft whimsical lighting"
  },
  "cyberpunk": {
    label: "Cyberpunk & Neon Glow",
    prompt: "cyberpunk theme, futuristic city, glowing neon lights, rain-slicked streets, purple and teal palette"
  },
  "flat-vector": {
    label: "Vektor Ilustrasi Flat Art",
    prompt: "clean vector illustration style, modern flat design, minimalist lines, solid colors"
  },
  "watercolor": {
    label: "Sketsa Cat Air & Ink Wash",
    prompt: "watercolor and ink wash paint style, organic textures, soft color washes, paper texture"
  },
  "synthwave": {
    label: "Retro 80s Synthwave",
    prompt: "80s retro synthwave style, dark neon colors, laser grids, sunset glow"
  },
  "vintage-kodak": {
    label: "Sinematik Film Grain (Kodak Portra)",
    prompt: "analog film photography, Kodak Portra look, warm tones, subtle film grain, natural shadows"
  },
  "dark-fantasy": {
    label: "Fantasi Gelap & Gotik",
    prompt: "dark fantasy style, gothic aesthetic, mysterious fog, contrast-rich low-key lighting"
  },
  "claymation": {
    label: "Tanah Liat & Claymation",
    prompt: "cute claymation style, modeling clay texture, stop-motion look"
  },
  "fairytale": {
    label: "Ilustrasi Buku Dongeng Klasik",
    prompt: "vintage children's book illustration, cross-hatching, warm nostalgic feel"
  },
  "isometric": {
    label: "Isometric 3D Pop / Toy Style",
    prompt: "isometric 3D model, cute toy design, vibrant colors, clean studio background"
  },
  "pop-art": {
    label: "Comic Book / Pop Art",
    prompt: "vintage comic book style, bold outlines, halftone dots, pop art aesthetic"
  },
  "line-art": {
    label: "Minimalist Line Art / Doodle",
    prompt: "minimalist black and white line art, cute simple doodle style"
  },
  "oil-painting": {
    label: "Lukisan Klasik (Oil Painting)",
    prompt: "classic oil painting style, visible brush strokes, rich texture, canvas detail"
  }
};

/**
 * Resolve a visual style key (or free-text label) to its Midjourney-ready prompt string.
 * Falls back to fuzzy matching for common terms, then returns the raw string if no match.
 */
export function resolveVisualStyle(style: string | null | undefined): string | null {
  if (!style) return null;

  // Exact key match
  if (VISUAL_STYLE_MAP[style]) {
    return VISUAL_STYLE_MAP[style].prompt;
  }

  const lowerStyle = style.toLowerCase();

  // Fuzzy fallbacks
  if (lowerStyle.includes('pixar')) return VISUAL_STYLE_MAP['pixar'].prompt;
  if (lowerStyle.includes('ghibli') || lowerStyle.includes('anime')) return VISUAL_STYLE_MAP['ghibli'].prompt;
  if (lowerStyle.includes('cyberpunk') || lowerStyle.includes('neon')) return VISUAL_STYLE_MAP['cyberpunk'].prompt;
  if (lowerStyle.includes('kodak') || lowerStyle.includes('film grain')) return VISUAL_STYLE_MAP['vintage-kodak'].prompt;
  if (lowerStyle.includes('realistis') || lowerStyle.includes('photorealistic') || lowerStyle.includes('photography')) return VISUAL_STYLE_MAP['photorealistic'].prompt;
  if (lowerStyle.includes('watercolor') || lowerStyle.includes('cat air') || lowerStyle.includes('moody wash')) return VISUAL_STYLE_MAP['watercolor'].prompt;
  if (lowerStyle.includes('synthwave') || lowerStyle.includes('retro 80')) return VISUAL_STYLE_MAP['synthwave'].prompt;
  if (lowerStyle.includes('fantasi') || lowerStyle.includes('gotik') || lowerStyle.includes('gothic')) return VISUAL_STYLE_MAP['dark-fantasy'].prompt;
  if (lowerStyle.includes('claymation') || lowerStyle.includes('tanah liat')) return VISUAL_STYLE_MAP['claymation'].prompt;
  if (lowerStyle.includes('isometric')) return VISUAL_STYLE_MAP['isometric'].prompt;
  if (lowerStyle.includes('comic') || lowerStyle.includes('pop art')) return VISUAL_STYLE_MAP['pop-art'].prompt;
  if (lowerStyle.includes('line art') || lowerStyle.includes('doodle')) return VISUAL_STYLE_MAP['line-art'].prompt;
  if (lowerStyle.includes('oil paint') || lowerStyle.includes('lukisan')) return VISUAL_STYLE_MAP['oil-painting'].prompt;
  if (lowerStyle.includes('sinematik') || lowerStyle.includes('cinematic')) return VISUAL_STYLE_MAP['photorealistic'].prompt;
  if (lowerStyle.includes('flat') || lowerStyle.includes('vector') || lowerStyle.includes('vektor')) return VISUAL_STYLE_MAP['flat-vector'].prompt;

  // Return raw string if no match (allows custom style input)
  return style;
}

/** Get all visual style entries as an array for UI dropdowns. */
export function getVisualStyleOptions(): Array<{ value: string; label: string }> {
  return Object.entries(VISUAL_STYLE_MAP).map(([key, entry]) => ({
    value: key,
    label: entry.label,
  }));
}
