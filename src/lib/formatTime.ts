/**
 * Format detik ke string "M:SS".
 * Dipakai di VideoTimelineTab dan komponen render.
 */
export function formatTime(sec: number): string {
  const safeSec = Math.max(0, Math.floor(sec));
  const m = Math.floor(safeSec / 60);
  const s = Math.floor(safeSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
