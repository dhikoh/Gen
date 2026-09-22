import { describe, it, expect } from "vitest";
import {
  buildOverlayVisualCopyText,
  buildBatchExportText,
  type SceneForExport,
} from "@/lib/sceneExportFormat";

const BASE_SCENE: SceneForExport = {
  id: 1,
  sceneNumber: "Scene 1",
  narasi: "Narasi pembuka yang menarik",
  visual: "Wide shot gunung berapi --ar 9:16",
  teksOverlay: "TERUNGKAP!",
  durasi: "5 detik",
};

describe("sceneExportFormat", () => {
  // ─── Fitur 2 ───────────────────────────────────────────────────────────────
  describe("buildOverlayVisualCopyText", () => {
    it("includes [Teks Overlay Layar] label when overlay exists", () => {
      const result = buildOverlayVisualCopyText(BASE_SCENE);
      expect(result).toContain("[Teks Overlay Layar]");
      expect(result).toContain("TERUNGKAP!");
    });

    it("includes [Visual Prompt] label when visual exists", () => {
      const result = buildOverlayVisualCopyText(BASE_SCENE);
      expect(result).toContain("[Visual Prompt]");
      expect(result).toContain("Wide shot gunung berapi");
    });

    it("skips [Teks Overlay Layar] section when overlay is absent", () => {
      const scene: SceneForExport = { ...BASE_SCENE, teksOverlay: undefined };
      const result = buildOverlayVisualCopyText(scene);
      expect(result).not.toContain("[Teks Overlay Layar]");
      expect(result).toContain("[Visual Prompt]");
    });

    it("skips [Visual Prompt] section when visual is —", () => {
      const scene: SceneForExport = { ...BASE_SCENE, visual: "—" };
      const result = buildOverlayVisualCopyText(scene);
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

  // ─── Fitur 3 ───────────────────────────────────────────────────────────────
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
      // SCENE_INDEX harus sekuensial, tidak melompat
      expect(text).not.toContain("SCENE_INDEX:0");
      expect(text).not.toContain("SCENE_INDEX:4");
    });

    it("strips newlines from field values", () => {
      const scene: SceneForExport = {
        ...BASE_SCENE,
        narasi: "Baris pertama\nBaris kedua\r\nBaris ketiga",
        visual: "Line1\nLine2",
      };
      const text = buildBatchExportText([scene]);
      // Setelah sanitasi, tidak boleh ada newline di tengah nilai
      const narasiLine = text
        .split("\n")
        .find((l) => l.startsWith("NARASI:"));
      expect(narasiLine).toMatch(/^NARASI:[^\n]+$/m);
      expect(narasiLine).not.toContain("\n");
    });

    it("includes ---SCENE--- delimiter between scenes", () => {
      const scenes = [BASE_SCENE, { ...BASE_SCENE, id: 2, sceneNumber: "Scene 2" }];
      const text = buildBatchExportText(scenes);
      // 2 scene = 2 delimiter
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
  });
});
