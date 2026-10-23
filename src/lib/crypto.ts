import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const V2_PREFIX = "v2";

function getKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) throw new Error("API_KEY_ENCRYPTION_SECRET is not set");
  // sha256 menghasilkan 32-byte key yang dibutuhkan AES-256
  //
  // ⚠️ ROTASI SECRET: Jika API_KEY_ENCRYPTION_SECRET diubah, SEMUA ciphertext
  // v2 yang ada akan gagal didekripsi. Sebelum rotasi, jalankan script
  // re-encrypt batch untuk tabel:
  //   - UserApiKey.encryptedKey
  //   - UserGoogleDriveToken.encryptedAccess & encryptedRefresh (Fase 5)
  // Script: decrypt dengan key lama, encrypt ulang dengan key baru.
  return crypto.createHash("sha256").update(secret).digest();
}

/** AAD untuk API key user: mengikat ciphertext ke user + provider. */
export function apiKeyAad(userId: string, provider: string): string {
  return `apikey:${userId}:${provider}`;
}

/** AAD untuk token Google Drive user (dipakai Fase 5). */
export function googleDriveAad(userId: string): string {
  return `gdrive:${userId}`;
}

/** AAD untuk token koneksi sosial/storage channel (mengikat ciphertext ke channelId + provider). */
export function channelConnectionAad(channelId: string, provider: "google" | "meta"): string {
  return `channel_conn:${channelId}:${provider}`;
}

/**
 * Enkripsi ke format:
 * - dengan aad  : "v2:<iv_b64>:<authTag_b64>:<ciphertext_b64>"
 * - tanpa aad   : "<iv_b64>:<authTag_b64>:<ciphertext_b64>" (legacy, jangan dipakai kode baru)
 */
export function encryptSecret(plain: string, aad?: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV untuk GCM
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  if (aad) cipher.setAAD(Buffer.from(aad, "utf8"));
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const body = [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
  return aad ? `${V2_PREFIX}:${body}` : body;
}

/** true jika payload masih format lama (tanpa AAD). */
export function isLegacyPayload(payload: string): boolean {
  return !payload.startsWith(`${V2_PREFIX}:`);
}

/**
 * Dekripsi hasil encryptSecret().
 * - Payload "v2:" WAJIB disertai aad yang sama persis, jika tidak -> Error.
 * - Payload legacy (tanpa "v2:") didekripsi tanpa AAD (parameter aad diabaikan).
 */
export function decryptSecret(payload: string, aad?: string): string {
  let body = payload;
  let useAad = false;
  if (payload.startsWith(`${V2_PREFIX}:`)) {
    if (!aad) throw new Error("AAD required for v2 payload");
    body = payload.slice(V2_PREFIX.length + 1);
    useAad = true;
  }
  const parts = body.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted payload format");
  const [ivB64, tagB64, dataB64] = parts;
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted payload format");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64")
  );
  if (useAad && aad) decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Untuk UI: "•••• ab12" — tanpa pernah expose key asli ke client. */
export function maskApiKey(rawKey: string): string {
  const last4 = rawKey.slice(-4);
  return `\u2022\u2022\u2022\u2022 ${last4}`;
}

export function getKeyFingerprint(rawKey: string): string {
  return rawKey.slice(-4);
}
