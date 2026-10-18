import { describe, it, expect } from "vitest";
import { buildTimeline, validateTimeline } from "@/lib/timelineBuilder";
import type { SceneForExport } from "@/lib/sceneExportFormat";

describe("timelineBuilder", () => {
  const dummyScenes: SceneForExport[] = [
    {
      id: 1,
      sceneNumber: "Scene 1",
      durasi: "4s",
      narasi: "Narasi satu",
      visual: "Visual prompt satu",
      sceneContext: "Konteks satu",
      teksOverlay: "Overlay satu",
      estimatedDurationSec: 4,
      chapter: 1,
      chapterTitle: "Pendahuluan",
    },
    {
      id: 2,
      sceneNumber: "Scene 2",
      durasi: "6s",
      narasi: "Narasi dua",
      visual: "Visual prompt dua",
      sceneContext: "Konteks dua",
      teksOverlay: "Overlay dua",
      estimatedDurationSec: 6,
      chapter: 1,
      chapterTitle: "Pendahuluan",
    },
    {
      id: 3,
      sceneNumber: "Scene 3",
      durasi: "5s",
      narasi: "Narasi tiga",
      visual: "Visual prompt tiga",
      sceneContext: "Konteks tiga",
      teksOverlay: "Overlay tiga",
      estimatedDurationSec: 5,
      chapter: 2,
      chapterTitle: "Penyelesaian",
    },
  ];

  it("builds a timeline with correct cumulative offsets and total duration", () => {
    const tl = buildTimeline(dummyScenes, {
      draftId: "draft-123",
      channelId: "channel-abc",
      usedTitleIds: ["ut-1"],
      usedTitleTexts: ["Judul Terpakai 1"],
    });

    expect(tl.version).toBe(1);
    expect(tl.draftId).toBe("draft-123");
    expect(tl.channelId).toBe("channel-abc");
    expect(tl.scenes).toHaveLength(3);

    expect(tl.scenes[0].startOffsetSec).toBe(0);
    expect(tl.scenes[0].durationSec).toBe(4);
    expect(tl.scenes[1].startOffsetSec).toBe(4);
    expect(tl.scenes[1].durationSec).toBe(6);
    expect(tl.scenes[2].startOffsetSec).toBe(10);
    expect(tl.scenes[2].durationSec).toBe(5);

    expect(tl.totalDurationSec).toBe(15);
  });

  it("falls back to defaultDurationSec when estimatedDurationSec is missing or non-positive", () => {
    const scenesWithoutDuration: SceneForExport[] = [
      { id: 1, sceneNumber: "Scene 1", durasi: "", narasi: "A", visual: "V1" },
      { id: 2, sceneNumber: "Scene 2", durasi: "", narasi: "B", visual: "V2", estimatedDurationSec: 0 },
    ];

    const tl = buildTimeline(scenesWithoutDuration, {
      draftId: "draft-fallback",
      channelId: null,
      usedTitleIds: [],
      usedTitleTexts: [],
      defaultDurationSec: 5,
    });

    expect(tl.scenes[0].durationSec).toBe(5);
    expect(tl.scenes[0].startOffsetSec).toBe(0);
    expect(tl.scenes[1].durationSec).toBe(5);
    expect(tl.scenes[1].startOffsetSec).toBe(5);
    expect(tl.totalDurationSec).toBe(10);
  });

  it("correctly propagates usedTitleIds and usedTitleTexts", () => {
    const tl = buildTimeline(dummyScenes, {
      draftId: "draft-titles",
      channelId: "ch-1",
      usedTitleIds: ["id-1", "id-2"],
      usedTitleTexts: ["Cara Membuat A", "Review Produk B"],
    });

    expect(tl.usedTitleIds).toEqual(["id-1", "id-2"]);
    expect(tl.usedTitleTexts).toEqual(["Cara Membuat A", "Review Produk B"]);
  });

  it("handles empty scenes array gracefully", () => {
    const tl = buildTimeline([], {
      draftId: "empty-draft",
      channelId: null,
      usedTitleIds: [],
      usedTitleTexts: [],
    });

    expect(tl.scenes).toHaveLength(0);
    expect(tl.totalDurationSec).toBe(0);
    const errors = validateTimeline(tl);
    expect(errors).toHaveLength(0);
  });

  it("preserves chapter and chapterTitle metadata", () => {
    const tl = buildTimeline(dummyScenes, {
      draftId: "draft-chapters",
      channelId: null,
      usedTitleIds: [],
      usedTitleTexts: [],
    });

    expect(tl.scenes[0].chapter).toBe(1);
    expect(tl.scenes[0].chapterTitle).toBe("Pendahuluan");
    expect(tl.scenes[2].chapter).toBe(2);
    expect(tl.scenes[2].chapterTitle).toBe("Penyelesaian");
  });

  it("handles max/large scene counts with strictly monotonic startOffsetSec", () => {
    const manyScenes: SceneForExport[] = Array.from({ length: 60 }, (_, i) => ({
      id: i + 1,
      sceneNumber: `Scene ${i + 1}`,
      durasi: "3s",
      narasi: `Narasi scene ${i + 1}`,
      visual: `Visual scene ${i + 1}`,
      estimatedDurationSec: 3,
    }));

    const tl = buildTimeline(manyScenes, {
      draftId: "draft-many",
      channelId: "ch-many",
      usedTitleIds: [],
      usedTitleTexts: [],
    });

    expect(tl.scenes).toHaveLength(60);
    expect(tl.totalDurationSec).toBe(180);

    for (let i = 0; i < tl.scenes.length; i++) {
      expect(tl.scenes[i].sceneNumber).toBe(i + 1);
      expect(tl.scenes[i].startOffsetSec).toBe(i * 3);
      expect(tl.scenes[i].durationSec).toBe(3);
    }

    const errors = validateTimeline(tl);
    expect(errors).toHaveLength(0);
  });

  it("validateTimeline passes valid timeline with zero errors", () => {
    const tl = buildTimeline(dummyScenes, {
      draftId: "draft-valid",
      channelId: null,
      usedTitleIds: [],
      usedTitleTexts: [],
    });

    const errors = validateTimeline(tl);
    expect(errors).toEqual([]);
  });

  it("validateTimeline detects out-of-order scene numbers", () => {
    const tl = buildTimeline(dummyScenes, {
      draftId: "draft-invalid-order",
      channelId: null,
      usedTitleIds: [],
      usedTitleTexts: [],
    });

    // Pertukarkan nomor scene
    tl.scenes[0].sceneNumber = 2;
    tl.scenes[1].sceneNumber = 1;

    const errors = validateTimeline(tl);
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(errors.some((e) => e.includes("sceneNumber"))).toBe(true);
  });

  it("validateTimeline detects startOffsetSec discrepancy", () => {
    const tl = buildTimeline(dummyScenes, {
      draftId: "draft-offset-err",
      channelId: null,
      usedTitleIds: [],
      usedTitleTexts: [],
    });

    tl.scenes[1].startOffsetSec = 999;

    const errors = validateTimeline(tl);
    expect(errors.some((e) => e.includes("startOffsetSec"))).toBe(true);
  });

  it("validateTimeline detects non-positive durationSec", () => {
    const tl = buildTimeline(dummyScenes, {
      draftId: "draft-zero-dur",
      channelId: null,
      usedTitleIds: [],
      usedTitleTexts: [],
    });

    tl.scenes[1].durationSec = 0;

    const errors = validateTimeline(tl);
    expect(errors.some((e) => e.includes("durationSec <= 0"))).toBe(true);
  });

  it("validateTimeline detects totalDurationSec mismatch", () => {
    const tl = buildTimeline(dummyScenes, {
      draftId: "draft-mismatch-dur",
      channelId: null,
      usedTitleIds: [],
      usedTitleTexts: [],
    });

    tl.totalDurationSec = 9999;

    const errors = validateTimeline(tl);
    expect(errors.some((e) => e.includes("totalDurationSec"))).toBe(true);
  });
});
