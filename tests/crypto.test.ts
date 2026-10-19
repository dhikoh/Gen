import { describe, it, expect, beforeAll } from "vitest";
import { encryptSecret, decryptSecret, maskApiKey, getKeyFingerprint } from "@/lib/crypto";

beforeAll(() => {
  // Set secret for tests — minimal 32 karakter
  process.env.API_KEY_ENCRYPTION_SECRET = "test-secret-minimal-32-karakter-panjang";
});

describe("crypto", () => {
  it("round-trips encrypt/decrypt correctly", () => {
    const plain = "AIzaSyFAKEKEYFORTESTINGPURPOSESONLY1234";
    const encrypted = encryptSecret(plain);
    // Format harus "iv:authTag:ciphertext"
    expect(encrypted.split(":")).toHaveLength(3);
    expect(decryptSecret(encrypted)).toBe(plain);
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const plain = "same-key-value";
    const enc1 = encryptSecret(plain);
    const enc2 = encryptSecret(plain);
    // IV acak memastikan ciphertext berbeda setiap kali
    expect(enc1).not.toBe(enc2);
    // Tapi keduanya harus bisa didekripsi ke nilai asli
    expect(decryptSecret(enc1)).toBe(plain);
    expect(decryptSecret(enc2)).toBe(plain);
  });

  it("masks the key showing only the last 4 characters", () => {
    expect(maskApiKey("AIzaSyABCDEF1234")).toBe("\u2022\u2022\u2022\u2022 1234");
    expect(maskApiKey("short")).toBe("\u2022\u2022\u2022\u2022 hort");
  });

  it("getKeyFingerprint returns last 4 chars", () => {
    expect(getKeyFingerprint("AIzaSyXXXXtest")).toBe("test");
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encryptSecret("some-value");
    const parts = encrypted.split(":");
    // Tamper the ciphertext part (index 2)
    parts[2] = Buffer.from("tampered-data-xyz").toString("base64");
    expect(() => decryptSecret(parts.join(":"))).toThrow();
  });

  it("throws on invalid payload format (missing parts)", () => {
    expect(() => decryptSecret("onlyone")).toThrow("Invalid encrypted payload format");
    expect(() => decryptSecret("only:two")).toThrow("Invalid encrypted payload format");
  });
});
