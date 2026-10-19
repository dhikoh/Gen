import {
  ART_STYLE_KEYS,
  DEFAULT_STYLE_BIBLE,
  type ArtStyleKey,
  type StoryboardScene,
  type StyleBible,
} from "@/lib/storyboardPromptBuilder";
import { isRecord } from "@/lib/typeGuards";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * Ambil daftar scene untuk storyboard dari Draft.parsedData.scenes.
 * Draft lama dari alur Generator (tanpa scenes[]) menghasilkan array kosong.
 */
export function extractStoryboardScenes(parsedData: unknown): StoryboardScene[] {
  if (!isRecord(parsedData) || !Array.isArray(parsedData.scenes)) return [];
  const out: StoryboardScene[] = [];
  for (const item of parsedData.scenes) {
    if (!isRecord(item)) continue;
    const visual = str(item.visual).trim();
    out.push({
      index: out.length + 1,
      context: str(item.sceneContext).trim() || undefined,
      visual: visual === "—" ? "" : visual,
      settingKamera: str(item.settingKamera).trim() || undefined,
      durasi: str(item.durasi).trim() || undefined,
    });
  }
  return out;
}

/** Baca Draft.storyboard.styleBible dengan validasi; nilai tidak valid diganti default. */
export function readStyleBible(storyboard: unknown): StyleBible {
  if (!isRecord(storyboard) || !isRecord(storyboard.styleBible)) return { ...DEFAULT_STYLE_BIBLE };
  const sb = storyboard.styleBible;
  const art = ART_STYLE_KEYS.find((k: ArtStyleKey) => k === sb.artStyle) ?? DEFAULT_STYLE_BIBLE.artStyle;
  return {
    artStyle: art,
    customStyle: str(sb.customStyle),
    characters: str(sb.characters),
    palette: str(sb.palette),
    locations: str(sb.locations),
    extraRules: str(sb.extraRules),
  };
}

/** Rasio dari snapshot generationConfig; default 9:16. */
export function readAspectRatio(generationConfig: unknown): string {
  if (isRecord(generationConfig) && isRecord(generationConfig.videoConfig)) {
    const ar = str(generationConfig.videoConfig.aspectRatio).trim();
    if (ar) return ar;
  }
  return "9:16";
}

/** false hanya jika snapshot secara eksplisit mematikan camera movement. */
export function readCameraMovementEnabled(generationConfig: unknown): boolean {
  return !(isRecord(generationConfig) && generationConfig.cameraMovementEnabled === false);
}
