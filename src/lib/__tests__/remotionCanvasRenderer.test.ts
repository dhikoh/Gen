import { describe, expect, it, vi } from "vitest";
import { getSceneAtFrame, renderRemotionFrame } from "../remotionCanvasRenderer";
import {
  computeRemotionPlan,
  DEFAULT_REMOTION_OPTIONS,
} from "../remotionPromptBuilder";
import type { VideoTimeline, VideoTimelineScene } from "@/types/videoTimeline";

function makeTimeline(scenes: { durationSec: number; textOverlay: string }[]): VideoTimeline {
  let offset = 0;
  return {
    version: 1,
    totalDurationSec: scenes.reduce((a, b) => a + b.durationSec, 0),
    usedTitleIds: [],
    usedTitleTexts: [],
    exportedAt: new Date().toISOString(),
    draftId: "draft-test",
    channelId: null,
    scenes: scenes.map((s, idx) => {
      const scene: VideoTimelineScene = {
        sceneNumber: idx + 1,
        narration: s.textOverlay,
        durationSec: s.durationSec,
        startOffsetSec: offset,
        visualPrompt: "visual",
        sceneContext: "context",
        textOverlay: s.textOverlay,
        audioRef: null,
        chapter: null,
        chapterTitle: null,
      };
      offset += s.durationSec;
      return scene;
    }),
  };
}

describe("remotionCanvasRenderer", () => {
  const timeline = makeTimeline([
    { durationSec: 2, textOverlay: "Scene 1 Text" },
    { durationSec: 3, textOverlay: "Scene 2 Text" },
  ]);
  const plan = computeRemotionPlan(timeline, 30); // scene 1: 0-60, scene 2: 60-150

  it("getSceneAtFrame mengidentifikasi scene dan frame lokal dengan benar", () => {
    // Frame 0 -> Scene 1, localFrame 0
    const s0 = getSceneAtFrame(plan, 0);
    expect(s0?.scene.index).toBe(1);
    expect(s0?.localFrame).toBe(0);

    // Frame 59 -> Scene 1, localFrame 59
    const s59 = getSceneAtFrame(plan, 59);
    expect(s59?.scene.index).toBe(1);
    expect(s59?.localFrame).toBe(59);

    // Frame 60 -> Scene 2, localFrame 0
    const s60 = getSceneAtFrame(plan, 60);
    expect(s60?.scene.index).toBe(2);
    expect(s60?.localFrame).toBe(0);

    // Frame 149 -> Scene 2, localFrame 89
    const s149 = getSceneAtFrame(plan, 149);
    expect(s149?.scene.index).toBe(2);
    expect(s149?.localFrame).toBe(89);
  });

  it("renderRemotionFrame menggambar ke canvas tanpa error", () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      globalAlpha: 1,
      fillStyle: "",
      font: "",
      textAlign: "",
      textBaseline: "",
    } as unknown as CanvasRenderingContext2D;

    expect(() => {
      renderRemotionFrame(mockCtx, plan, DEFAULT_REMOTION_OPTIONS, 15);
    }).not.toThrow();

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });
});
