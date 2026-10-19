import { describe, expect, it } from "vitest";
import { exportRemotionZip } from "../remotionZipExporter";
import { DEFAULT_REMOTION_OPTIONS } from "../remotionPromptBuilder";
import type { VideoTimeline, VideoTimelineScene } from "@/types/videoTimeline";
import JSZip from "jszip";

function makeTimelineWithAudio(): VideoTimeline {
  const dummyAudio = "QUJDREVGRw=="; // base64
  const scene: VideoTimelineScene = {
    sceneNumber: 1,
    narration: "Narasi satu",
    durationSec: 5,
    startOffsetSec: 0,
    visualPrompt: "visual",
    sceneContext: "context",
    textOverlay: "TEKS SCENE 1",
    audioRef: dummyAudio,
    chapter: null,
    chapterTitle: null,
  };
  return {
    version: 1,
    totalDurationSec: 5,
    draftId: "draft-zip",
    channelId: null,
    exportedAt: new Date().toISOString(),
    usedTitleIds: [],
    usedTitleTexts: [],
    scenes: [scene],
  };
}

describe("remotionZipExporter", () => {
  it("menghasilkan file ZIP lengkap dengan script render dan audio", async () => {
    const timeline = makeTimelineWithAudio();
    const zipBlob = await exportRemotionZip(timeline, DEFAULT_REMOTION_OPTIONS);

    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(100);

    // Buka kembali ZIP untuk memastikan file-file penting ada di dalamnya
    const zip = await JSZip.loadAsync(zipBlob);
    expect(zip.file("package.json")).not.toBeNull();
    expect(zip.file("tsconfig.json")).not.toBeNull();
    expect(zip.file("src/index.ts")).not.toBeNull();
    expect(zip.file("src/Video.tsx")).not.toBeNull();
    expect(zip.file("render.bat")).not.toBeNull();
    expect(zip.file("render.sh")).not.toBeNull();
    expect(zip.file("README.md")).not.toBeNull();
    const scene1Audio = zip.file("public/audio/scene-1.wav");
    expect(scene1Audio).not.toBeNull();
    const bytes = await scene1Audio!.async("uint8array");
    expect(bytes.length).toBeGreaterThan(0);
    expect(zip.file("public/audio/scene-2.wav")).toBeNull();
  });
});
