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
 * Patch #104: Proportional Scene-Duration Guard
 *
 * Setiap scene WAJIB berdurasi antara MIN_SEC dan MAX_SEC.
 *   - Floor  4s → mencegah micro-scene (flash frames, tidak natural)
 *   - Ceiling 10s → mencegah scene terlalu panjang (kehilangan engagement)
 *   - Sweet-spot 5s → pacing default yang natural untuk short-form
 *
 * Contoh: 60s / 5s = 12 scene (bukan 6 scene lama yang 10s/scene).
 */
export const MIN_SEC_PER_SCENE = 4;
export const MAX_SEC_PER_SCENE = 10;
export const AUTO_SWEET_SPOT_SEC = 5;

/**
 * Kalkulasi jumlah scene otomatis berdasarkan durasi target.
 *
 * Patch #104: Mengganti formula lama (speechRate-based avgSecPerScene)
 * dengan sweet-spot 5 detik/scene + clamp 4-10 detik/scene.
 *
 * Parameter `speechRate` dipertahankan untuk backward compatibility
 * (GeneratorForm masih memanggil autoSceneCount(dur, rate)) namun
 * tidak lagi dipakai dalam kalkulasi — scene count kini murni
 * proporsional terhadap durasi target.
 *
 * Hasilnya di-clamp ke [MIN_SCENE_COUNT, MAX_SCENE_COUNT].
 */
export function autoSceneCount(
  targetDurationSec: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _speechRate: string | number = "medium"
): number {
  const raw = Math.round(targetDurationSec / AUTO_SWEET_SPOT_SEC);

  // Clamp agar setiap scene tetap dalam 4-10 detik
  const maxByFloor = Math.floor(targetDurationSec / MIN_SEC_PER_SCENE);
  const minByCeiling = Math.max(1, Math.ceil(targetDurationSec / MAX_SEC_PER_SCENE));
  const clamped = Math.max(minByCeiling, Math.min(maxByFloor, raw));

  return Math.max(MIN_SCENE_COUNT, Math.min(MAX_SCENE_COUNT, clamped));
}

/**
 * Patch #104: Mengembalikan recommended + min/max range untuk scene count.
 * Dipakai oleh promptGenerator untuk instruksi "REKOMENDASI ~X (rentang: Y–Z)".
 */
export interface AutoSceneRange {
  recommended: number;
  min: number;
  max: number;
}

export function autoSceneRange(targetDurationSec: number): AutoSceneRange {
  const recommended = autoSceneCount(targetDurationSec);
  const min = Math.max(MIN_SCENE_COUNT, Math.ceil(targetDurationSec / MAX_SEC_PER_SCENE));
  const max = Math.min(MAX_SCENE_COUNT, Math.floor(targetDurationSec / MIN_SEC_PER_SCENE));
  return {
    recommended,
    min: Math.max(MIN_SCENE_COUNT, min),
    max: Math.max(min, max),
  };
}

/**
 * Apakah target durasi yang diminta user masih bisa dicapai setelah di-clamp
 * ke MAX_SCENE_COUNT? Mengembalikan detik yang benar-benar bisa dicapai.
 */
export function reachableDurationSec(
  targetDurationSec: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _speechRate: string | number = "medium"
): number {
  return Math.min(targetDurationSec, MAX_SCENE_COUNT * MIN_SEC_PER_SCENE);
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
