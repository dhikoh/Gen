import { describe, it, expect } from "vitest";
import { buildFullVideoAiPrompt } from "@/lib/fullVideoPromptBuilder";
import type { VideoTimeline } from "@/types/videoTimeline";

describe("buildFullVideoAiPrompt", () => {
  const mockTimeline: VideoTimeline = {
    version: 1,
    totalDurationSec: 15,
    exportedAt: new Date().toISOString(),
    draftId: "draft-123",
    channelId: "channel-abc",
    usedTitleIds: [],
    usedTitleTexts: ["Topik Lama 1", "Topik Lama 2"],
    scenes: [
      {
        sceneNumber: 1,
        narration: "Banyak orang tidak menyadari rahasia besar ini.",
        durationSec: 5,
        startOffsetSec: 0,
        visualPrompt: "Close-up cinematic shot of mysterious locked glowing antique chest",
        sceneContext: "Opening Hook",
        textOverlay: "RAHASIA BESAR",
        audioRef: null,
        chapter: 1,
        chapterTitle: "Pembukaan Misterius",
      },
      {
        sceneNumber: 2,
        narration: "Ketika kuncinya dibuka, energi emas mulai terpancar ke seluruh ruangan.",
        durationSec: 5,
        startOffsetSec: 5,
        visualPrompt: "Medium shot golden rays bursting through cracks of the chest",
        sceneContext: "Reveal Point",
        textOverlay: "KEKUATAN EMAS",
        audioRef: null,
        chapter: 1,
        chapterTitle: "Pembukaan Misterius",
      },
      {
        sceneNumber: 3,
        narration: "Sekarang giliran Anda untuk membuktikannya sendiri.",
        durationSec: 5,
        startOffsetSec: 10,
        visualPrompt: "Slow pull-out reveal of character standing triumphantly in illuminated room",
        sceneContext: "Call to Action",
        textOverlay: "COBA SEKARANG",
        audioRef: null,
        chapter: 2,
        chapterTitle: "Penutup",
      },
    ],
  };

  it("returns empty string if timeline has no scenes", () => {
    const emptyTimeline: VideoTimeline = { ...mockTimeline, scenes: [] };
    expect(buildFullVideoAiPrompt(emptyTimeline)).toBe("");
  });

  it("builds cinematic multi-scene prompt with correct timecodes and continuity", () => {
    const result = buildFullVideoAiPrompt(mockTimeline, {
      format: "cinematic",
      aspectRatio: "16:9",
      includeTimestamps: true,
      includeNarration: true,
      includeOverlay: true,
    });

    expect(result).toContain("# MASTER CINEMATIC VIDEO GENERATION PROMPT");
    expect(result).toContain("Aspect Ratio: 16:9");
    expect(result).toContain("Total Duration: 15s (0:15)");
    expect(result).toContain("### SEQUENCE 1 [00:00 - 00:05] (Duration: 5s)");
    expect(result).toContain("Visual Action: Close-up cinematic shot of mysterious locked glowing antique chest");
    expect(result).toContain('On-Screen Typography: "RAHASIA BESAR"');
    expect(result).toContain('Voiceover / Audio Beat: "Banyak orang tidak menyadari rahasia besar ini."');
    expect(result).toContain("### SEQUENCE 2 [00:05 - 00:10] (Duration: 5s)");
    expect(result).toContain("### SEQUENCE 3 [00:10 - 00:15] (Duration: 5s)");
    expect(result).toContain("DO NOT include or repeat the following already used channel topics:");
    expect(result).toContain("- Topik Lama 1");
  });

  it("builds script-to-video specification format for InVideo / CapCut", () => {
    const result = buildFullVideoAiPrompt(mockTimeline, {
      format: "script_to_video",
      aspectRatio: "9:16",
      additionalInstructions: "Gunakan tone warna hangat dan subtitle kuning.",
    });

    expect(result).toContain("# SCRIPT-TO-VIDEO PRODUCTION SPECIFICATION");
    expect(result).toContain("Target Aspect Ratio: 9:16");
    expect(result).toContain("Target Video Duration: ~15 seconds (0:15)");
    expect(result).toContain("## CUSTOM INSTRUCTIONS");
    expect(result).toContain("Gunakan tone warna hangat dan subtitle kuning.");
    expect(result).toContain("[SCENE 1 (00:00 - 00:05) - 5s]");
    expect(result).toContain("Voiceover (Narasi): Banyak orang tidak menyadari rahasia besar ini.");
    expect(result).toContain("Visual (Footage/B-Roll): Close-up cinematic shot of mysterious locked glowing antique chest");
    expect(result).toContain('Text on Screen (Overlay): "RAHASIA BESAR"');
  });

  it("builds continuous storyline format", () => {
    const result = buildFullVideoAiPrompt(mockTimeline, {
      format: "story",
      aspectRatio: "16:9",
    });

    expect(result).toContain("# CONTINUOUS STORYLINE PROMPT (16:9, 15s)");
    expect(result).toContain('Scene 1 [at 00:00]: Close-up cinematic shot of mysterious locked glowing antique chest with dialogue/voiceover: "Banyak orang tidak menyadari rahasia besar ini." (On-screen text: "RAHASIA BESAR").');
  });

  it("honors toggles to exclude narration and overlays", () => {
    const result = buildFullVideoAiPrompt(mockTimeline, {
      format: "cinematic",
      includeNarration: false,
      includeOverlay: false,
      includeTimestamps: false,
    });

    expect(result).not.toContain("Voiceover / Audio Beat:");
    expect(result).not.toContain("On-Screen Typography:");
    expect(result).not.toContain("[00:00 - 00:05]");
    expect(result).toContain("### SEQUENCE 1 (Duration: 5s)");
  });
});
