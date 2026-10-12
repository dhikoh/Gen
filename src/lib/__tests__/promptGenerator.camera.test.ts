import { describe, expect, it } from "vitest";
import { generateMasterPrompt } from "@/lib/promptGenerator";

type ChannelArg = Parameters<typeof generateMasterPrompt>[0];
type VideoArg = Parameters<typeof generateMasterPrompt>[3];

const channel = {
  channelName: "Zoonation",
  niche: "Reptil dan hewan unik",
  targetAudience: "umum",
  language: "id",
  contentType: "VIDEO",
  tone: "Formal Documentary",
} as ChannelArg;

function build(cameraMovementEnabled: boolean, outputLanguage: string): string {
  const videoConfig = {
    targetPlatform: "YouTube Shorts",
    targetDurationSec: 50,
    targetSceneCount: 7,
    aspectRatio: "9:16",
    speechRate: 0.4,
    cameraMovementEnabled,
  } as VideoArg;
  const result = generateMasterPrompt(channel, "Hewan hutan", "", videoConfig, null, [], outputLanguage, null);
  return typeof result === "string" ? result : JSON.stringify(result);
}

describe("generateMasterPrompt — baris SETTING KAMERA", () => {
  for (const lang of ["English", "Indonesia"]) {
    it(`kamera aktif (${lang}): label ada di daftar label, SCENE 1, dan SCENE 2`, () => {
      const out = build(true, lang);
      expect((out.match(/SETTING KAMERA:/g) ?? []).length).toBeGreaterThanOrEqual(3);
      expect(out).toContain("slow push-in");
    });

    it(`kamera dimatikan (${lang}): bagian gerakan wajib static`, () => {
      const out = build(false, lang);
      expect(out).toContain("SETTING KAMERA:");
      expect(out).toContain("WAJIB diisi static");
    });
  }
});
