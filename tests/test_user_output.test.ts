import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  parseScenes,
  extractWebMotionHtml,
  extractRemotionCode,
  extractThreeTierSeo,
  extractCaption,
  extractHashtags,
  cleanNarasiForTts,
} from "@/lib/parsers";

describe("Pengujian Mendalam Parse Engine terhadap Output AI User (Rhizophagy Cycle)", () => {
  const samplePath = path.resolve(__dirname, "./fixtures/sample_rhizophagy_output.txt");
  const sampleText = fs.readFileSync(samplePath, "utf-8");

  it("1. Ekstraksi Web Motion HTML mandiri secara presisi", () => {
    const webMotionHtml = extractWebMotionHtml(sampleText);
    expect(webMotionHtml).not.toBeNull();
    const html = webMotionHtml as string;

    // Harus berupa dokumen HTML5 lengkap
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("</html>");
    expect(html.includes("cdn.jsdelivr.net") || html.includes("cdnjs.cloudflare.com")).toBe(true);
    expect(html).toContain('id="world"');
    expect(html).toContain("gsap.timeline");
  });

  it("2. extractRemotionCode TIDAK BOLEH mendeteksi dokumen HTML sebagai kode Remotion", () => {
    const remCode = extractRemotionCode(sampleText);
    expect(remCode).toBeNull();
  });

  it("3. Seluruh 13 Adegan berhasil di-parse tanpa kebocoran kode ke Scene 13", () => {
    const scenes = parseScenes(sampleText);
    expect(scenes).toHaveLength(13);

    // Verifikasi Adegan 1
    const s1 = scenes[0];
    expect(s1.sceneNumber).toBe("Scene 1");
    expect(s1.narasi).toContain("Think your organic garden is strictly vegan?");
    expect(s1.teksOverlay).toBe("PLANTS ARE CARNIVORES?!");
    expect(s1.settingKamera).toContain("Snap push-in from wide stage");
    expect(s1.visual).toContain("3D exploded root apex");
    expect(s1.ambientCues?.length).toBeGreaterThan(0);
    expect(s1.sfxCues?.length).toBeGreaterThan(0);

    // Verifikasi Adegan Terakhir (Scene 13) - Stop Boundary Check
    const s13 = scenes[12];
    expect(s13.sceneNumber).toBe("Scene 13");
    expect(s13.narasi).toContain("Check out the detailed research guide on the Organictopia blog!");
    expect(s13.visual).toContain("Blog guide link badge flashing softly");

    // STOP-BOUNDARY MUTLAK: Tidak boleh ada kode HTML di Scene 13
    expect(s13.narasi).not.toContain("<!DOCTYPE html>");
    expect(s13.narasi).not.toContain("<script");
    expect(s13.visual).not.toContain("<!DOCTYPE html>");
    expect(s13.visual).not.toContain("gsap.timeline");
  });

  it("4. Ekstraksi Metadata SEO & Caption multi-platform", () => {
    const seo = extractThreeTierSeo(sampleText);
    expect(seo).not.toBeNull();
    expect(seo?.tagSpesifik).toContain("rhizophagy cycle");
    expect(seo?.tagUmum).toContain("organic gardening");
    expect(seo?.tagMajemuk).toContain("how plants digest bacteria");
    expect(seo?.deskripsi).toContain("Rhizophagy Cycle");

    const caption = extractCaption(sampleText);
    expect(caption).toContain("Think your organic garden is strictly vegan?");

    const hashtags = extractHashtags(sampleText);
    expect(hashtags).toContain("#PlantScience");
  });

  it("5. TTS Narration Hygiene pada Scene 1", () => {
    const scenes = parseScenes(sampleText);
    const cleanTts = cleanNarasiForTts(scenes[0].narasi);

    // Tidak boleh mengandung tag bracket akting/ambient/sfx
    expect(cleanTts).not.toContain("[energetic");
    expect(cleanTts).not.toContain("[beat]");
    expect(cleanTts).not.toContain("[SFX:");
    expect(cleanTts).not.toContain("[AMBIENT:");
    expect(cleanTts).toContain("Think your organic garden is strictly vegan? Stop! Your plants might actually be ruthless carnivores hunting living prey.");
  });

  it("6. extractRemotionCode kebal terhadap kata 'composition' di dalam dokumen HTML", () => {
    const htmlWithComposition = `
Berikut rancangan animasi:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Beautiful visual composition using GSAP -->
  <style>
    .composition-layer { opacity: 1; }
  </style>
</head>
<body>
  <div class="composition-container">Halo Dunia</div>
  <script>
    const compositionSpeed = 1.5;
    console.log("Setting up camera composition");
  </script>
</body>
</html>
\`\`\`
`;
    expect(extractRemotionCode(htmlWithComposition)).toBeNull();
    expect(extractWebMotionHtml(htmlWithComposition)).toContain('class="composition-container"');
  });

  it("7. extractRemotionCode tetap mendeteksi komponen Remotion React/TSX secara akurat", () => {
    const validRemotion = `
\`\`\`tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <AbsoluteFill style={{ backgroundColor: 'black' }}>Frame: {frame}</AbsoluteFill>;
};
\`\`\`
`;
    const extracted = extractRemotionCode(validRemotion);
    expect(extracted).not.toBeNull();
    expect(extracted).toContain("import { AbsoluteFill");
    expect(extracted).toContain("useCurrentFrame()");
  });

  it("8. Verifikasi Iframe Sandbox ScenePromptStudioClient bebas dari allow-same-origin (mencegah sandbox escape)", () => {
    const studioClientPath = path.resolve(__dirname, "../src/app/[locale]/dashboard/scene-prompt/ScenePromptStudioClient.tsx");
    const content = fs.readFileSync(studioClientPath, "utf-8");

    // Baris iframe Web Motion live preview harus memiliki sandbox="allow-scripts" TANPA allow-same-origin
    const previewMatch = content.match(/title="Web Motion Live Preview"[\s\S]*?sandbox="([^"]+)"/);
    expect(previewMatch).not.toBeNull();
    const sandboxValue = previewMatch![1];
    expect(sandboxValue).toContain("allow-scripts");
    expect(sandboxValue).not.toContain("allow-same-origin");
  });

  it("9. Verifikasi CSP pada next.config.ts mengizinkan CDN GSAP (jsdelivr, cdnjs, unpkg)", () => {
    const nextConfigPath = path.resolve(__dirname, "../next.config.ts");
    const content = fs.readFileSync(nextConfigPath, "utf-8");

    expect(content).toContain("https://cdn.jsdelivr.net");
    expect(content).toContain("https://cdnjs.cloudflare.com");
    expect(content).toContain("https://unpkg.com");
    expect(content).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net");
  });
});
