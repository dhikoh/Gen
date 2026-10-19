/**
 * Batas jumlah scene yang boleh diminta ke AI.
 * Maks 120 dipilih karena: rata-rata 1 scene = 3-5 detik,
 * 120 scene = 6-10 menit video, cukup untuk long-form YouTube.
 * Nilai ini dipakai di GeneratorForm (validasi input), promptGenerator
 * (injeksi instruksi ke AI), dan parsers (batas loop parseScenes).
 */
export const MAX_SCENE_COUNT = 120;
export const MIN_SCENE_COUNT = 1;
export const DEFAULT_SCENE_COUNT = 10;

/** Durasi target minimum dan maksimum (detik) */
export const MIN_TARGET_DURATION_SEC = 10;
export const MAX_TARGET_DURATION_SEC = 600;
export const DEFAULT_TARGET_DURATION_SEC = 60;

/**
 * Kalkulasi jumlah scene otomatis berdasarkan durasi target dan speech rate.
 * Rumus: ceil(durasi_detik / avg_detik_per_scene).
 * avg_detik_per_scene bergantung pada speechRate (slow=6, medium=4, fast=3).
 *
 * Hasilnya di-clamp ke [MIN_SCENE_COUNT, MAX_SCENE_COUNT].
 */
export function autoSceneCount(
  targetDurationSec: number,
  speechRate: string | number = "medium"
): number {
  const rateMap: Record<string, number> = {
    slow: 6,
    medium: 4,
    fast: 3,
  };
  const avgSecPerScene =
    typeof speechRate === "number"
      ? Math.max(2, Math.min(10, speechRate))
      : rateMap[String(speechRate).toLowerCase()] ?? 4;

  const raw = Math.ceil(targetDurationSec / avgSecPerScene);
  return Math.max(MIN_SCENE_COUNT, Math.min(MAX_SCENE_COUNT, raw));
}

/**
 * Apakah target durasi yang diminta user masih bisa dicapai setelah di-clamp
 * ke MAX_SCENE_COUNT? Mengembalikan detik yang benar-benar bisa dicapai.
 */
export function reachableDurationSec(
  targetDurationSec: number,
  speechRate: string | number = "medium"
): number {
  const rateMap: Record<string, number> = { slow: 6, medium: 4, fast: 3 };
  const avgSecPerScene =
    typeof speechRate === "number"
      ? Math.max(2, Math.min(10, speechRate))
      : rateMap[String(speechRate).toLowerCase()] ?? 4;
  return Math.min(targetDurationSec, MAX_SCENE_COUNT * avgSecPerScene);
}

/**
 * Validasi angka scene dari input user.
 * Mengembalikan angka yang sudah di-clamp, atau null jika input bukan angka.
 */
export function clampSceneCount(input: unknown): number | null {
  const n = typeof input === "number" ? input : parseInt(String(input), 10);
  if (!Number.isFinite(n)) return null;
  return Math.max(MIN_SCENE_COUNT, Math.min(MAX_SCENE_COUNT, n));
}
