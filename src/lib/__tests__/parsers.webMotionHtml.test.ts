import { describe, expect, it } from "vitest";
import { extractWebMotionHtml, parseScenes } from "@/lib/parsers";

describe("extractWebMotionHtml & Web Motion Scene Boundary", () => {
  const sampleMotionHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Motion Explainer</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <style>
    body { margin: 0; background: #0b0f19; overflow: hidden; font-family: sans-serif; }
    #stage { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
    #world { position: relative; width: 1080px; height: 1920px; }
    .hero-title { font-size: 64px; color: #fff; font-weight: 800; }
  </style>
</head>
<body>
  <div id="stage"><div id="world"><h1 class="hero-title">SaaS Explainer</h1></div></div>
  <script>
    const tl = gsap.timeline();
    tl.from(".hero-title", { opacity: 0, scale: 0.8, duration: 0.6, ease: "power3.out" });
  </script>
</body>
</html>`;

  it("berhasil mengekstrak kode HTML5 lengkap dari fenced code block ```html ... ```", () => {
    const rawAiOutput = `Berikut adalah naskah dan kode animasi Web Motion:

## SCENE 1
KONTEKS SCENE: Pembuka visual explainer
NARASI: Pernahkah kamu membayangkan cloud database masa depan?
PERGERAKAN KAMERA (#world): Dolly in scale 1.0 ke 1.15, koordinat (0, 0)
KOMPONEN GRAFIS & ANIMASI: Dark glowing cards, isometric grid, neon badge
DURASI: 5 detik

[KODE WEB MOTION LENGKAP (STANDALONE HTML5 + GSAP)]
\`\`\`html
${sampleMotionHtml}
\`\`\`

Catatan tambahan dari AI: Jalankan file ini langsung di browser.`;

    const extracted = extractWebMotionHtml(rawAiOutput);
    expect(extracted).not.toBeNull();
    expect(extracted).toContain("<!DOCTYPE html>");
    expect(extracted).toContain("gsap.min.js");
    expect(extracted).toContain("hero-title");
    expect(extracted).toContain("</html>");
  });

  it("berhasil mengekstrak kode dengan header fallback tanpa backtick", () => {
    const rawAiOutput = `Naskah selesai.

KODE WEB MOTION LENGKAP:
${sampleMotionHtml}
`;

    const extracted = extractWebMotionHtml(rawAiOutput);
    expect(extracted).not.toBeNull();
    expect(extracted).toContain("<!DOCTYPE html>");
    expect(extracted).toContain("</html>");
  });

  it("mengembalikan null jika tidak ada kode HTML valid", () => {
    const rawAiOutput = `Hanya naskah video biasa tanpa ada kode pemrograman.
## SCENE 1
NARASI: Halo dunia!
VISUAL PROMPT: Cinematic forest
DURASI: 5 detik`;

    const extracted = extractWebMotionHtml(rawAiOutput);
    expect(extracted).toBeNull();
  });

  it("memastikan parseScenes tidak menyerap kode HTML ke dalam visualPrompt adegan terakhir (Stop Boundary)", () => {
    const rawAiOutput = `## SCENE 1
KONTEKS SCENE: Pengantar
NARASI: Selamat datang di era baru.
PERGERAKAN KAMERA (#world): Pan slow right
KOMPONEN GRAFIS & ANIMASI: Logo animate in, glowing horizon background
DURASI: 4 detik

## SCENE 2
KONTEKS SCENE: Penutup
NARASI: Coba sekarang juga gratis.
PERGERAKAN KAMERA (#world): Settle center, scale 1.0
KOMPONEN GRAFIS & ANIMASI: Floating CTA button, badge pulse
DURASI: 3 detik

[KODE WEB MOTION LENGKAP (STANDALONE HTML5 + GSAP)]
\`\`\`html
${sampleMotionHtml}
\`\`\``;

    const scenes = parseScenes(rawAiOutput);
    expect(scenes).toHaveLength(2);

    const scene2 = scenes[1];
    expect(scene2.narasi).toBe("Coba sekarang juga gratis.");
    expect(scene2.settingKamera).toBe("Settle center, scale 1.0");
    expect(scene2.visual).toBe("Floating CTA button, badge pulse");

    // Pastikan kode HTML tidak bocor ke dalam visual scene 2
    expect(scene2.visual).not.toContain("<!DOCTYPE html>");
    expect(scene2.visual).not.toContain("gsap.min.js");
    expect(scene2.visual).not.toContain("</html>");
  });
});
