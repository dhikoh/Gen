/**
 * Format helper untuk Scene Prompt Studio.
 *
 * Fitur 2: buildOverlayVisualCopyText — copy gabungan Overlay + Visual per scene
 * Fitur 3: buildBatchExportText — ekspor batch dengan delimiter untuk parse-engine eksternal
 */

export interface SceneForExport {
  id: number;
  sceneNumber: string;
  narasi: string;
  visual: string;
  teksOverlay?: string;
  durasi?: string;
}

// ─── Fitur 2: Overlay + Visual per scene ──────────────────────────────────────

/**
 * Gabungkan teks overlay dan visual prompt menjadi satu teks terformat.
 * Dipakai tombol "Copy Overlay + Visual" per scene.
 */
export function buildOverlayVisualCopyText(scene: SceneForExport): string {
  const parts: string[] = [];

  if (scene.teksOverlay) {
    parts.push(`[Teks Overlay Layar]\n${scene.teksOverlay}`);
  }

  const visual = scene.visual && scene.visual !== "—" ? scene.visual.trim() : "";
  if (visual) {
    parts.push(`[Visual Prompt]\n${visual}`);
  }

  return parts.join("\n\n");
}

// ─── Fitur 3: Batch Export ────────────────────────────────────────────────────

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
 * Bangun teks batch export dari array scene yang dipilih.
 * Format parser-friendly dengan delimiter yang konsisten.
 *
 * Format output:
 * ###PROMPTGEN_BATCH_EXPORT###
 * TOTAL_SCENES:N
 * ---SCENE---
 * SCENE_INDEX:1
 * SCENE_NUMBER:Scene 1
 * NARASI:teks narasi...
 * VISUAL:prompt visual...
 * OVERLAY:teks overlay (opsional)
 * DURASI:5 detik (opsional)
 * ---SCENE---
 * SCENE_INDEX:2
 * ...
 * ###PROMPTGEN_BATCH_EXPORT_END###
 */
export function buildBatchExportText(scenes: SceneForExport[]): string {
  const lines: string[] = [BATCH_START, `TOTAL_SCENES:${scenes.length}`];

  scenes.forEach((scene, index) => {
    lines.push(SCENE_DELIMITER);
    lines.push(`SCENE_INDEX:${index + 1}`);
    lines.push(`SCENE_NUMBER:${sanitizeField(scene.sceneNumber)}`);
    lines.push(`NARASI:${sanitizeField(scene.narasi)}`);
    lines.push(`VISUAL:${sanitizeField(scene.visual)}`);
    if (scene.teksOverlay) {
      lines.push(`OVERLAY:${sanitizeField(scene.teksOverlay)}`);
    }
    if (scene.durasi) {
      lines.push(`DURASI:${sanitizeField(scene.durasi)}`);
    }
  });

  lines.push(BATCH_END);
  return lines.join("\n");
}
