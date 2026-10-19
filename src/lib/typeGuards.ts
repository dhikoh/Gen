/**
 * Type guard utilities untuk validasi tipe runtime.
 */

/**
 * Memeriksa apakah suatu nilai adalah objek generik non-null dan bukan array.
 */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
