import { ProfileChannelData, PromptSettingsData } from "./promptGenerator";
import { resolveVisualStyle } from "./visualStyleMap";

export interface ImageConfigData {
  cameraType?: string | null;
  shotType?: string | null;
  lighting?: string | null;
  mood?: string | null;
  colorGrading?: string | null;
  visualStyle?: string | null;
  negativePrompt?: string | null;
  variations?: number | null;
  aspectRatio?: string | null;
}

/**
 * Composition variation profiles — each variation has a distinct creative angle.
 * Ensures generated prompts are genuinely different, not just numbered copies.
 */
interface VariationProfile {
  label: string;
  compositionFocus: string;
  cameraAngle: string;
  lightingEmphasis: string;
  depthOfField: string;
  toolRecommendation: string;
}

const VARIATION_COMPOSITIONS: VariationProfile[] = [
  {
    label: "Hero Shot",
    compositionFocus: "centered symmetrical composition, subject dominant",
    cameraAngle: "eye-level direct perspective",
    lightingEmphasis: "3/4 key lighting, soft fill, clarity and detail emphasis",
    depthOfField: "medium depth of field, subject tack-sharp, background softly diffused",
    toolRecommendation: "Midjourney v6.1, Stable Diffusion XL, Leonardo AI",
  },
  {
    label: "Intimate Close-Up",
    compositionFocus: "tight close-up, extreme texture and detail emphasis",
    cameraAngle: "slightly elevated three-quarter angle, slight overhead tilt",
    lightingEmphasis: "rim lighting or dramatic side lighting for texture depth and edge definition",
    depthOfField: "very shallow depth of field, strong foreground bokeh, creamy background blur",
    toolRecommendation: "Midjourney v6.1, Adobe Firefly, DALL-E 3",
  },
  {
    label: "Dramatic Wide",
    compositionFocus: "wide establishing shot, environmental context dominant, subject as part of scene",
    cameraAngle: "low angle looking up for scale and grandeur, worm's eye perspective",
    lightingEmphasis: "dramatic backlighting, golden hour atmospheric glow, volumetric light rays",
    depthOfField: "deep focus, full environment sharp, cinematic scope",
    toolRecommendation: "Midjourney v6.1, Stable Diffusion XL, Adobe Firefly",
  },
  {
    label: "Cinematic Dark",
    compositionFocus: "rule of thirds off-center, diagonal leading lines, negative space tension",
    cameraAngle: "slight dutch angle for tension and dynamism, cinematic tilt",
    lightingEmphasis: "chiaroscuro contrast, deep shadows, selective highlights, mystery atmosphere",
    depthOfField: "medium-shallow, foreground elements frame the subject as natural vignette",
    toolRecommendation: "Midjourney v6.1, GPT-Image-1, DALL-E 3",
  },
  {
    label: "Aerial Overview",
    compositionFocus: "overhead flat-lay or bird's eye view, graphic pattern and texture composition",
    cameraAngle: "top-down 90° or 45° diagonal bird's eye perspective",
    lightingEmphasis: "even diffused natural light, subtle directional shadows from above",
    depthOfField: "deep focus, full-frame sharp, pattern emphasis",
    toolRecommendation: "Midjourney v6.1, DALL-E 3, Imagen",
  },
];

/**
 * Calibrate Midjourney --stylize value based on selected visual style.
 * More artistic/painterly styles → higher stylize (AI takes more creative freedom).
 * Photorealistic styles → lower stylize (AI stays close to prompt).
 */
function getStylizeValue(visualStyleKey: string | null | undefined): number {
  if (!visualStyleKey) return 750;
  const highStylize = ["ghibli", "watercolor", "oil-painting", "synthwave", "cyberpunk", "dark-fantasy", "claymation", "pop-art", "fairytale", "vintage-kodak"];
  const midStylize  = ["flat-vector", "isometric", "line-art", "pixar"];
  const lowStylize  = ["photorealistic"];
  if (highStylize.includes(visualStyleKey)) return 850;
  if (midStylize.includes(visualStyleKey))  return 650;
  if (lowStylize.includes(visualStyleKey))  return 300;
  return 750;
}

/**
 * Generate image prompt variations ready for external AI image tools.
 *
 * Output formats:
 *  - `prompt_text`     → Midjourney v6.1 / Stable Diffusion / Leonardo AI
 *  - `narrative_prompt` → DALL-E 3 / GPT-Image-1 / Adobe Firefly / Imagen
 *
 * Each variation uses a different composition angle (Hero, Close-Up, Wide, Dark, Aerial)
 * to ensure genuine creative diversity, not just numbered copies.
 *
 * Fix #59: targetKeywords now integrated into both prompt formats.
 */
export function generateImagePrompt(
  channel: ProfileChannelData,
  topic: string,
  additionalContext: string,
  imageConfig: ImageConfigData,
  promptSettings?: (PromptSettingsData & { defaultNegativePrompt?: string | null }) | null,
  excludeTitles?: string[] | null,
  outputLanguage?: string | null,
  targetKeywords?: string[] | string | null,
): { masterPrompt: string; systemInstruction: string; finalJson?: string } {

  // ── Config resolution ────────────────────────────────────────────────────
  const numVars = Math.min(Math.max(imageConfig?.variations ?? 4, 1), 5);
  const activeNegPrompt = imageConfig?.negativePrompt || promptSettings?.defaultNegativePrompt || "";

  // Aspect ratio
  let ar = "16:9";
  if (imageConfig?.aspectRatio) {
    const arMap: Record<string, string> = { "9:16": "9:16", "1:1": "1:1", "3:2": "3:2", "4:3": "4:3" };
    ar = arMap[imageConfig.aspectRatio] ?? "16:9";
  }
  const arFlag = `--ar ${ar}`;

  // Visual style — prefer imageConfig.visualStyle (slug), fall back to channel.visualAesthetic (free-text)
  const visualStyleKey = imageConfig?.visualStyle || "";
  const resolvedStyle   = resolveVisualStyle(imageConfig?.visualStyle) ?? resolveVisualStyle(channel.visualAesthetic) ?? channel.visualAesthetic ?? "";
  const stylizeValue    = getStylizeValue(visualStyleKey || null);

  // Keywords
  const kwList: string[] = Array.isArray(targetKeywords)
    ? targetKeywords
    : typeof targetKeywords === "string" && targetKeywords.trim()
    ? targetKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];
  const keywordsText = kwList.join(", ");

  // Core subject description
  const subjectCore = [topic.trim(), additionalContext?.trim()].filter(Boolean).join(". ");

  // ── Build variations ─────────────────────────────────────────────────────
  const variations = [];

  for (let i = 0; i < numVars; i++) {
    const profile = VARIATION_COMPOSITIONS[i % VARIATION_COMPOSITIONS.length];

    // ── Midjourney v6.1 prompt_text ─────────────────────────────────────────
    // Ordering: Subject → Composition → Lighting → Mood/Color → Style → Technical
    const mjParts: string[] = [];

    // 1. Subject (highest weight in MJ v6)
    mjParts.push(subjectCore);

    // 2. Keywords woven naturally into subject context
    if (keywordsText) mjParts.push(keywordsText);

    // 3. Variation-specific composition angle
    mjParts.push(profile.compositionFocus);
    mjParts.push(profile.cameraAngle);

    // 4. Lighting — user setting takes priority, profile as fallback
    if (imageConfig?.lighting) {
      mjParts.push(imageConfig.lighting);
    } else {
      mjParts.push(profile.lightingEmphasis);
    }

    // 5. Mood & atmosphere
    if (imageConfig?.mood) mjParts.push(`${imageConfig.mood} mood`);

    // 6. Color grading
    if (imageConfig?.colorGrading) mjParts.push(`${imageConfig.colorGrading} color grading`);

    // 7. Depth of field — profile-specific unless camera type overrides
    const hasCameraOverride = imageConfig?.cameraType && imageConfig.cameraType !== "Default";
    if (!hasCameraOverride) {
      mjParts.push(profile.depthOfField);
    }

    // 8. Camera/lens specification
    if (hasCameraOverride) {
      mjParts.push(`shot on ${imageConfig.cameraType}`);
    }

    // 9. Shot type (user-defined framing)
    if (imageConfig?.shotType) mjParts.push(imageConfig.shotType);

    // 10. Visual style prompt string (from VISUAL_STYLE_MAP or raw)
    if (resolvedStyle) mjParts.push(resolvedStyle);

    // 11. Channel brand reference (soft influence)
    if (channel.channelName) mjParts.push(`${channel.channelName} brand visual identity`);

    // Build prompt core + MJ technical parameters
    const promptCore = mjParts.filter(Boolean).join(", ");
    const negParam   = activeNegPrompt && activeNegPrompt !== "None" ? ` --no ${activeNegPrompt}` : "";
    const prompt_text = `${promptCore} ${arFlag} --v 6.1 --q 2 --stylize ${stylizeValue}${negParam}`;

    // ── DALL-E 3 / GPT-Image-1 / Imagen narrative_prompt ────────────────────
    // Natural language instruction style — no technical flags
    const np: string[] = [];
    np.push(`Create a ${profile.label.toLowerCase()} professional image:`);
    np.push(subjectCore + ".");
    if (keywordsText) np.push(`Key themes to incorporate: ${keywordsText}.`);
    np.push(`Composition: ${profile.compositionFocus}, using a ${profile.cameraAngle}.`);
    np.push(imageConfig?.lighting
      ? `Lighting: ${imageConfig.lighting}.`
      : `Lighting: ${profile.lightingEmphasis}.`);
    if (imageConfig?.mood) np.push(`Mood and atmosphere: ${imageConfig.mood}.`);
    if (imageConfig?.colorGrading) np.push(`Color treatment: ${imageConfig.colorGrading} color grading.`);
    np.push(`Depth of field: ${profile.depthOfField}.`);
    if (hasCameraOverride) np.push(`Camera: ${imageConfig.cameraType}.`);
    if (imageConfig?.shotType) np.push(`Framing: ${imageConfig.shotType}.`);
    if (resolvedStyle) np.push(`Visual style: ${resolvedStyle}.`);
    if (channel.channelName) np.push(`Brand aesthetic: aligned with ${channel.channelName}.`);
    np.push(`Aspect ratio: ${ar}. High quality, professional, ultra-detailed.`);
    if (activeNegPrompt && activeNegPrompt !== "None") np.push(`Do NOT include: ${activeNegPrompt}.`);
    const narrative_prompt = np.join(" ");

    variations.push({
      id: i + 1,
      label: profile.label,
      prompt_text,
      narrative_prompt,
      negative_prompt: activeNegPrompt || null,
      aspect_ratio: arFlag,
      tool_recommendation: profile.toolRecommendation,
    });
  }

  // ── finalJson ────────────────────────────────────────────────────────────
  const finalJson = JSON.stringify({
    topic,
    keywords: kwList.length > 0 ? kwList : undefined,
    visual_style: resolvedStyle || undefined,
    stylize: stylizeValue,
    channel: channel.channelName,
    variations,
  }, null, 2);

  // ── masterPrompt — tool guide shown to user ───────────────────────────────
  const variationSummary = variations
    .map((v, i) => `  ${i + 1}. ${v.label} — ${VARIATION_COMPOSITIONS[i % VARIATION_COMPOSITIONS.length].compositionFocus}`)
    .join("\n");

  const masterPrompt = [
    "📌 PANDUAN PENGGUNAAN PROMPT GAMBAR — Prompt Gen",
    "",
    "▸ prompt_text → Paste ke Midjourney (/imagine), Stable Diffusion XL, atau Leonardo AI.",
    `  Format MJ v6.1 lengkap: deskripsi + komposisi + gaya + --ar ${ar} --v 6.1 --q 2 --stylize ${stylizeValue}`,
    "",
    "▸ narrative_prompt → Gunakan untuk DALL-E 3 (ChatGPT Plus), GPT-Image-1, Adobe Firefly, atau Imagen.",
    "  Format bahasa natural, cocok untuk model gambar berbasis instruksi deskriptif.",
    "",
    `▸ ${numVars} variasi dengan komposisi berbeda:`,
    variationSummary,
    "",
    "▸ Tips Midjourney v6.1:",
    `  - --stylize ${stylizeValue} dikalibrasi sesuai gaya visual \"${resolvedStyle || "custom"}\". Range 0–1000.`,
    "  - Naikkan --stylize mendekati 1000 untuk hasil lebih artistik dan imajinatif.",
    "  - Turunkan --stylize ke 100–300 untuk hasil lebih literal dan foto-realistis.",
    keywordsText ? `  - Kata kunci "${keywordsText}" sudah terintegrasi di dalam prompt.` : "",
    "  - Gunakan --seed [angka] untuk mendapatkan hasil konsisten antar-variasi.",
    "",
    "Edit JSON di bawah untuk menyesuaikan prompt sebelum digunakan.",
  ].filter((line) => line !== undefined && line !== null).join("\n");

  // ── systemInstruction ────────────────────────────────────────────────────
  let systemInstruction = "Image prompts generated successfully.";
  if (promptSettings?.imageSystemInstruction?.trim()) {
    systemInstruction = promptSettings.imageSystemInstruction.trim();
  }
  if (outputLanguage && outputLanguage.trim().length > 0) {
    systemInstruction += `\nNote: Visual prompts for Midjourney/image AI are kept in English. Any caption ideas or overlay text should be in ${outputLanguage.trim()}.`;
  }
  if (excludeTitles && excludeTitles.length > 0) {
    const titleList = excludeTitles.map((t, idx) => `${idx + 1}. ${t}`).join("\n");
    systemInstruction += `\n\nIMPORTANT — AVOID THESE TOPICS (already used):\n${titleList}\nDo not create variations, paraphrases, or topics similar to the titles above.`;
  }

  return {
    masterPrompt,
    systemInstruction,
    finalJson,
  };
}
