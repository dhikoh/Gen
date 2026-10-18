import { describe, it, expect } from "vitest";
import { buildAnimationPrompt } from "@/lib/animationPromptBuilder";
import type { VideoTimeline } from "@/types/videoTimeline";
import { CANVAS_ID } from "@/lib/animationContract";

describe("animationPromptBuilder", () => {
  const dummyTimeline: VideoTimeline = {
    version: 1,
    totalDurationSec: 15,
    draftId: "draft-xyz",
    channelId: "channel-123",
    exportedAt: "2026-10-18T20:00:00Z",
    usedTitleIds: ["ut-1", "ut-2"],
    usedTitleTexts: ["Judul A Terpakai", "Judul B Terpakai"],
    scenes: [
      {
        sceneNumber: 1,
        durationSec: 5,
        startOffsetSec: 0,
        narration: "Narasi satu",
        visualPrompt: "Close-up animasi kubus berputar",
        sceneContext: "Konteks adegan 1",
        textOverlay: "KUBUS 3D",
        audioRef: null,
        chapter: 1,
        chapterTitle: "Bab Satu",
      },
      {
        sceneNumber: 2,
        durationSec: 10,
        startOffsetSec: 5,
        narration: "Narasi dua",
        visualPrompt: "Transisi ke grafik batang interaktif",
        sceneContext: "Konteks adegan 2",
        textOverlay: "DATA STATISTIK",
        audioRef: null,
        chapter: 2,
        chapterTitle: "Bab Dua",
      },
    ],
  };

  it("builds prompt containing mandatory technical contract", () => {
    const prompt = buildAnimationPrompt(dummyTimeline);

    expect(prompt).toContain(CANVAS_ID);
    expect(prompt).toContain("window.__anim");
    expect(prompt).toContain("seek(timeSec)");
    expect(prompt).toContain("getDuration()");
    expect(prompt).toContain("getReadyPromise()");
    expect(prompt).toContain("1920x1080");
    expect(prompt).toContain("Total Durasi: 15 detik");
    expect(prompt).toContain("Jumlah Scene: 2");
  });

  it("includes detailed scene timeline", () => {
    const prompt = buildAnimationPrompt(dummyTimeline);

    expect(prompt).toContain("### SCENE 1");
    expect(prompt).toContain("Mulai: 0s | Durasi: 5s");
    expect(prompt).toContain("Close-up animasi kubus berputar");
    expect(prompt).toContain("Text Overlay: \"KUBUS 3D\"");
    expect(prompt).toContain("Bab: Bab Satu");

    expect(prompt).toContain("### SCENE 2");
    expect(prompt).toContain("Mulai: 5s | Durasi: 10s");
    expect(prompt).toContain("Transisi ke grafik batang interaktif");
    expect(prompt).toContain("Text Overlay: \"DATA STATISTIK\"");
    expect(prompt).toContain("Bab: Bab Dua");
  });

  it("includes used titles blacklist when present", () => {
    const prompt = buildAnimationPrompt(dummyTimeline);

    expect(prompt).toContain("JUDUL & TOPIK YANG SUDAH TERPAKAI (DILARANG DIBAHAS ULANG)");
    expect(prompt).toContain("- \"Judul A Terpakai\"");
    expect(prompt).toContain("- \"Judul B Terpakai\"");
  });

  it("omits used titles blacklist section if empty", () => {
    const timelineWithoutTitles: VideoTimeline = {
      ...dummyTimeline,
      usedTitleIds: [],
      usedTitleTexts: [],
    };
    const prompt = buildAnimationPrompt(timelineWithoutTitles);

    expect(prompt).not.toContain("JUDUL & TOPIK YANG SUDAH TERPAKAI");
  });

  it("includes additional creator instructions if provided", () => {
    const prompt = buildAnimationPrompt(dummyTimeline, {
      additionalInstructions: "Gunakan tema warna neon cyberpunk dan partikel bercahaya.",
    });

    expect(prompt).toContain("## INSTRUKSI TAMBAHAN DARI KREATOR");
    expect(prompt).toContain("Gunakan tema warna neon cyberpunk dan partikel bercahaya.");
  });

  it("respects custom dimensions and FPS options", () => {
    const prompt = buildAnimationPrompt(dummyTimeline, {
      width: 1080,
      height: 1920,
      fps: 60,
    });

    expect(prompt).toContain("Canvas: 1080x1920 px, 60 FPS");
    expect(prompt).toContain('<canvas id="anim-canvas" width="1080" height="1920">');
  });
});
