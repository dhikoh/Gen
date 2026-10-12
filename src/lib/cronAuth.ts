import crypto from "crypto";

/**
 * Otorisasi endpoint cron. FAIL-CLOSED:
 * jika CRON_SECRET tidak diatur atau kurang dari 16 karakter, SEMUA request ditolak.
 * Secret dikirim lewat header "Authorization: Bearer <secret>" (disarankan)
 * atau query "?secret=" (hanya untuk kompatibilitas dengan jadwal lama).
 */
export function isCronAuthorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET ?? "";
  if (expected.length < 16) return false;

  const authHeader = req.headers.get("authorization") ?? "";
  const fromHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
  const fromQuery = new URL(req.url).searchParams.get("secret") ?? "";
  const provided = fromHeader || fromQuery;
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
