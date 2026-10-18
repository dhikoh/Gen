import type { SceneForExport } from "@/lib/sceneExportFormat";
import type { VideoTimeline, VideoTimelineScene } from "@/types/videoTimeline";

/**
 * Bangun VideoTimeline dari array scene hasil parseScenes().
 * Menghitung startOffsetSec secara kumulatif.
 */
export function buildTimeline(
  scenes: SceneForExport[],
  opts: {
    draftId: string;
    channelId: string | null;
    usedTitleIds: string[];
    usedTitleTexts: string[];
    defaultDurationSec?: number;
  }
): VideoTimeline {
  const defaultDur = opts.defaultDurationSec ?? 4;
  let offset = 0;

  const timelineScenes: VideoTimelineScene[] = scenes.map((s, idx) => {
    const rawDur = s.estimatedDurationSec;
    const dur = typeof rawDur === "number" && rawDur > 0 ? rawDur : defaultDur;
    const scene: VideoTimelineScene = {
      sceneNumber: s.id && Number.isFinite(s.id) ? s.id : idx + 1,
      narration: s.narasi || "",
      durationSec: dur,
      startOffsetSec: offset,
      visualPrompt: s.visual || "",
      sceneContext: s.sceneContext || "",
      textOverlay: s.teksOverlay || "",
      audioRef: null,
      chapter: s.chapter ?? null,
      chapterTitle: s.chapterTitle ?? null,
    };
    offset += dur;
    return scene;
  });

  return {
    version: 1,
    totalDurationSec: offset,
    scenes: timelineScenes,
    usedTitleIds: opts.usedTitleIds,
    usedTitleTexts: opts.usedTitleTexts,
    exportedAt: new Date().toISOString(),
    draftId: opts.draftId,
    channelId: opts.channelId,
  };
}

/**
 * Validasi integritas timeline: scene berurutan, offset konsisten.
 */
export function validateTimeline(tl: VideoTimeline): string[] {
  const errors: string[] = [];
  let expectedOffset = 0;
  for (let i = 0; i < tl.scenes.length; i++) {
    const s = tl.scenes[i];
    if (s.sceneNumber !== i + 1) {
      errors.push(`Scene ${i}: sceneNumber ${s.sceneNumber} != expected ${i + 1}`);
    }
    if (Math.abs(s.startOffsetSec - expectedOffset) > 0.01) {
      errors.push(`Scene ${i}: startOffsetSec ${s.startOffsetSec} != expected ${expectedOffset}`);
    }
    if (s.durationSec <= 0) {
      errors.push(`Scene ${i}: durationSec <= 0`);
    }
    expectedOffset += s.durationSec;
  }
  if (Math.abs(tl.totalDurationSec - expectedOffset) > 0.01) {
    errors.push(`totalDurationSec ${tl.totalDurationSec} != sum ${expectedOffset}`);
  }
  return errors;
}
