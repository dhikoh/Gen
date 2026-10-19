import { describe, it, expect } from "vitest";
import { isRecord } from "@/lib/typeGuards";

describe("typeGuards - isRecord", () => {
  it("mengembalikan true untuk objek biasa", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ foo: "bar" })).toBe(true);
    expect(isRecord({ a: 1, b: null })).toBe(true);
  });

  it("mengembalikan false untuk null dan undefined", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });

  it("mengembalikan false untuk array", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2, 3])).toBe(false);
    expect(isRecord(["a", "b"])).toBe(false);
  });

  it("mengembalikan false untuk tipe primitif", () => {
    expect(isRecord("string")).toBe(false);
    expect(isRecord(123)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(false)).toBe(false);
    expect(isRecord(Symbol("sym"))).toBe(false);
    expect(isRecord(BigInt(123))).toBe(false);
  });

  it("mengembalikan false untuk fungsi", () => {
    expect(isRecord(() => {})).toBe(false);
    expect(isRecord(function () {})).toBe(false);
  });
});
