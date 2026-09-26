/**
 * Format helper untuk Scene Prompt Studio.
 *
 * Fitur 2: buildOverlayVisualCopyText — copy gabungan Overlay + Visual per scene
 * Fitur 3: buildBatchExportText — ekspor batch dengan delimiter untuk parse-engine eksternal
 * Fitur 88: buildUnifiedVisualPrompt — format terpadu [durasi] + [scene context] + [Visual Prompt]
 */

export interface SceneForExport {
  id: number;
  sceneNumber: string;
  sceneContext?: string;
  narasi: string;
  visual: string;
  teksOverlay?: string;
  overlayType?: "chapter_title" | "key_point";
  chapter?: number;
  chapterTitle?: string;
  durasi?: string;
  estimatedDurationSec?: number;
}

export interface UnifiedVisualPromptOptions {
  includeDuration?: boolean;
  includeContext?: boolean;
  locale?: string;
}

/**
 * Bangun format terpadu 1 kesatuan berbasis locale:
 * Jika English (en):
 * [duration : 5s]
 * [scene context]
 * ...
 * [Visual Prompt]
 * ...
 *
 * Jika Indonesian (id):
 * [durasi : 5 detik]
 * [konteks adegan]
 * ...
 * [Prompt Visual]
 * ...
 */
export function buildUnifiedVisualPrompt(
  scene: {
    visual: string;
    durasi?: string;
    estimatedDurationSec?: number;
    sceneContext?: string;
  },
  options: UnifiedVisualPromptOptions = { includeDuration: true, includeContext: true, locale: "id" }
): string {
  const isEn = options.locale === "en";
  const parts: string[] = [];

  // 1. Durasi
  if (options.includeDuration !== false) {
    const rawDurasi = scene.durasi?.trim();
    let durasiStr = "";
    if (rawDurasi && rawDurasi !== "—") {
      durasiStr = rawDurasi;
    } else if (scene.estimatedDurationSec !== undefined && scene.estimatedDurationSec > 0) {
      durasiStr = isEn ? `${scene.estimatedDurationSec}s` : `${scene.estimatedDurationSec} detik`;
    }

    if (durasiStr) {
      if (isEn) {
        const enDurasi = durasiStr.replace(/\s*detik/gi, "s");
        parts.push(`[duration : ${enDurasi}]`);
      } else {
        const idDurasi = durasiStr.replace(/(\d+)\s*s\b/gi, "$1 detik");
        parts.push(`[durasi : ${idDurasi}]`);
      }
    }
  }

  // 2. Scene Context
  if (options.includeContext !== false && scene.sceneContext?.trim()) {
    const contextTag = isEn ? "[scene context]" : "[konteks adegan]";
    parts.push(`${contextTag}\n${scene.sceneContext.trim()}`);
  }

  // 3. Visual Prompt
  const visualClean = scene.visual && scene.visual !== "—" ? scene.visual.trim() : "";
  if (visualClean) {
    const visualTag = isEn ? "[Visual Prompt]" : "[Prompt Visual]";
    parts.push(`${visualTag}\n${visualClean}`);
  }

  return parts.join("\n");
}

// ─── Fitur 2: Overlay + Visual per scene ──────────────────────────────────────

/**
 * Gabungkan teks overlay dan visual prompt menjadi satu teks terformat.
 * Dipakai tombol "Copy Overlay + Visual" per scene.
 */
export function buildOverlayVisualCopyText(scene: SceneForExport, locale: string = "id"): string {
  const isEn = locale === "en";
  const parts: string[] = [];

  if (scene.teksOverlay) {
    const overlayTag = isEn ? "[Screen Overlay Text]" : "[Teks Overlay Layar]";
    parts.push(`${overlayTag}\n${scene.teksOverlay}`);
  }

  const visual = scene.visual && scene.visual !== "—" ? scene.visual.trim() : "";
  if (visual) {
    const visualTag = isEn ? "[Visual Prompt]" : "[Prompt Visual]";
    parts.push(`${visualTag}\n${visual}`);
  }

  return parts.join("\n\n");
}

// ─── Fitur 3: Batch Export ────────────────────────────────────────────────────

export interface BatchExportFilterOptions {
  includeNarasi: boolean;
  includeVisual: boolean;
  includeDurasi: boolean;
  includeContext: boolean;
  includeOverlay: boolean;
}

export const DEFAULT_BATCH_EXPORT_FILTER: BatchExportFilterOptions = {
  includeNarasi: true,
  includeVisual: true,
  includeDurasi: true,
  includeContext: true,
  includeOverlay: true,
};

const BATCH_START = "###PROMPTGEN_BATCH_EXPORT###";
const BATCH_END = "###PROMPTGEN_BATCH_EXPORT_END###";
const SCENE_DELIMITER = "---SCENE---";

/**
 * Sanitasi value agar tidak mengandung newline yang merusak format parser.
 * Tab dan newline diganti dengan spasi tunggal.
 */
function sanitizeField(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

/**
 * Bangun teks batch export dari array scene yang dipilih dengan opsi filter dan locale.
 *
 * Logika Penyatuan (Fitur #88):
 * - Jika `includeVisual` aktif bersama `includeDurasi` atau `includeContext`:
 *   Kedua elemen tersebut otomatis melebur masuk ke dalam blok `VISUAL:` dalam format 1 kesatuan sesuai locale.
 * - Jika `includeVisual` tidak aktif, elemen `DURASI` dan `SCENE_CONTEXT` yang dicentang akan berdiri sendiri.
 */
export function buildBatchExportText(
  scenes: SceneForExport[],
  filter: BatchExportFilterOptions = DEFAULT_BATCH_EXPORT_FILTER,
  locale: string = "id"
): string {
  const lines: string[] = [BATCH_START, `TOTAL_SCENES:${scenes.length}`];

  scenes.forEach((scene, index) => {
    lines.push(SCENE_DELIMITER);
    lines.push(`SCENE_INDEX:${index + 1}`);
    lines.push(`SCENE_NUMBER:${sanitizeField(scene.sceneNumber)}`);

    if (scene.chapter !== undefined) {
      lines.push(`CHAPTER:${scene.chapter}`);
      if (scene.chapterTitle) lines.push(`CHAPTER_TITLE:${sanitizeField(scene.chapterTitle)}`);
    }

    // Jika visual tidak disertakan, sceneContext berdiri sendiri (jika dipilih)
    if (!filter.includeVisual && filter.includeContext && scene.sceneContext) {
      lines.push(`SCENE_CONTEXT:${sanitizeField(scene.sceneContext)}`);
    }

    // Narasi
    if (filter.includeNarasi) {
      lines.push(`NARASI:${sanitizeField(scene.narasi)}`);
    }

    // Visual Prompt
    if (filter.includeVisual) {
      // Jika durasi atau konteks dipilih, leburkan ke dalam VISUAL:
      if (filter.includeDurasi || filter.includeContext) {
        const unifiedVisual = buildUnifiedVisualPrompt(scene, {
          includeDuration: filter.includeDurasi,
          includeContext: filter.includeContext,
          locale,
        });
        lines.push(`VISUAL:\n${unifiedVisual}`);
      } else {
        lines.push(`VISUAL:${sanitizeField(scene.visual)}`);
      }
    }

    // Teks Overlay
    if (filter.includeOverlay && scene.teksOverlay) {
      lines.push(`OVERLAY:${sanitizeField(scene.teksOverlay)}`);
      if (scene.overlayType) lines.push(`OVERLAY_TYPE:${scene.overlayType}`);
    }

    // Jika visual tidak disertakan, durasi berdiri sendiri (jika dipilih)
    if (!filter.includeVisual && filter.includeDurasi && scene.durasi) {
      lines.push(`DURASI:${sanitizeField(scene.durasi)}`);
    }
  });

  lines.push(BATCH_END);
  return lines.join("\n");
}

