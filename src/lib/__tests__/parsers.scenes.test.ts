import { describe, expect, it } from "vitest";
import { parseScenes } from "@/lib/parsers";

const SAMPLE = `JUDUL TERPILIH: This Pig's Tusks Grow Straight Through Its Own Face - Babirusa

CAPTION: Tusks that grow straight through its face, and yes, it's a pig!
HASHTAGS: #babirusa #wildlifefacts

## SCENE 1
SCENE CONTEXT: Close-up of a male babirusa with tusks piercing its snout.
NARASI: [fast, intense] This babirusa's tusks grow straight through its own face. [SFX: Impact Hit] [beat] Yes, that's a pig.
TARGET EMOSI (VET): Shock
TEKNIK EDITING & PACING: Jump Cut (0s dead-air)
TEKS OVERLAY: [KEY POINT] Tusks through the face?!
PANDUAN SUARA: Sample Context: Hushed jungle; Director's Note: urgent whisper
VISUAL PROMPT: Extreme close-up of a male babirusa, slow push-in, cinematic lighting, accompanied by [SFX: Impact Hit] --ar 9:16
DURASI: 5 detik

## SCENE 2
SCENE CONTEXT: Wide shot of the babirusa wading through a Sulawesi swamp.
NARASI: Found only in Indonesia, this forest oddity looks like a prehistoric creature.
TARGET EMOSI (VET): Curiosity
TEKNIK EDITING & PACING: B-Roll Cutaway Overlay
TEKS OVERLAY: —
PANDUAN SUARA: —
VISUAL PROMPT: Wide establishing shot of a babirusa in a misty swamp, slow pan left, no sound effects --ar 9:16
DURASI: 7 detik
`;

describe("parseScenes (baseline perilaku saat ini)", () => {
  it("menemukan 2 scene", () => {
    const scenes = parseScenes(SAMPLE);
    expect(scenes).toHaveLength(2);
  });

  it("mengisi field utama scene 1", () => {
    const [s1] = parseScenes(SAMPLE);
    expect(s1.sceneContext).toContain("Close-up of a male babirusa");
    expect(s1.narasi).toContain("tusks grow straight through its own face");
    expect(s1.targetEmosi).toBe("Shock");
    expect(s1.teknikPacing).toContain("Jump Cut");
    expect(s1.visual).toContain("slow push-in");
    expect(s1.durasi).toBe("5s");
  });

  it("mengisi scene 2 dan durasi 7s", () => {
    const scenes = parseScenes(SAMPLE);
    expect(scenes[1].visual).toContain("slow pan left");
    expect(scenes[1].durasi).toBe("7s");
  });

  it("scene tanpa baris SETTING KAMERA tidak punya settingKamera (kompatibel dengan data lama)", () => {
    const scenes = parseScenes(SAMPLE);
    expect((scenes[0] as { settingKamera?: string }).settingKamera).toBeUndefined();
  });
});
