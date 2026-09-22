import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) throw new Error("API_KEY_ENCRYPTION_SECRET is not set");
  // sha256 menghasilkan 32-byte key yang dibutuhkan AES-256
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Enkripsi string plaintext ke format "iv:authTag:ciphertext" (semua base64).
 * IV di-generate acak setiap kali, sehingga dua enkripsi teks yang sama menghasilkan
 * ciphertext yang berbeda (non-deterministic).
 */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV untuk GCM
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Dekripsi hasil encryptSecret().
 * Lempar Error jika format tidak valid atau authTag verifikasi gagal (data tampered).
 */
export function decryptSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted payload format");
  const [ivB64, tagB64, dataB64] = parts;
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted payload format");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Untuk ditampilkan di UI: "•••• ab12" — tanpa pernah expose key asli ke client.
 */
export function maskApiKey(rawKey: string): string {
  const last4 = rawKey.slice(-4);
  return `\u2022\u2022\u2022\u2022 ${last4}`;
}

export function getKeyFingerprint(rawKey: string): string {
  return rawKey.slice(-4);
}
