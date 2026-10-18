/**
 * Kontrak yang WAJIB dipenuhi oleh kode HTML animasi buatan AI.
 *
 * AI menghasilkan SATU file HTML self-contained yang:
 * 1. Tidak memuat library eksternal (no CDN, no import, no fetch).
 * 2. Tidak mengakses jaringan (no XMLHttpRequest, no WebSocket, no fetch).
 * 3. Menyediakan objek global window.__anim dengan method:
 *    - seek(timeSec: number): void  -- lompat ke waktu tertentu
 *    - getDuration(): number        -- total durasi animasi (detik)
 *    - getReadyPromise(): Promise<void> -- resolve saat siap render
 * 4. Merender ke <canvas id="anim-canvas"> berukuran 1920x1080 (atau sesuai aspect ratio).
 * 5. Tidak memunculkan alert/confirm/prompt.
 * 6. Tidak mengakses localStorage/sessionStorage/IndexedDB.
 */

export const ANIMATION_CONTRACT_VERSION = 1;

export const CANVAS_ID = "anim-canvas";
export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1080;
export const DEFAULT_FPS = 30;

/** Batas ukuran kode HTML animasi: 2 MB */
export const MAX_HTML_SIZE = 2 * 1024 * 1024;

export interface AnimationContract {
  /** seek ke waktu tertentu (detik). Frame harus ter-render sinkron setelah panggilan ini. */
  seek(timeSec: number): void;
  /** Total durasi animasi dalam detik. */
  getDuration(): number;
  /** Promise yang resolve saat animasi siap dirender (aset internal dimuat, canvas siap). */
  getReadyPromise(): Promise<void>;
}

/**
 * Template minimal yang WAJIB ada di HTML animasi.
 * AI menyisipkan logika animasi di dalam blok <script>.
 */
export const HTML_TEMPLATE_SKELETON = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: {{WIDTH}}px; height: {{HEIGHT}}px; overflow: hidden; background: #000; }
  #${CANVAS_ID} { width: {{WIDTH}}px; height: {{HEIGHT}}px; }
</style>
</head>
<body>
<canvas id="${CANVAS_ID}" width="{{WIDTH}}" height="{{HEIGHT}}"></canvas>
<script>
(function() {
  const canvas = document.getElementById("${CANVAS_ID}");
  const ctx = canvas.getContext("2d");

  // === KODE ANIMASI AI DIMULAI DI SINI ===
  {{ANIMATION_CODE}}
  // === KODE ANIMASI AI SELESAI ===

  window.__anim = {
    seek: function(t) { /* AI implementasi */ },
    getDuration: function() { return {{TOTAL_DURATION}}; },
    getReadyPromise: function() { return Promise.resolve(); }
  };
})();
</script>
</body>
</html>`;

/**
 * Validasi kode HTML animasi sebelum dimasukkan ke iframe.
 * Mengembalikan array string error (kosong = valid).
 *
 * PENTING: Semua regex TANPA flag \`g\` (global). Flag \`g\` menyebabkan
 * \`.test()\` menjadi stateful via \`lastIndex\`, sehingga panggilan
 * kedua berturut-turut bisa memberi hasil berbeda. Hanya flag \`i\`
 * (case-insensitive) yang dipakai.
 */
export function validateAnimationCode(html: string): string[] {
  const errors: string[] = [];

  // Batas ukuran
  if (html.length > MAX_HTML_SIZE) {
    errors.push(`Kode HTML terlalu besar: ${(html.length / 1024 / 1024).toFixed(1)} MB (maks ${MAX_HTML_SIZE / 1024 / 1024} MB).`);
    return errors; // Langsung return, tidak perlu parse lebih lanjut
  }

  // Wajib ada canvas
  if (!html.includes(CANVAS_ID)) {
    errors.push(`Canvas dengan id "${CANVAS_ID}" tidak ditemukan.`);
  }

  // Wajib ada window.__anim
  if (!html.includes("window.__anim") && !html.includes("__anim")) {
    errors.push("window.__anim tidak ditemukan.");
  }

  // Dilarang: akses jaringan
  // CATATAN: Flag \`i\` saja, TANPA \`g\` — lihat komentar di atas.
  const networkPatterns: [RegExp, string][] = [
    [/\bfetch\s*\(/i, "fetch()"],
    [/\bXMLHttpRequest\b/i, "XMLHttpRequest"],
    [/\bWebSocket\b/i, "WebSocket"],
    [/\bimport\s*\(/i, "dynamic import()"],
    [/\bimport\s+/i, "static import"],
    [/src\s*=\s*["']https?:/i, "external src"],
    [/href\s*=\s*["']https?:/i, "external href"],
  ];
  for (const [pat, label] of networkPatterns) {
    if (pat.test(html)) {
      errors.push(`Akses jaringan terdeteksi: ${label}`);
    }
  }

  // Dilarang: storage
  const storagePatterns: [RegExp, string][] = [
    [/\blocalStorage\b/i, "localStorage"],
    [/\bsessionStorage\b/i, "sessionStorage"],
    [/\bindexedDB\b/i, "indexedDB"],
  ];
  for (const [pat, label] of storagePatterns) {
    if (pat.test(html)) {
      errors.push(`Akses storage terdeteksi: ${label}`);
    }
  }

  // Dilarang: dialog
  const dialogPatterns: [RegExp, string][] = [
    [/\balert\s*\(/i, "alert()"],
    [/\bconfirm\s*\(/i, "confirm()"],
    [/\bprompt\s*\(/i, "prompt()"],
  ];
  for (const [pat, label] of dialogPatterns) {
    if (pat.test(html)) {
      errors.push(`Dialog terdeteksi: ${label}`);
    }
  }

  return errors;
}
