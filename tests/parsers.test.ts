import { describe, it, expect } from "vitest";
import { cleanMarkdownLinks, cleanValue, cleanParsedValue, extractThumbnailData, extractTitles, cleanNarasiForTts, parseScenes, extractThreeTierSeo } from "@/lib/parsers";

describe("parsers", () => {
  describe("cleanMarkdownLinks", () => {
    it("converts markdown link syntax to raw URL", () => {
      const input = "Check this [OpenAI](https://openai.com) and [Google](https://google.com)";
      expect(cleanMarkdownLinks(input)).toBe("Check this https://openai.com and https://google.com");
    });

    it("handles empty strings", () => {
      expect(cleanMarkdownLinks("")).toBe("");
    });
  });

  describe("cleanValue", () => {
    it("strips wrapping square brackets and double quotes", () => {
      expect(cleanValue("[Some Bracketed Value]")).toBe("Some Bracketed Value");
      expect(cleanValue('"Some Quoted Value"')).toBe("Some Quoted Value");
      expect(cleanValue("  Plain Value  ")).toBe("Plain Value");
    });
  });

  describe("cleanParsedValue", () => {
    it("strips trailing horizontal rules, colons, asterisks, and whitespace", () => {
      expect(cleanParsedValue("**Section Title:**\n---")).toBe("Section Title");
      expect(cleanParsedValue(": Value with colon :")).toBe("Value with colon");
      expect(cleanParsedValue("")).toBe("");
    });
  });

  describe("extractThumbnailData", () => {
    it("returns null when no thumbnail header exists", () => {
      expect(extractThumbnailData("Just a plain script with pure narrative content.")).toBeNull();
    });

    it("parses structured thumbnail section", () => {
      const sample = `
## THUMBNAIL STUDIO
TEKS OVERLAY SEO: Rahasia Prompt AI
OPSI 1 PROMPT: Futuristic cyberpunk desk with neon lights
OPSI 1 TEKS OVERLAY: AI Mengubah Semuanya!
OPSI 2 PROMPT: Minimalist aesthetic workspace
OPSI 2 TEKS OVERLAY: Jangan Terlewat
REKOMENDASI: Gunakan warna kontras tinggi.
      `;
      const result = extractThumbnailData(sample);
      expect(result).not.toBeNull();
      expect(result?.seoText).toBe("Rahasia Prompt AI");
      expect(result?.opsi1Prompt).toBe("Futuristic cyberpunk desk with neon lights");
      expect(result?.opsi1Overlay).toBe("AI Mengubah Semuanya!");
      expect(result?.opsi2Prompt).toBe("Minimalist aesthetic workspace");
      expect(result?.opsi2Overlay).toBe("Jangan Terlewat");
    });
  });

  describe("extractTitles", () => {
    it("extracts clean titles without fake viral percentages or metadata lines", () => {
      const output = `
# TAHAP 1: 10 IDE JUDUL & RISET
JUDUL 1: "Cara Bikin Video AI 2026 yang Menghasilkan"
FORMAT HOOK: Curiosity Gap
TARGET AUDIENS: Konten Kreator Pemula
ALASAN POTENSI: Topik AI video sedang trending dengan search demand tinggi

JUDUL 2: "Rahasia Prompt Generator yang Jarang Diketahui"
FORMAT HOOK: Negative Twist
TARGET AUDIENS: Digital Marketer
ALASAN POTENSI: Membuka rahasia yang memicu rasa ingin tahu audiens

JUDUL 3: "5 Tool AI Gratis untuk Mengubah Konten Anda"
FORMAT HOOK: Listicle
TARGET AUDIENS: Freelancer
ALASAN POTENSI: Memberikan solusi langsung dan aplikatif
      `;
      const titles = extractTitles(output);
      expect(titles).toHaveLength(3);
      expect(titles[0]).toBe("Cara Bikin Video AI 2026 yang Menghasilkan");
      expect(titles[1]).toBe("Rahasia Prompt Generator yang Jarang Diketahui");
      expect(titles[2]).toBe("5 Tool AI Gratis untuk Mengubah Konten Anda");
      // Verify no metadata lines leaked into titles
      expect(titles.some((t) => t.includes("FORMAT HOOK"))).toBe(false);
      expect(titles.some((t) => t.includes("ALASAN POTENSI"))).toBe(false);
      expect(titles.some((t) => t.includes("%"))).toBe(false);
    });

    it("cleans legacy percentage notation if encountered", () => {
      const legacyOutput = `
# VARIASI JUDUL
1. "Trik Video AI Otomatis" (95%)
2. "Bongkar Algoritma Reels" (88%)
      `;
      const titles = extractTitles(legacyOutput);
      expect(titles).toHaveLength(2);
      expect(titles[0]).toBe("Trik Video AI Otomatis");
      expect(titles[1]).toBe("Bongkar Algoritma Reels");
    });
  });

  describe("cleanNarasiForTts", () => {
    it("strips acting notes in parentheses and sound effect brackets", () => {
      const rawNarration = "(berbisik antusias) Coba bayangkan [SFX: Whoosh], dalam 3 detik hidupmu berubah total! (tersenyum mantap)";
      const cleaned = cleanNarasiForTts(rawNarration);
      expect(cleaned).toBe("Coba bayangkan, dalam 3 detik hidupmu berubah total!");
      expect(cleaned).not.toContain("berbisik");
      expect(cleaned).not.toContain("SFX");
      expect(cleaned).not.toContain("tersenyum");
    });

    it("handles plain text without modifications", () => {
      expect(cleanNarasiForTts("Ini narasi biasa tanpa instruksi sutradara.")).toBe("Ini narasi biasa tanpa instruksi sutradara.");
    });
  });

  describe("parseScenes with YouTube 2026 VET emotion and pacing", () => {
    it("parses TARGET EMOSI and TEKNIK PACING from scene blocks", () => {
      const script = `
=== SCENE 1 ===
DURASI: 00:00 - 00:05
TARGET EMOSI: Penasaran Ekstrem (Curiosity Gap)
TEKNIK PACING: Hook Cepat Staccato (0-3s Value Promise)
TEKS OVERLAY: Jangan Lakukan Ini di 2026!
VISUAL: Extreme close-up of a high-tech robotic iris focusing with neon cyan reflections
NARASI: (berbisik tegang) Kamu masih pakai cara lama ini? [SFX: Tension riser]

=== SCENE 2 ===
DURASI: 00:05 - 00:15
TARGET EMOSI: Validasi Masalah & Empati
TEKNIK PACING: Ritme Sedang Penjelasan
TEKS OVERLAY: Solusi Sebenarnya
VISUAL: Wide shot showing split screen of old manual methods vs automated neural engine
NARASI: Faktanya, 90% kreator pemula gagal karena melupakan langkah krusial ini.
      `;

      const scenes = parseScenes(script);
      expect(scenes).toHaveLength(2);
      expect(scenes[0].targetEmosi).toBe("Penasaran Ekstrem (Curiosity Gap)");
      expect(scenes[0].teknikPacing).toBe("Hook Cepat Staccato (0-3s Value Promise)");
      expect(scenes[0].teksOverlay).toBe("Jangan Lakukan Ini di 2026!");
      expect(scenes[1].targetEmosi).toBe("Validasi Masalah & Empati");
      expect(scenes[1].teknikPacing).toBe("Ritme Sedang Penjelasan");
    });
  });

  describe("extractThreeTierSeo", () => {
    it("extracts 3-tier tags, narrative description, and upload checklist", () => {
      const output = `
## METADATA SEO YOUTUBE 2026
TAG SPESIFIK: #PromptGen, #GeminiTTS, #YouTubeStrategy2026
TAG UMUM: #VideoEditing, #ContentCreator, #DigitalMarketing, #YouTubeGrowth
TAG MAJEMUK (LONG-TAIL): Cara membuat naskah youtube otomatis, strategi algoritma youtube 2026, optimasi retensi video shorts
DESKRIPSI YOUTUBE (SEO & EMPATI):
Pernahkah kamu merasa video yang kamu buat dengan susah payah sepi penonton? Di video ini, kita membedah arsitektur retensi YouTube 2026 secara tuntas.

Dapatkan rahasia hook 3 detik pertama dan formula thumbnail anti-gagal di sini!

CHECKLIST KESIAPAN AKHIR:
- [ ] Hook 3 detik pertama telah menyampaikan Janji Nilai yang kuat
- [ ] Teks thumbnail 1-3 kata dengan ekspresi wajah dominan 60-80%
- [ ] Audio telah diberi efek Fade-in dan Fade-out halus
      `;

      const seo = extractThreeTierSeo(output);
      expect(seo).not.toBeNull();
      expect(seo?.tagSpesifik).toContain("#PromptGen");
      expect(seo?.tagUmum).toContain("#VideoEditing");
      expect(seo?.tagMajemuk).toContain("Cara membuat naskah youtube otomatis");
      expect(seo?.deskripsi).toContain("Pernahkah kamu merasa video");
      expect(seo?.checklist.length).toBeGreaterThanOrEqual(3);
      expect(seo?.checklist[0]).toContain("Janji Nilai");
    });
  });
});
