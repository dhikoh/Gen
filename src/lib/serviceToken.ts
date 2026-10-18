import crypto from "crypto";

/** Bandingkan header "Authorization: Bearer <token>" dengan secret env secara constant-time. */
export function isBearerTokenValid(
  authHeader: string | null,
  expected: string | undefined,
  minLength = 32
): boolean {
  if (!expected || expected.length < minLength) return false;
  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) return false;
  const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!provided) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
