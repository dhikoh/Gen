export const ART_STYLE_KEYS = ["bw_sketch", "watercolor", "cinematic_semi_real", "cartoon_2d", "custom"] as const;
export type ArtStyleKey = (typeof ART_STYLE_KEYS)[number];

export interface StyleBible {
  artStyle: ArtStyleKey;
  customStyle: string;
  characters: string;
  palette: string;
  locations: string;
  extraRules: string;
}

export const DEFAULT_STYLE_BIBLE: StyleBible = {
  artStyle: "bw_sketch",
  customStyle: "",
  characters: "",
  palette: "",
  locations: "",
  extraRules: "",
};

export interface StoryboardScene {
  /** Urutan 1-based di daftar scene (sama dengan nomor panel). */
  index: number;
  context?: string;
  visual: string;
  settingKamera?: string;
  durasi?: string;
}

export interface CameraSetting {
  shotSize?: string;
  angle?: string;
  lens?: string;
  depthOfField?: string;
  movement?: string;
  composition?: string;
}

const ART_STYLE_DESCRIPTIONS: Record<Exclude<ArtStyleKey, "custom">, string> = {
  bw_sketch: "black-and-white pencil storyboard sketch, loose confident ink lines, light grey tonal shading, no color",
  watercolor: "soft watercolor storyboard illustration, light color washes, visible pencil outlines",
  cinematic_semi_real: "semi-realistic cinematic concept art, muted film-like color grading, soft volumetric light",
  cartoon_2d: "clean 2D cartoon illustration, bold outlines, flat colors",
};

/** Parse baris "ECU | low angle | 50mm | shallow DOF | slow push-in | rule of thirds". */
export function parseCameraSetting(raw?: string | null): CameraSetting | null {
  if (!raw) return null;
  const parts = raw.split("|").map((p) => p.trim());
  if (parts.length < 2) return null;
  const val = (i: number): string | undefined => (parts[i] && parts[i] !== "—" ? parts[i] : undefined);
  return {
    shotSize: val(0),
    angle: val(1),
    lens: val(2),
    depthOfField: val(3),
    movement: val(4),
    composition: val(5),
  };
}

export function describeAspectRatio(ar: string): string {
  const v = ar.trim();
  if (v === "9:16") return "vertical 9:16";
  if (v === "16:9") return "horizontal 16:9";
  if (v === "1:1") return "square 1:1";
  if (v === "4:5") return "vertical 4:5";
  return v || "vertical 9:16";
}

/**
 * Visual Prompt di aplikasi ini ditulis untuk KLIP VIDEO (ada --ar, [SFX], [BGM], "no voice over", dll).
 * Untuk panel storyboard (gambar diam) bagian-bagian itu dibuang.
 */
export function cleanVisualForStill(visual: string): string {
  return visual
    .replace(/--ar\s+\d+:\d+/gi, "")
    .replace(/\[(?:SFX|BGM|AMBIENT|FOLEY|ATMOS)[^\]]*\]/gi, "")
    .replace(/\b(?:accompanied by|immersed in|as background music|no sound effects|no ambient sound|no background music|no voice[- ]?over)\b/gi, "")
    .replace(/\bwith\s*(?=[,.]|$)/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/(?:,\s*){2,}/g, ", ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();
}

function styleDescription(bible: StyleBible): string {
  if (bible.artStyle === "custom") {
    return bible.customStyle.trim() || ART_STYLE_DESCRIPTIONS.bw_sketch;
  }
  return ART_STYLE_DESCRIPTIONS[bible.artStyle];
}

/** Prompt pertama yang ditempel user ke AI gambar: mengunci gaya & karakter. */
export function buildStyleBiblePrompt(bible: StyleBible, aspectRatio: string, topic: string): string {
  const lines = [
    "You are my storyboard artist. I will send you ONE panel description at a time.",
    'First, lock the STYLE BIBLE below and apply it to EVERY panel I send afterwards. Reply only with "STYLE LOCKED" and wait for the first panel.',
    "",
    "STYLE BIBLE",
    `- Art style: ${styleDescription(bible)}`,
    `- Frame: ${describeAspectRatio(aspectRatio)}`,
    `- Characters (keep identical in every panel): ${bible.characters.trim() || "none specified; keep any recurring subject visually identical"}`,
    `- Color palette: ${bible.palette.trim() || "follow the art style"}`,
    `- Recurring locations: ${bible.locations.trim() || "n/a"}`,
    `- Extra rules: ${bible.extraRules.trim() || "n/a"}`,
    "- Global rules: exactly one single frame per image (no collage, no grid, no panels side by side), no speech bubbles, no captions, no watermark, no text inside the image.",
  ];
  if (topic.trim()) lines.push("", `Video topic (context only): ${topic.trim()}`);
  return lines.join("\n");
}

/** Prompt per panel (scene). Dalam bahasa Inggris karena AI gambar paling stabil dengan itu. */
export function buildPanelPrompt(
  scene: StoryboardScene,
  total: number,
  opts: { aspectRatio: string; cameraMovementEnabled: boolean }
): string {
  const cam = parseCameraSetting(scene.settingKamera);
  const visual = cleanVisualForStill(scene.visual);
  const lines: string[] = [
    `PANEL ${scene.index}/${total}. Apply the locked STYLE BIBLE and keep the same characters. Generate ONE image, aspect ratio ${describeAspectRatio(opts.aspectRatio)}.`,
  ];
  if (scene.context?.trim()) lines.push(`Scene: ${scene.context.trim()}`);
  lines.push(`Draw the single most representative keyframe of this action (a still frame, not a sequence): ${visual || "(no visual description provided)"}`);

  if (cam) {
    const bits = [
      cam.shotSize && `shot size ${cam.shotSize}`,
      cam.angle && `angle ${cam.angle}`,
      cam.lens && `lens ${cam.lens}`,
      cam.depthOfField && `depth of field ${cam.depthOfField}`,
      cam.composition && `composition ${cam.composition}`,
    ].filter((x): x is string => Boolean(x));
    if (bits.length) lines.push(`Camera: ${bits.join("; ")}.`);
  } else {
    lines.push("Camera: choose the framing that best fits the action.");
  }

  if (!opts.cameraMovementEnabled) {
    lines.push("Camera movement: static (do not draw motion arrows).");
  } else if (cam?.movement && cam.movement.toLowerCase() !== "static") {
    lines.push(`Camera movement: ${cam.movement}. Show it only as a subtle arrow overlay if the style allows.`);
  } else {
    lines.push("Camera movement: static (do not draw motion arrows).");
  }

  lines.push("Do not add any text, caption, or watermark inside the image.");
  return lines.join("\n");
}

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/** Urutkan nama file secara natural (panel2 < panel10) lalu pasangkan ke Scene 1..N. */
export function assignFilesToScenes(
  names: string[],
  totalScenes: number
): { name: string; sceneNumber: number | null }[] {
  const sorted = [...names].sort(naturalCompare);
  return sorted.map((name, i) => ({ name, sceneNumber: i + 1 <= totalScenes ? i + 1 : null }));
}
