import { describe, it, expect } from "vitest";
import {
  buildOverlayVisualCopyText,
  buildBatchExportText,
  buildUnifiedVisualPrompt,
  type SceneForExport,
} from "@/lib/sceneExportFormat";

const BASE_SCENE: SceneForExport = {
  id: 1,
  sceneNumber: "Scene 1",
  sceneContext: "Seorang astronaut melayang di luar stasiun luar angkasa menatap bumi.",
  narasi: "Narasi pembuka yang menarik",
  visual: "Wide shot gunung berapi --ar 9:16",
  teksOverlay: "TERUNGKAP!",
  durasi: "5 detik",
};

describe("sceneExportFormat", () => {
  // ─── Fitur 2: buildOverlayVisualCopyText ───────────────────────────────────
  describe("buildOverlayVisualCopyText", () => {
    it("includes Indonesian labels by default or when locale is id", () => {
      const result = buildOverlayVisualCopyText(BASE_SCENE, "id");
      expect(result).toContain("[Teks Overlay Layar]");
      expect(result).toContain("TERUNGKAP!");
      expect(result).toContain("[Prompt Visual]");
      expect(result).toContain("Wide shot gunung berapi");
    });

    it("includes English labels when locale is en", () => {
      const result = buildOverlayVisualCopyText(BASE_SCENE, "en");
      expect(result).toContain("[Screen Overlay Text]");
      expect(result).toContain("TERUNGKAP!");
      expect(result).toContain("[Visual Prompt]");
      expect(result).toContain("Wide shot gunung berapi");
    });

    it("skips overlay section when overlay is absent", () => {
      const scene: SceneForExport = { ...BASE_SCENE, teksOverlay: undefined };
      const result = buildOverlayVisualCopyText(scene, "id");
      expect(result).not.toContain("[Teks Overlay Layar]");
      expect(result).toContain("[Prompt Visual]");
    });

    it("skips visual section when visual is —", () => {
      const scene: SceneForExport = { ...BASE_SCENE, visual: "—" };
      const result = buildOverlayVisualCopyText(scene, "en");
      expect(result).not.toContain("[Visual Prompt]");
    });

    it("returns empty string when both overlay and visual are absent/—", () => {
      const scene: SceneForExport = {
        ...BASE_SCENE,
        teksOverlay: undefined,
        visual: "—",
      };
      expect(buildOverlayVisualCopyText(scene)).toBe("");
    });
  });

  // ─── Fitur 88: buildUnifiedVisualPrompt ─────────────────────────────────────
  describe("buildUnifiedVisualPrompt", () => {
    it("formats 1 unified bundle in Indonesian (id) by default", () => {
      const result = buildUnifiedVisualPrompt(BASE_SCENE);
      const expected = [
        "[durasi : 5 detik]",
        "[konteks adegan]",
        "Seorang astronaut melayang di luar stasiun luar angkasa menatap bumi.",
        "[Prompt Visual]",
        "Wide shot gunung berapi --ar 9:16",
      ].join("\n");
      expect(result).toBe(expected);
    });

    it("formats 1 unified bundle in English (en) when locale is en", () => {
      const result = buildUnifiedVisualPrompt(BASE_SCENE, {
        includeDuration: true,
        includeContext: true,
        locale: "en",
      });
      const expected = [
        "[duration : 5s]",
        "[scene context]",
        "Seorang astronaut melayang di luar stasiun luar angkasa menatap bumi.",
        "[Visual Prompt]",
        "Wide shot gunung berapi --ar 9:16",
      ].join("\n");
      expect(result).toBe(expected);
    });

    it("normalizes '5s' to '5 detik' in Indonesian", () => {
      const sceneWithSeconds = { ...BASE_SCENE, durasi: "8s" };
      const result = buildUnifiedVisualPrompt(sceneWithSeconds, { locale: "id" });
      expect(result).toContain("[durasi : 8 detik]");
      expect(result).toContain("[konteks adegan]");
      expect(result).toContain("[Prompt Visual]");
    });

    it("normalizes '8 detik' to '8s' in English", () => {
      const sceneWithDetik = { ...BASE_SCENE, durasi: "8 detik" };
      const result = buildUnifiedVisualPrompt(sceneWithDetik, { locale: "en" });
      expect(result).toContain("[duration : 8s]");
      expect(result).toContain("[scene context]");
      expect(result).toContain("[Visual Prompt]");
    });

    it("omits context gracefully when sceneContext is missing", () => {
      const sceneWithoutContext = { ...BASE_SCENE, sceneContext: undefined };
      const resultId = buildUnifiedVisualPrompt(sceneWithoutContext, { locale: "id" });
      expect(resultId).not.toContain("[konteks adegan]");
      expect(resultId).toContain("[durasi : 5 detik]");
      expect(resultId).toContain("[Prompt Visual]\nWide shot gunung berapi --ar 9:16");

      const resultEn = buildUnifiedVisualPrompt(sceneWithoutContext, { locale: "en" });
      expect(resultEn).not.toContain("[scene context]");
      expect(resultEn).toContain("[duration : 5s]");
      expect(resultEn).toContain("[Visual Prompt]\nWide shot gunung berapi --ar 9:16");
    });

    it("omits durasi when includeDuration option is false", () => {
      const result = buildUnifiedVisualPrompt(BASE_SCENE, {
        includeDuration: false,
        includeContext: true,
        locale: "en",
      });
      expect(result).not.toContain("[duration :");
      expect(result).toContain("[scene context]\nSeorang astronaut melayang di luar stasiun luar angkasa menatap bumi.");
      expect(result).toContain("[Visual Prompt]\nWide shot gunung berapi --ar 9:16");
    });

    it("omits context when includeContext option is false", () => {
      const result = buildUnifiedVisualPrompt(BASE_SCENE, {
        includeDuration: true,
        includeContext: false,
        locale: "id",
      });
      expect(result).toContain("[durasi : 5 detik]");
      expect(result).not.toContain("[konteks adegan]");
      expect(result).toContain("[Prompt Visual]\nWide shot gunung berapi --ar 9:16");
    });

    it("falls back to estimatedDurationSec when raw durasi is empty or —", () => {
      const sceneWithEstimate = {
        ...BASE_SCENE,
        durasi: "—",
        estimatedDurationSec: 6.4,
      };
      const resultId = buildUnifiedVisualPrompt(sceneWithEstimate, { locale: "id" });
      expect(resultId).toContain("[durasi : 6.4 detik]");

      const resultEn = buildUnifiedVisualPrompt(sceneWithEstimate, { locale: "en" });
      expect(resultEn).toContain("[duration : 6.4s]");
    });
  });

  // ─── Fitur 3: buildBatchExportText ─────────────────────────────────────────
  describe("buildBatchExportText", () => {
    it("wraps output with correct delimiters", () => {
      const text = buildBatchExportText([BASE_SCENE]);
      expect(text).toContain("###PROMPTGEN_BATCH_EXPORT###");
      expect(text).toContain("###PROMPTGEN_BATCH_EXPORT_END###");
    });

    it("includes TOTAL_SCENES count", () => {
      const scenes = [BASE_SCENE, { ...BASE_SCENE, id: 2, sceneNumber: "Scene 2" }];
      const text = buildBatchExportText(scenes);
      expect(text).toContain("TOTAL_SCENES:2");
    });

    it("assigns SCENE_INDEX sequentially starting from 1", () => {
      const scenes: SceneForExport[] = [
        { ...BASE_SCENE, id: 1, sceneNumber: "Scene 1" },
        { ...BASE_SCENE, id: 2, sceneNumber: "Scene 2" },
        { ...BASE_SCENE, id: 3, sceneNumber: "Scene 3" },
      ];
      const text = buildBatchExportText(scenes);
      expect(text).toContain("SCENE_INDEX:1");
      expect(text).toContain("SCENE_INDEX:2");
      expect(text).toContain("SCENE_INDEX:3");
      expect(text).not.toContain("SCENE_INDEX:0");
      expect(text).not.toContain("SCENE_INDEX:4");
    });

    it("strips newlines from sanitized single-line field values like NARASI", () => {
      const scene: SceneForExport = {
        ...BASE_SCENE,
        narasi: "Baris pertama\nBaris kedua\r\nBaris ketiga",
        visual: "Line1\nLine2",
      };
      const text = buildBatchExportText([scene]);
      const narasiLine = text
        .split("\n")
        .find((l) => l.startsWith("NARASI:"));
      expect(narasiLine).toMatch(/^NARASI:[^\n]+$/m);
      expect(narasiLine).not.toContain("\n");
    });

    it("includes ---SCENE--- delimiter between scenes", () => {
      const scenes = [BASE_SCENE, { ...BASE_SCENE, id: 2, sceneNumber: "Scene 2" }];
      const text = buildBatchExportText(scenes);
      const count = (text.match(/---SCENE---/g) || []).length;
      expect(count).toBe(2);
    });

    it("skips OVERLAY line when teksOverlay is absent", () => {
      const scene: SceneForExport = { ...BASE_SCENE, teksOverlay: undefined };
      const text = buildBatchExportText([scene]);
      expect(text).not.toContain("OVERLAY:");
    });

    it("handles empty scenes array", () => {
      const text = buildBatchExportText([]);
      expect(text).toContain("TOTAL_SCENES:0");
      expect(text).not.toContain("SCENE_INDEX:");
    });

    it("Rule 2.1 (ID): embeds durasi and scene context inside VISUAL block in Indonesian", () => {
      const text = buildBatchExportText([BASE_SCENE], {
        includeNarasi: true,
        includeVisual: true,
        includeDurasi: true,
        includeContext: true,
        includeOverlay: true,
      }, "id");

      expect(text).toContain("VISUAL:\n[durasi : 5 detik]\n[konteks adegan]\nSeorang astronaut melayang di luar stasiun luar angkasa menatap bumi.\n[Prompt Visual]\nWide shot gunung berapi --ar 9:16");
      expect(text).not.toContain("\nDURASI:5 detik");
      expect(text).not.toContain("\nSCENE_CONTEXT:");
    });

    it("Rule 2.1 (EN): embeds durasi and scene context inside VISUAL block in English", () => {
      const text = buildBatchExportText([BASE_SCENE], {
        includeNarasi: true,
        includeVisual: true,
        includeDurasi: true,
        includeContext: true,
        includeOverlay: true,
      }, "en");

      expect(text).toContain("VISUAL:\n[duration : 5s]\n[scene context]\nSeorang astronaut melayang di luar stasiun luar angkasa menatap bumi.\n[Visual Prompt]\nWide shot gunung berapi --ar 9:16");
      expect(text).not.toContain("\nDURASI:");
      expect(text).not.toContain("\nSCENE_CONTEXT:");
    });

    it("Rule 2.1: emits standalone DURASI and SCENE_CONTEXT when includeVisual is FALSE", () => {
      const text = buildBatchExportText([BASE_SCENE], {
        includeNarasi: true,
        includeVisual: false,
        includeDurasi: true,
        includeContext: true,
        includeOverlay: false,
      });

      expect(text).toContain("DURASI:5 detik");
      expect(text).toContain("SCENE_CONTEXT:Seorang astronaut melayang di luar stasiun luar angkasa menatap bumi.");
      expect(text).not.toContain("VISUAL:");
      expect(text).not.toContain("OVERLAY:");
    });

    it("supports partial filtering with only Narasi selected", () => {
      const text = buildBatchExportText([BASE_SCENE], {
        includeNarasi: true,
        includeVisual: false,
        includeDurasi: false,
        includeContext: false,
        includeOverlay: false,
      });

      expect(text).toContain("NARASI:Narasi pembuka yang menarik");
      expect(text).not.toContain("VISUAL:");
      expect(text).not.toContain("DURASI:");
      expect(text).not.toContain("SCENE_CONTEXT:");
      expect(text).not.toContain("OVERLAY:");
    });

    it("embeds only durasi in VISUAL when context is unchecked (id)", () => {
      const text = buildBatchExportText([BASE_SCENE], {
        includeNarasi: true,
        includeVisual: true,
        includeDurasi: true,
        includeContext: false,
        includeOverlay: true,
      }, "id");

      expect(text).toContain("VISUAL:\n[durasi : 5 detik]\n[Prompt Visual]\nWide shot gunung berapi --ar 9:16");
      expect(text).not.toContain("[konteks adegan]");
    });

    it("embeds only context in VISUAL when durasi is unchecked (en)", () => {
      const text = buildBatchExportText([BASE_SCENE], {
        includeNarasi: true,
        includeVisual: true,
        includeDurasi: false,
        includeContext: true,
        includeOverlay: true,
      }, "en");

      expect(text).toContain("VISUAL:\n[scene context]\nSeorang astronaut melayang di luar stasiun luar angkasa menatap bumi.\n[Visual Prompt]\nWide shot gunung berapi --ar 9:16");
      expect(text).not.toContain("[duration :");
    });

    it("emits single-line VISUAL prompt when neither durasi nor context is checked", () => {
      const text = buildBatchExportText([BASE_SCENE], {
        includeNarasi: true,
        includeVisual: true,
        includeDurasi: false,
        includeContext: false,
        includeOverlay: true,
      });

      expect(text).toContain("VISUAL:Wide shot gunung berapi --ar 9:16");
      expect(text).not.toContain("[durasi :");
      expect(text).not.toContain("[scene context]");
    });
  });
});
