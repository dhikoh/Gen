import { describe, it, expect } from "vitest";
import { isBearerTokenValid } from "@/lib/serviceToken";

describe("serviceToken constant-time verification", () => {
  const validSecret = "a".repeat(32); // 32 characters
  const validHeader = `Bearer ${validSecret}`;

  it("returns true when token matches expected secret exactly", () => {
    expect(isBearerTokenValid(validHeader, validSecret)).toBe(true);
  });

  it("returns false when token is wrong", () => {
    expect(isBearerTokenValid("Bearer wrongtokenthatisquiteverylong123456", validSecret)).toBe(false);
  });

  it("returns false when secret is empty or undefined", () => {
    expect(isBearerTokenValid(validHeader, "")).toBe(false);
    expect(isBearerTokenValid(validHeader, undefined)).toBe(false);
  });

  it("returns false when secret is shorter than minLength (32)", () => {
    const shortSecret = "short-secret-under-32-chars";
    expect(isBearerTokenValid(`Bearer ${shortSecret}`, shortSecret)).toBe(false);
  });

  it("returns false when authHeader has no Bearer prefix", () => {
    expect(isBearerTokenValid(validSecret, validSecret)).toBe(false);
    expect(isBearerTokenValid(`Basic ${validSecret}`, validSecret)).toBe(false);
    expect(isBearerTokenValid(null, validSecret)).toBe(false);
    expect(isBearerTokenValid("", validSecret)).toBe(false);
  });

  it("returns false without throwing when token has different length", () => {
    expect(() => isBearerTokenValid("Bearer short", validSecret)).not.toThrow();
    expect(isBearerTokenValid("Bearer short", validSecret)).toBe(false);
    expect(isBearerTokenValid(`Bearer ${"a".repeat(100)}`, validSecret)).toBe(false);
  });
});
