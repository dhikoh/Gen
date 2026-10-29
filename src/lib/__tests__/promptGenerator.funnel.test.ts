import { describe, it, expect } from "vitest";
import { generateMasterPrompt, ProfileChannelData, VideoConfigData } from "@/lib/promptGenerator";

describe("generateMasterPrompt — Funnel Pack Timing & Word Budget Isolation", () => {
  const dummyChannel: ProfileChannelData = {
    channelName: "Zoo Nation",
    niche: "Hewan & Alam",
    description: "Channel edukasi hewan",
    personaPov: "Orang Pertama (Saya)",
    visualAesthetic: "National Geographic 4K",
    cta1: "Subscribe",
    cta2: "Tonton video lengkap",
    audioBGM: true,
    audioSFX: true,
    audioAmbient: true,
    audioVO: true,
    products: [],
    socialLinks: null,
    contentArchetypeId: null,
    contentArchetype: null,
    speechRate: 0.35,
    targetPlatform: "YouTube",
  };

  it("does not leak single-video 300s/9 scene template into Funnel Pack prompt", () => {
    const videoConfig: VideoConfigData = {
      targetDurationSec: 300,
      targetSceneCount: 9,
      speechRate: 0.35,
      outputStructure: "FUNNEL_BUNDLE",
      funnelConfig: {
        sceneMode: "manual",
        short1Scenes: 10,
        short1DurationSec: 70,
        short2Scenes: 10,
        short2DurationSec: 70,
        longScenes: 30,
        longDurationMinutes: 4,
      },
    };

    const result = generateMasterPrompt(
      dummyChannel,
      "Mythos or Fact",
      "",
      videoConfig,
      null,
      [],
      "id",
      null
    );

    // 1. Must NOT contain the contradictory single video 300 seconds / 9 scenes
    expect(result.masterPrompt).not.toContain("Target Total Durasi Video: 300 detik (terdiri dari 9 scene)");
    expect(result.masterPrompt).not.toContain("Target Total Video Duration: 300 seconds (9 scenes)");

    // 2. Must contain segmented Funnel Pack tempo block
    expect(result.masterPrompt).toContain("[PANDUAN TEMPO, KUOTA KATA & KECEPATAN BICARA (PAKET 3-IN-1 FUNNEL PACK)]");
    expect(result.masterPrompt).toContain("[SEGMENT: SHORT 1]: Target ~70 detik (~10 scene)");
    expect(result.masterPrompt).toContain("[SEGMENT: SHORT 2]: Target ~70 detik (~10 scene)");
    expect(result.masterPrompt).toContain("[SEGMENT: LONG PILLAR]: Target ~4 menit / 240 detik (~30 scene)");

    // 3. Spoken word calculation check:
    // 70s / 0.35 = 200 words (~20 words/scene)
    // 240s / 0.35 = 686 words (~23 words/scene)
    // Total = 200 + 200 + 686 = 1086 words
    expect(result.masterPrompt).toContain("Total narasi: ~200 kata (rata-rata ~20 kata/scene");
    expect(result.masterPrompt).toContain("Total narasi: ~686 kata (rata-rata ~23 kata/scene");
    expect(result.masterPrompt).toContain("TOTAL KUOTA KATA 3 NASKAH GABUNGAN: ~1086 kata");
  });

  it("renders English Funnel Pack timing correctly when outputLanguage is en", () => {
    const videoConfig: VideoConfigData = {
      targetDurationSec: 60,
      targetSceneCount: 8,
      speechRate: 0.35,
      outputStructure: "FUNNEL_BUNDLE",
      funnelConfig: {
        sceneMode: "manual",
        short1Scenes: 5,
        short1DurationSec: 45,
        short2Scenes: 5,
        short2DurationSec: 45,
        longScenes: 20,
        longDurationMinutes: 5,
      },
    };

    const result = generateMasterPrompt(
      dummyChannel,
      "Animal Kingdom",
      "",
      videoConfig,
      null,
      [],
      "en",
      null
    );

    expect(result.masterPrompt).toContain("[TEMPO, WORD COUNT BUDGET & SPEECH RATE GUIDELINES (3-IN-1 FUNNEL PACK)]");
    expect(result.masterPrompt).toContain("[SEGMENT: SHORT 1]: Target ~45s (~5 scenes)");
    expect(result.masterPrompt).toContain("[SEGMENT: SHORT 2]: Target ~45s (~5 scenes)");
    expect(result.masterPrompt).toContain("[SEGMENT: LONG PILLAR]: Target ~5 minutes / 300s (~20 scenes)");
  });

  it("applies 7s sweet-spot (9 scenes for 60s) and Scene Economy heuristics in Auto mode", () => {
    const videoConfig: VideoConfigData = {
      targetDurationSec: 60,
      targetSceneCount: null, // Auto mode
      speechRate: 0.35,
    };

    const result = generateMasterPrompt(
      dummyChannel,
      "Fakta Hewan",
      "",
      videoConfig,
      null,
      [],
      "id",
      null
    );

    // Auto mode for 60s should recommend ~9 scenes (not 12 scenes like old 5s sweet-spot)
    expect(result.masterPrompt).toContain("Panduan Estimasi: ~9 scene (rentang wajar: 5–15 scene)");
    expect(result.masterPrompt).toContain("Standar Pacing Natural: Setiap scene SEBAIKNYA berdurasi 6–8 detik");
    expect(result.masterPrompt).toContain("PRINSIP EFISIENSI & KEBUTUHAN SCENE (SCENE ECONOMY):");
    expect(result.masterPrompt).toContain("DILARANG memotong ke scene baru hanya karena ada pergantian kalimat narasi");
    expect(result.masterPrompt).toContain("Targetkan secara efektif ~9 scene (fleksibel dalam rentang 5–15 sesuai kebutuhan konten dengan pacing 6–8 detik/scene)");
  });
});
