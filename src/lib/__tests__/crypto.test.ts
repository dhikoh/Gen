import { describe, it, expect, beforeAll } from "vitest";
import {
  encryptSecret,
  decryptSecret,
  isLegacyPayload,
  apiKeyAad,
  googleDriveAad,
  maskApiKey,
  getKeyFingerprint,
} from "@/lib/crypto";

beforeAll(() => {
  process.env.API_KEY_ENCRYPTION_SECRET = "x".repeat(40);
});

describe("crypto v2 with AAD and legacy backward-compatibility", () => {
  it("roundtrip v2 dengan aad sama menghasilkan plaintext kembali", () => {
    const plain = "AIzaSyTESTSECRETKEYFORUSER1234567890";
    const aad = apiKeyAad("user_123", "GEMINI");
    const encrypted = encryptSecret(plain, aad);

    expect(encrypted.startsWith("v2:")).toBe(true);
    expect(isLegacyPayload(encrypted)).toBe(false);

    const decrypted = decryptSecret(encrypted, aad);
    expect(decrypted).toBe(plain);
  });

  it("payload v2 didekripsi dengan aad BERBEDA melempar error", () => {
    const plain = "secret-content-for-user-a";
    const aadUserA = apiKeyAad("user_A", "GEMINI");
    const aadUserB = apiKeyAad("user_B", "GEMINI");

    const encrypted = encryptSecret(plain, aadUserA);
    expect(() => decryptSecret(encrypted, aadUserB)).toThrow();
  });

  it("payload v2 tanpa aad melempar error", () => {
    const plain = "secret-content";
    const aad = apiKeyAad("user_123", "GEMINI");
    const encrypted = encryptSecret(plain, aad);

    expect(() => decryptSecret(encrypted)).toThrow("AAD required for v2 payload");
  });

  it("payload legacy tanpa aad memiliki isLegacyPayload true dan decryptSecret berhasil", () => {
    const plain = "legacy-plain-key-abc-123";
    const legacyEncrypted = encryptSecret(plain); // tanpa aad

    expect(isLegacyPayload(legacyEncrypted)).toBe(true);
    expect(legacyEncrypted.startsWith("v2:")).toBe(false);
    expect(legacyEncrypted.split(":")).toHaveLength(3);

    // Didekripsi tanpa aad
    expect(decryptSecret(legacyEncrypted)).toBe(plain);
    // Didekripsi dengan aad pun legacy tetap berhasil (aad diabaikan untuk format lama)
    expect(decryptSecret(legacyEncrypted, apiKeyAad("user_123", "GEMINI"))).toBe(plain);
  });

  it("payload v2 yang 1 karakter ciphertext-nya diubah melempar error (tampered)", () => {
    const plain = "uncompromised-secret";
    const aad = apiKeyAad("user_target", "GEMINI");
    const encrypted = encryptSecret(plain, aad);

    const parts = encrypted.split(":");
    // format v2:<iv>:<tag>:<cipher> -> parts: ['v2', iv, tag, cipher]
    expect(parts.length).toBe(4);
    const lastPart = parts[3];
    // Ganti karakter terakhir ciphertext
    const alteredChar = lastPart.endsWith("A") ? "B" : "A";
    parts[3] = lastPart.slice(0, -1) + alteredChar;
    const tampered = parts.join(":");

    expect(() => decryptSecret(tampered, aad)).toThrow();
  });

  it("dua enkripsi plaintext sama menghasilkan string berbeda (random IV)", () => {
    const plain = "identical-plaintext";
    const aad = googleDriveAad("user_drive_1");
    const enc1 = encryptSecret(plain, aad);
    const enc2 = encryptSecret(plain, aad);

    expect(enc1).not.toBe(enc2);
    expect(decryptSecret(enc1, aad)).toBe(plain);
    expect(decryptSecret(enc2, aad)).toBe(plain);
  });

  it("helper functions maskApiKey and getKeyFingerprint behave as expected", () => {
    expect(maskApiKey("AIzaSyABCDEF1234")).toBe("\u2022\u2022\u2022\u2022 1234");
    expect(getKeyFingerprint("AIzaSyABCDEF1234")).toBe("1234");
    expect(apiKeyAad("u1", "GEMINI")).toBe("apikey:u1:GEMINI");
    expect(googleDriveAad("u1")).toBe("gdrive:u1");
  });
});
