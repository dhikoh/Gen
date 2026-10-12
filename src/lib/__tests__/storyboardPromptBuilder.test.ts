import { describe, expect, it } from "vitest";
import {
  DEFAULT_STYLE_BIBLE,
  assignFilesToScenes,
  buildPanelPrompt,
  buildStyleBiblePrompt,
  cleanVisualForStill,
  parseCameraSetting,
} from "@/lib/storyboardPromptBuilder";

describe("parseCameraSetting", () => {
  it("memecah 6 bagian", () => {
    const c = parseCameraSetting("ECU | low angle | 50mm | shallow DOF | slow push-in | rule of thirds");
    expect(c?.shotSize).toBe("ECU");
    expect(c?.angle).toBe("low angle");
    expect(c?.lens).toBe("50mm");
    expect(c?.movement).toBe("slow push-in");
    expect(c?.composition).toBe("rule of thirds");
  });
  it("null jika kosong atau tidak berformat", () => {
    expect(parseCameraSetting(undefined)).toBeNull();
    expect(parseCameraSetting("")).toBeNull();
    expect(parseCameraSetting("hanya satu bagian")).toBeNull();
  });
});

describe("cleanVisualForStill", () => {
  it("membuang --ar, SFX/BGM, dan frasa audio", () => {
    const out = cleanVisualForStill(
      "Extreme close-up of a babirusa, slow push-in, accompanied by [SFX: Impact Hit] --ar 9:16"
    );
    expect(out).toBe("Extreme close-up of a babirusa, slow push-in");
  });
  it("membuang 'no sound effects' dan 'no voice over'", () => {
    const out = cleanVisualForStill("Wide shot of a swamp, slow pan left, no sound effects, no voice over --ar 9:16");
    expect(out).not.toMatch(/no sound|no voice|--ar/i);
    expect(out).toContain("slow pan left");
  });
});

describe("buildPanelPrompt", () => {
  const scene = {
    index: 1,
    context: "Close-up of a babirusa.",
    visual: "Extreme close-up of a babirusa, slow push-in --ar 9:16",
    settingKamera: "ECU | low angle | 50mm | shallow DOF | slow push-in | rule of thirds",
  };
  it("memuat nomor panel, rasio, dan setting kamera", () => {
    const p = buildPanelPrompt(scene, 7, { aspectRatio: "9:16", cameraMovementEnabled: true });
    expect(p).toContain("PANEL 1/7");
    expect(p).toContain("vertical 9:16");
    expect(p).toContain("shot size ECU");
    expect(p).toContain("Camera movement: slow push-in");
    expect(p).not.toContain("--ar");
  });
  it("static jika camera movement dimatikan", () => {
    const p = buildPanelPrompt(scene, 7, { aspectRatio: "9:16", cameraMovementEnabled: false });
    expect(p).toContain("Camera movement: static");
    expect(p).not.toContain("slow push-in.");
  });
  it("tetap valid untuk scene lama tanpa setting kamera", () => {
    const p = buildPanelPrompt({ index: 2, visual: "A swamp" }, 7, { aspectRatio: "16:9", cameraMovementEnabled: true });
    expect(p).toContain("choose the framing");
    expect(p).toContain("horizontal 16:9");
  });
});

describe("buildStyleBiblePrompt", () => {
  it("memuat STYLE LOCKED dan karakter dari user", () => {
    const p = buildStyleBiblePrompt({ ...DEFAULT_STYLE_BIBLE, characters: "Adult male babirusa" }, "9:16", "Hewan hutan");
    expect(p).toContain("STYLE LOCKED");
    expect(p).toContain("Adult male babirusa");
    expect(p).toContain("Hewan hutan");
  });
});

describe("assignFilesToScenes", () => {
  it("urut natural dan melebihi jumlah scene → null", () => {
    const r = assignFilesToScenes(["panel10.png", "panel2.png", "panel1.png"], 2);
    expect(r.map((x) => x.name)).toEqual(["panel1.png", "panel2.png", "panel10.png"]);
    expect(r.map((x) => x.sceneNumber)).toEqual([1, 2, null]);
  });
});
