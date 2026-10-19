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
  // Patch #104: autoSceneCount now uses proportional 5s sweet-spot with 4-10s/scene clamp
  it("autoSceneCount 60s -> 12 scenes (60/5=12)", () => {
    expect(autoSceneCount(60, "medium")).toBe(12);
  });

  it("autoSceneCount 60s ignores speechRate param (backward compat)", () => {
    // All speech rates should produce the same result (speechRate is no longer used)
    expect(autoSceneCount(60, "slow")).toBe(12);
    expect(autoSceneCount(60, "fast")).toBe(12);
    expect(autoSceneCount(60, "medium")).toBe(12);
  });

  it("autoSceneCount 30s -> 6 scenes (30/5=6)", () => {
    expect(autoSceneCount(30)).toBe(6);
  });

  it("autoSceneCount 55s -> 11 scenes (55/5=11)", () => {
    expect(autoSceneCount(55)).toBe(11);
  });

  it("autoSceneCount 90s -> 18 scenes (90/5=18)", () => {
    expect(autoSceneCount(90)).toBe(18);
  });

  it("autoSceneCount 15s -> 3 scenes (15/5=3)", () => {
    expect(autoSceneCount(15)).toBe(3);
  });

  it("autoSceneCount 10s -> 2 scenes (10/5=2, within 4-10s/scene)", () => {
    expect(autoSceneCount(10)).toBe(2);
  });

  it("autoSceneCount clamps to MAX_SCENE_COUNT", () => {
    expect(autoSceneCount(9999, "fast")).toBe(MAX_SCENE_COUNT);
  });

  it("autoSceneCount clamps to MIN_SCENE_COUNT", () => {
    expect(autoSceneCount(1, "slow")).toBe(MIN_SCENE_COUNT);
  });

  it("autoSceneCount accepts numeric speechRate (backward compat, ignored)", () => {
    // 120s / 5s = 24 scenes
    expect(autoSceneCount(120, 5)).toBe(24);
  });

  it("autoSceneCount enforces 4-10s/scene clamp", () => {
    // 120s: 120/5=24, each scene=5s (within 4-10) ✓
    const count120 = autoSceneCount(120);
    expect(120 / count120).toBeGreaterThanOrEqual(MIN_SEC_PER_SCENE);
    expect(120 / count120).toBeLessThanOrEqual(MAX_SEC_PER_SCENE);

    // 600s: 600/5=120 scenes, each=5s ✓
    const count600 = autoSceneCount(600);
    expect(600 / count600).toBeGreaterThanOrEqual(MIN_SEC_PER_SCENE);
    expect(600 / count600).toBeLessThanOrEqual(MAX_SEC_PER_SCENE);
  });

  // autoSceneRange tests
  it("autoSceneRange returns recommended/min/max for 60s", () => {
    const range = autoSceneRange(60);
    expect(range.recommended).toBe(12);
    expect(range.min).toBe(6);  // ceil(60/10) = 6
    expect(range.max).toBe(15); // floor(60/4) = 15
  });

  it("autoSceneRange returns recommended/min/max for 55s", () => {
    const range = autoSceneRange(55);
    expect(range.recommended).toBe(11);
    expect(range.min).toBe(6);  // ceil(55/10) = 6
    expect(range.max).toBe(13); // floor(55/4) = 13
  });

  it("autoSceneRange for 30s", () => {
    const range = autoSceneRange(30);
    expect(range.recommended).toBe(6);
    expect(range.min).toBe(3);  // ceil(30/10) = 3
    expect(range.max).toBe(7);  // floor(30/4) = 7
  });

  it("autoSceneRange for 120s", () => {
    const range = autoSceneRange(120);
    expect(range.recommended).toBe(24);
    expect(range.min).toBe(12); // ceil(120/10) = 12
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
