import { describe, expect, it } from "vitest";
import { buildGenerationConfigSnapshot } from "@/lib/generationConfig";

describe("buildGenerationConfigSnapshot", () => {
  const NOW = new Date("2026-10-12T00:00:00.000Z");

  it("null jika prefs bukan objek", () => {
    expect(buildGenerationConfigSnapshot(null, "ch1", NOW)).toBeNull();
    expect(buildGenerationConfigSnapshot("x", "ch1", NOW)).toBeNull();
  });

  it("memakai channelFormStates[channelId] dan hanya field whitelist", () => {
    const prefs = {
      channelFormStates: {
        ch1: {
          outputLanguage: "English",
          cameraMovementEnabled: false,
          secretField: "JANGAN DISALIN",
          videoConfig: { aspectRatio: "9:16", targetSceneCount: 7, apiKey: "rahasia" },
        },
      },
    };
    const snap = buildGenerationConfigSnapshot(prefs, "ch1", NOW);
    expect(snap).not.toBeNull();
    expect(snap?.source).toBe("channelFormStates");
    expect(snap?.capturedAt).toBe("2026-10-12T00:00:00.000Z");
    expect(snap?.cameraMovementEnabled).toBe(false);
    expect(JSON.stringify(snap)).not.toContain("JANGAN DISALIN");
    expect(JSON.stringify(snap)).not.toContain("rahasia");
    expect(JSON.stringify(snap)).toContain("9:16");
  });

  it("fallback ke generatorFormState jika channelId cocok", () => {
    const prefs = { generatorFormState: { channelId: "ch2", outputLanguage: "Indonesia" } };
    expect(buildGenerationConfigSnapshot(prefs, "ch2", NOW)?.source).toBe("generatorFormState");
    expect(buildGenerationConfigSnapshot(prefs, "lain", NOW)).toBeNull();
  });
});
