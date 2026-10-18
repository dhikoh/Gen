import { describe, it, expect } from "vitest";
import {
  autoSceneCount,
  clampSceneCount,
  MAX_SCENE_COUNT,
  MIN_SCENE_COUNT,
} from "@/lib/sceneLimits";

describe("sceneLimits", () => {
  it("autoSceneCount medium 60s -> 15 scenes", () => {
    expect(autoSceneCount(60, "medium")).toBe(15);
  });

  it("autoSceneCount slow 60s -> 10 scenes", () => {
    expect(autoSceneCount(60, "slow")).toBe(10);
  });

  it("autoSceneCount fast 60s -> 20 scenes", () => {
    expect(autoSceneCount(60, "fast")).toBe(20);
  });

  it("autoSceneCount clamps to MAX_SCENE_COUNT", () => {
    expect(autoSceneCount(9999, "fast")).toBe(MAX_SCENE_COUNT);
  });

  it("autoSceneCount clamps to MIN_SCENE_COUNT", () => {
    expect(autoSceneCount(1, "slow")).toBe(MIN_SCENE_COUNT);
  });

  it("autoSceneCount accepts numeric speechRate", () => {
    expect(autoSceneCount(120, 5)).toBe(24);
  });

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
});
