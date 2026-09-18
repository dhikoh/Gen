import { describe, it, expect } from "vitest";
import { cleanMarkdownLinks, cleanValue, cleanParsedValue, extractThumbnailData, extractTitles } from "@/lib/parsers";

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
});
