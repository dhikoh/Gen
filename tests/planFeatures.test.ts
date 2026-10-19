import { describe, it, expect } from "vitest";
import { hasFeature, KNOWN_PLAN_FEATURES } from "@/lib/planFeatures";

describe("planFeatures", () => {
  it("defines known plan features with expected defaults", () => {
    expect(KNOWN_PLAN_FEATURES.length).toBeGreaterThan(0);
    const cameraPro = KNOWN_PLAN_FEATURES.find((f) => f.key === "cameraMovementPro");
    expect(cameraPro?.defaultValue).toBe(false);
    const youtubeLong = KNOWN_PLAN_FEATURES.find((f) => f.key === "youtubeLongStudio");
    expect(youtubeLong?.defaultValue).toBe(false);
    const retentionPro = KNOWN_PLAN_FEATURES.find((f) => f.key === "retentionPacingPro");
    expect(retentionPro?.defaultValue).toBe(false);
  });

  it("always grants full access to SUPERADMIN", () => {
    expect(hasFeature({ imagePromptStudio: false }, "imagePromptStudio", true)).toBe(true);
    expect(hasFeature(null, "cameraMovementPro", true)).toBe(true);
  });

  it("respects explicitly defined feature booleans", () => {
    expect(hasFeature({ imagePromptStudio: true }, "imagePromptStudio")).toBe(true);
    expect(hasFeature({ imagePromptStudio: false }, "imagePromptStudio")).toBe(false);
    expect(hasFeature({ cameraMovementPro: true }, "cameraMovementPro")).toBe(true);
    expect(hasFeature({ cameraMovementPro: false }, "cameraMovementPro")).toBe(false);
  });

  it("falls back to KNOWN_PLAN_FEATURES default if key is not explicitly set in features JSON", () => {
    // cameraMovementPro defaultValue is false
    expect(hasFeature({}, "cameraMovementPro")).toBe(false);
    // imagePromptStudio defaultValue is true
    expect(hasFeature({}, "imagePromptStudio")).toBe(true);
  });

  it("fails open (returns true) for completely unknown features", () => {
    expect(hasFeature({}, "unknownBrandNewFutureFeature")).toBe(true);
    expect(hasFeature(null, "unknownBrandNewFutureFeature")).toBe(true);
  });
});
