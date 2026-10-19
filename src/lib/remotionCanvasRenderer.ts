import {
  SAFE_ZONES,
  THEME_STYLES,
  getRemotionDimensions,
  type PlannedScene,
  type RemotionPlan,
  type RemotionPromptOptions,
} from "@/lib/remotionPromptBuilder";

/** Regex yang mengenali warna valid untuk canvas. */
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_FUNCTION = /^(?:rgb|hsl)a?\([\s\S]*\)$/i;

function isCanvasColor(value: string): boolean {
  return HEX_COLOR.test(value) || COLOR_FUNCTION.test(value);
}

/**
 * Ambil warna pertama dan kedua dari string linear-gradient CSS.
 * Contoh yang didukung: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)".
 * Mengembalikan null bila bukan gradien dua warna.
 */
export function parseGradientColors(bg: string): [string, string] | null {
  const marker = "linear-gradient(";
  const start = bg.indexOf(marker);
  if (start === -1) return null;

  const open = start + marker.length;
  const close = bg.lastIndexOf(")");
  if (close <= open) return null;

  // Pecah isi gradien pada koma yang berada di kedalaman kurung 0,
  // sehingga "rgb(15, 23, 42)" tidak ikut terpotong.
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of bg.slice(open, close)) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);

  const colors: string[] = [];
  for (const part of parts) {
    const stop = part.trim();
    if (!stop) continue;
    if (stop.startsWith("#")) {
      const token = stop.split(/\s+/)[0] ?? "";
      if (HEX_COLOR.test(token)) colors.push(token);
      continue;
    }
    const fn = stop.match(/^(?:rgb|hsl)a?\([\s\S]*?\)/);
    if (fn) {
      colors.push(fn[0]);
      continue;
    }
    const token = stop.split(/\s+/)[0] ?? "";
    if (isCanvasColor(token)) colors.push(token);
    if (colors.length >= 2) break;
  }

  return colors.length >= 2 ? [colors[0] as string, colors[1] as string] : null;
}

/**
 * Bungkus teks ke beberapa baris agar pas dengan lebar maksimum canvas.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  if (words.length === 0 || text.trim().length === 0) return [];

  const lines: string[] = [];
  let currentLine = words[0] ?? "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i] ?? "";
    const testLine = currentLine + " " + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Cari scene aktif pada frame tertentu.
 */
export function getSceneAtFrame(
  plan: RemotionPlan,
  frame: number,
): { scene: PlannedScene; localFrame: number } | null {
  if (plan.scenes.length === 0) return null;

  for (const s of plan.scenes) {
    if (frame >= s.from && frame < s.from + s.durationInFrames) {
      return { scene: s, localFrame: frame - s.from };
    }
  }

  // Jika di luar range (mis. frame terakhir), kembalikan scene terakhir
  if (frame >= plan.totalFrames && plan.scenes.length > 0) {
    const last = plan.scenes[plan.scenes.length - 1];
    if (last !== undefined) {
      return { scene: last, localFrame: last.durationInFrames };
    }
  }

  const first = plan.scenes[0];
  return first !== undefined ? { scene: first, localFrame: 0 } : null;
}

/**
 * Gambar satu frame Remotion ke dalam 2D Canvas Context secara deterministik.
 */
export function renderRemotionFrame(
  ctx: CanvasRenderingContext2D,
  plan: RemotionPlan,
  options: RemotionPromptOptions,
  frame: number,
): void {
  const { width, height } = getRemotionDimensions(options.aspectRatio);
  const zone = SAFE_ZONES[options.aspectRatio];
  const theme = THEME_STYLES[options.theme];
  const fontSize = options.aspectRatio === "9:16" ? 64 : 76;
  const lineHeight = fontSize * 1.2;

  ctx.save();

  // 1. Gambar Background
  const gradient = parseGradientColors(theme.background);
  if (gradient !== null) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, gradient[0]);
    grad.addColorStop(1, gradient[1]);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = theme.background;
  }
  ctx.fillRect(0, 0, width, height);

  // 2. Dapatkan Scene Aktif
  const active = getSceneAtFrame(plan, frame);
  if (active === null) {
    ctx.restore();
    return;
  }

  const { scene, localFrame } = active;

  // 3. Hitung Animasi Fade Guard
  const FADE_FRAMES = 12;
  const fade = Math.min(FADE_FRAMES, Math.floor((scene.durationInFrames - 1) / 2));
  let opacity = 1;
  if (fade > 0) {
    if (localFrame < fade) {
      opacity = localFrame / fade;
    } else if (localFrame > scene.durationInFrames - fade) {
      opacity = Math.max(0, (scene.durationInFrames - localFrame) / fade);
    }
  }
  opacity = Math.max(0, Math.min(1, opacity));

  // 4. Hitung Spring Entrance Animasi
  const ENTRANCE_DELAY_FRAMES = 4;
  const delayedFrame = Math.max(0, localFrame - ENTRANCE_DELAY_FRAMES);
  const springProgress = Math.min(1, Math.max(0, 1 - Math.exp(-delayedFrame * 0.28)));
  const translateY = (1 - springProgress) * 40; // 40px slide-up

  ctx.globalAlpha = opacity;

  // 5. Layout Konten Teks di dalam Safe Zone
  const availableWidth = width - zone.left - zone.right;
  const textRaw = scene.textOverlay || scene.narration || "";
  const textContent =
    theme.textTransform === "uppercase" ? textRaw.toUpperCase() : textRaw;

  ctx.font = `${theme.fontWeight} ${fontSize}px ${theme.fontFamily}`;
  const lines = wrapText(ctx, textContent, availableWidth);

  const accentBarWidth = 120;
  const accentBarHeight = 8;
  const accentBarMargin = 32;
  const totalContentHeight =
    accentBarHeight + accentBarMargin + lines.length * lineHeight;

  // Vertically centered within safe zone
  const safeAvailableHeight = height - zone.top - zone.bottom;
  const startY =
    zone.top + (safeAvailableHeight - totalContentHeight) / 2 + translateY;
  const startX = zone.left;

  // 6. Gambar Accent Bar
  ctx.fillStyle = theme.accentColor;
  ctx.fillRect(startX, startY, accentBarWidth, accentBarHeight);

  // 7. Gambar Teks Baris demi Baris
  ctx.fillStyle = theme.textColor;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  const textStartY = startY + accentBarHeight + accentBarMargin;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    ctx.fillText(line, startX, textStartY + i * lineHeight);
  }

  ctx.restore();
}
