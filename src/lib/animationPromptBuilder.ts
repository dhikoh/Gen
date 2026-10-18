import type { VideoTimeline } from "@/types/videoTimeline";
import { CANVAS_ID, DEFAULT_WIDTH, DEFAULT_HEIGHT, DEFAULT_FPS, ANIMATION_CONTRACT_VERSION } from "@/lib/animationContract";

/**
 * Bangun prompt yang diberikan ke AI eksternal untuk menghasilkan kode animasi HTML.
 *
 * Prompt ini berisi:
 * 1. Kontrak teknis (apa yang wajib dan dilarang).
 * 2. Timeline scene (nomor, durasi, narasi, visual prompt, overlay).
 * 3. Daftar judul terpakai (agar AI tidak membahas topik yang sama).
 * 4. Instruksi output (satu blok HTML).
 */
export function buildAnimationPrompt(
  timeline: VideoTimeline,
  opts?: {
    width?: number;
    height?: number;
    fps?: number;
    additionalInstructions?: string;
  }
): string {
  const w = opts?.width ?? DEFAULT_WIDTH;
  const h = opts?.height ?? DEFAULT_HEIGHT;
  const fps = opts?.fps ?? DEFAULT_FPS;

  const lines: string[] = [];

  // === HEADER ===
  lines.push("# INSTRUKSI PEMBUATAN KODE ANIMASI VIDEO");
  lines.push("");
  lines.push(`Contract Version: ${ANIMATION_CONTRACT_VERSION}`);
  lines.push(`Canvas: ${w}x${h} px, ${fps} FPS`);
  lines.push(`Canvas ID: "${CANVAS_ID}"`);
  lines.push(`Total Durasi: ${timeline.totalDurationSec} detik`);
  lines.push(`Jumlah Scene: ${timeline.scenes.length}`);
  lines.push("");

  // === KONTRAK WAJIB ===
  lines.push("## KONTRAK WAJIB (SEMUA POIN HARUS DIPENUHI)");
  lines.push("");
  lines.push("1. Output HANYA satu file HTML lengkap (dari <!DOCTYPE html> sampai </html>).");
  lines.push("2. Semua kode JavaScript di dalam <script> tag. Tidak ada file eksternal.");
  lines.push(`3. Canvas element: <canvas id="${CANVAS_ID}" width="${w}" height="${h}">.`);
  lines.push("4. Wajib menyediakan objek global window.__anim dengan:");
  lines.push("   - seek(timeSec): render frame pada waktu tertentu secara SINKRON.");
  lines.push("   - getDuration(): return total durasi dalam detik.");
  lines.push("   - getReadyPromise(): return Promise yang resolve saat siap.");
  lines.push("5. DILARANG: fetch(), XMLHttpRequest, WebSocket, import, CDN.");
  lines.push("6. DILARANG: localStorage, sessionStorage, IndexedDB.");
  lines.push("7. DILARANG: alert(), confirm(), prompt().");
  lines.push("8. DILARANG: requestAnimationFrame loop. Animasi dikontrol sepenuhnya via seek().");
  lines.push("9. Semua aset visual (warna, bentuk, teks) dibangun lewat Canvas 2D API.");
  lines.push("10. Teks narasi TIDAK ditampilkan di canvas (audio terpisah).");
  lines.push("11. Text overlay (jika ada) DITAMPILKAN di canvas sesuai timing.");
  lines.push("");

  // === TIMELINE SCENE ===
  lines.push("## TIMELINE SCENE");
  lines.push("");
  for (const scene of timeline.scenes) {
    lines.push(`### SCENE ${scene.sceneNumber}`);
    lines.push(`- Mulai: ${scene.startOffsetSec}s | Durasi: ${scene.durationSec}s`);
    lines.push(`- Visual: ${scene.visualPrompt || "(tidak ada)"}`);
    lines.push(`- Konteks: ${scene.sceneContext || "(tidak ada)"}`);
    if (scene.textOverlay) {
      lines.push(`- Text Overlay: "${scene.textOverlay}"`);
    }
    if (scene.chapterTitle) {
      lines.push(`- Bab: ${scene.chapterTitle}`);
    }
    lines.push("");
  }

  // === JUDUL TERPAKAI (BLACKLIST) ===
  if (timeline.usedTitleTexts && timeline.usedTitleTexts.length > 0) {
    lines.push("## JUDUL & TOPIK YANG SUDAH TERPAKAI (DILARANG DIBAHAS ULANG)");
    lines.push("");
    lines.push("Berikut daftar judul yang sudah pernah digunakan di channel ini.");
    lines.push("DILARANG membuat animasi yang membahas topik atau judul yang sama:");
    lines.push("");
    for (const title of timeline.usedTitleTexts) {
      lines.push(`- "${title}"`);
    }
    lines.push("");
  }

  // === INSTRUKSI TAMBAHAN ===
  if (opts?.additionalInstructions) {
    lines.push("## INSTRUKSI TAMBAHAN DARI KREATOR");
    lines.push("");
    lines.push(opts.additionalInstructions);
    lines.push("");
  }

  // === OUTPUT ===
  lines.push("## FORMAT OUTPUT");
  lines.push("");
  lines.push("Berikan HANYA kode HTML lengkap. Tidak ada penjelasan, tidak ada markdown.");
  lines.push("Mulai dengan <!DOCTYPE html> dan akhiri dengan </html>.");

  return lines.join("\n");
}
