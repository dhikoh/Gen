import { describe, it, expect } from "vitest";
import { cleanMarkdownLinks, cleanValue, cleanParsedValue, extractThumbnailData } from "@/lib/parsers";

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
});
