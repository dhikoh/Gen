import { describe, it, expect } from "vitest";
import {
  autoSceneCount,
  autoSceneRange,
  clampSceneCount,
  reachableDurationSec,
  MAX_SCENE_COUNT,
  MIN_SCENE_COUNT,
  MIN_SEC_PER_SCENE,
  MAX_SEC_PER_SCENE,
  AUTO_SWEET_SPOT_SEC,
} from "@/lib/sceneLimits";

describe("sceneLimits", () => {
  // Patch #111: autoSceneCount now uses natural 7s sweet-spot with 4-12s/scene clamp (6-8s standard)
  it("autoSceneCount 60s -> 9 scenes (60/7 ≈ 9)", () => {
    expect(autoSceneCount(60, "medium")).toBe(9);
  });

  it("autoSceneCount 60s ignores speechRate param (backward compat)", () => {
    // All speech rates should produce the same result (speechRate is no longer used)
    expect(autoSceneCount(60, "slow")).toBe(9);
    expect(autoSceneCount(60, "fast")).toBe(9);
    expect(autoSceneCount(60, "medium")).toBe(9);
  });

  it("autoSceneCount 30s -> 4 scenes (30/7 ≈ 4)", () => {
    expect(autoSceneCount(30)).toBe(4);
  });

  it("autoSceneCount 55s -> 8 scenes (55/7 ≈ 8)", () => {
    expect(autoSceneCount(55)).toBe(8);
  });

  it("autoSceneCount 90s -> 13 scenes (90/7 ≈ 13)", () => {
    expect(autoSceneCount(90)).toBe(13);
  });

  it("autoSceneCount 15s -> 2 scenes (15/7 ≈ 2)", () => {
    expect(autoSceneCount(15)).toBe(2);
  });

  it("autoSceneCount 10s -> 1 scene (10/7 ≈ 1, within 4-12s/scene)", () => {
    expect(autoSceneCount(10)).toBe(1);
  });

  it("autoSceneCount clamps to MAX_SCENE_COUNT", () => {
    expect(autoSceneCount(9999, "fast")).toBe(MAX_SCENE_COUNT);
  });

  it("autoSceneCount clamps to MIN_SCENE_COUNT", () => {
    expect(autoSceneCount(1, "slow")).toBe(MIN_SCENE_COUNT);
  });

  it("autoSceneCount accepts numeric speechRate (backward compat, ignored)", () => {
    // 120s / 7s ≈ 17 scenes
    expect(autoSceneCount(120, 5)).toBe(17);
  });

  it("autoSceneCount enforces 4-12s/scene clamp", () => {
    // 120s: 120/7 ≈ 17, each scene ≈ 7s (within 4-12) ✓
    const count120 = autoSceneCount(120);
    expect(120 / count120).toBeGreaterThanOrEqual(MIN_SEC_PER_SCENE);
    expect(120 / count120).toBeLessThanOrEqual(MAX_SEC_PER_SCENE);

    // 600s: 600/7 ≈ 86 scenes, each ≈ 7s ✓
    const count600 = autoSceneCount(600);
    expect(600 / count600).toBeGreaterThanOrEqual(MIN_SEC_PER_SCENE);
    expect(600 / count600).toBeLessThanOrEqual(MAX_SEC_PER_SCENE);
  });

  // autoSceneRange tests
  it("autoSceneRange returns recommended/min/max for 60s", () => {
    const range = autoSceneRange(60);
    expect(range.recommended).toBe(9);
    expect(range.min).toBe(5);  // ceil(60/12) = 5
    expect(range.max).toBe(15); // floor(60/4) = 15
  });

  it("autoSceneRange returns recommended/min/max for 55s", () => {
    const range = autoSceneRange(55);
    expect(range.recommended).toBe(8);
    expect(range.min).toBe(5);  // ceil(55/12) = 5
    expect(range.max).toBe(13); // floor(55/4) = 13
  });

  it("autoSceneRange for 30s", () => {
    const range = autoSceneRange(30);
    expect(range.recommended).toBe(4);
    expect(range.min).toBe(3);  // ceil(30/12) = 3
    expect(range.max).toBe(7);  // floor(30/4) = 7
  });

  it("autoSceneRange for 120s", () => {
    const range = autoSceneRange(120);
    expect(range.recommended).toBe(17);
    expect(range.min).toBe(10); // ceil(120/12) = 10
    expect(range.max).toBe(30); // floor(120/4) = 30
  });

  // Constants validation
  it("sweet spot is within min/max bounds", () => {
    expect(AUTO_SWEET_SPOT_SEC).toBeGreaterThanOrEqual(MIN_SEC_PER_SCENE);
    expect(AUTO_SWEET_SPOT_SEC).toBeLessThanOrEqual(MAX_SEC_PER_SCENE);
  });

  // clampSceneCount tests (unchanged behavior)
  it("clampSceneCount clamps below MIN", () => {
    expect(clampSceneCount(-5)).toBe(MIN_SCENE_COUNT);
  });

  it("clampSceneCount clamps above MAX", () => {
    expect(clampSceneCount(999)).toBe(MAX_SCENE_COUNT);
  });

  it("clampSceneCount returns null for NaN", () => {
    expect(clampSceneCount("abc")).toBeNull();
  });

  it("clampSceneCount accepts string number", () => {
    expect(clampSceneCount("25")).toBe(25);
  });

  // reachableDurationSec (updated formula uses MIN_SEC_PER_SCENE)
  it("reachableDurationSec returns target duration when reachable", () => {
    expect(reachableDurationSec(60, "medium")).toBe(60);
    // 120 * 4 = 480, so 60 and 400 are reachable
    expect(reachableDurationSec(400, "slow")).toBe(400);
  });

  it("reachableDurationSec truncates duration when exceeding MAX_SCENE_COUNT capacity", () => {
    // MAX_SCENE_COUNT * MIN_SEC_PER_SCENE = 120 * 4 = 480
    expect(reachableDurationSec(600, "fast")).toBe(480);
    expect(reachableDurationSec(600, 2)).toBe(480);
  });
});
