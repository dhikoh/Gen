import { describe, expect, it } from "vitest";
import {
  extractStoryboardScenes,
  readAspectRatio,
  readCameraMovementEnabled,
  readStyleBible,
} from "@/lib/storyboardData";

describe("extractStoryboardScenes", () => {
  it("mengambil scenes dan menomori ulang berurutan", () => {
    const out = extractStoryboardScenes({
      scenes: [
        { sceneContext: "A", visual: "v1", settingKamera: "MS | eye-level" },
        "bukan objek",
        { visual: "—" },
      ],
    });
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ index: 1, context: "A", visual: "v1", settingKamera: "MS | eye-level" });
    expect(out[1]).toMatchObject({ index: 2, visual: "" });
  });
  it("kosong untuk data lama / tidak valid", () => {
    expect(extractStoryboardScenes(null)).toEqual([]);
    expect(extractStoryboardScenes({ segments: [] })).toEqual([]);
  });
});

describe("readStyleBible", () => {
  it("default jika kosong atau artStyle tidak valid", () => {
    expect(readStyleBible(null).artStyle).toBe("bw_sketch");
    expect(readStyleBible({ styleBible: { artStyle: "ngawur", characters: "X" } }).artStyle).toBe("bw_sketch");
    expect(readStyleBible({ styleBible: { artStyle: "watercolor", characters: "X" } }).characters).toBe("X");
  });
});

describe("config readers", () => {
  it("aspect ratio default 9:16", () => {
    expect(readAspectRatio(null)).toBe("9:16");
    expect(readAspectRatio({ videoConfig: { aspectRatio: "16:9" } })).toBe("16:9");
  });
  it("camera movement hanya false jika eksplisit false", () => {
    expect(readCameraMovementEnabled(null)).toBe(true);
    expect(readCameraMovementEnabled({ cameraMovementEnabled: false })).toBe(false);
  });
});
