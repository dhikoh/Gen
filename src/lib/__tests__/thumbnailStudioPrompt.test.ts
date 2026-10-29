import { describe, it, expect } from "vitest";
import {
  buildThumbnailStudioPromptSection,
  generateMasterPrompt,
  type ProfileChannelData,
  type VideoConfigData,
} from "@/lib/promptGenerator";
import { extractThumbnailData } from "@/lib/parsers";

describe("Thumbnail Studio High-CTR & In-Image Typography Engine", () => {
  const dummyChannel: ProfileChannelData = {
    channelName: "Organictopia",
    niche: "Urban Gardening & Botany",
    description: "Home Gardeners & Plant Enthusiasts",
    visualAesthetic: "Lush Organic Cinematic",
    audioVO: true,
  };

  describe("buildThumbnailStudioPromptSection", () => {
    it("generates anti-literal curiosity gap warning for preset 'anti_gagal'", () => {
      const config: VideoConfigData = {
        aspectRatio: "9:16",
        thumbnailStylePreset: "anti_gagal",
        thumbnailFaceDominance: true,
      };

      const result = buildThumbnailStudioPromptSection(config, false);

      expect(result).toContain("## THUMBNAIL STUDIO");
      expect(result).toContain("PANDUAN STRATEGI THUMBNAIL & TIPOGRAFI HIGH-CTR 2026");
      expect(result).toContain("DILARANG KERAS hanya menulis kata template mentah \"ANTI GAGAL\"!");
      expect(result).toContain("JANGAN DISIRAM!");
      expect(result).toContain("TERNYATA SALAH?!");
      expect(result).toContain("KLAUSUL TIPOGRAFI TERSEMAT (IN-IMAGE TYPOGRAPHY CLAUSE)");
      expect(result).toContain("featuring bold stylized 3D typography text reading \"[TEKS OVERLAY]\"");
      expect(result).toContain("--ar 9:16");
    });

    it("generates shocking fact formula for preset 'gila' with anti-literal guard", () => {
      const config: VideoConfigData = {
        aspectRatio: "9:16",
        thumbnailStylePreset: "gila",
        thumbnailFaceDominance: true,
      };

      const result = buildThumbnailStudioPromptSection(config, false);

      expect(result).toContain("DILARANG KERAS hanya menulis kata template mentah \"GILA!\"!");
      expect(result).toContain("HANCUR TOTAL?!");
      expect(result).toContain("BAHAYA BESAR!");
      expect(result).toContain("GAK MASUK AKAL!");
    });

    it("generates simplicity shortcuts for preset '3_langkah'", () => {
      const config: VideoConfigData = {
        aspectRatio: "9:16",
        thumbnailStylePreset: "3_langkah",
        thumbnailFaceDominance: true,
      };

      const result = buildThumbnailStudioPromptSection(config, false);

      expect(result).toContain("DILARANG KERAS hanya menulis kata template mentah \"3 LANGKAH SAJA\"!");
      expect(result).toContain("CUMA 1 MENIT!");
      expect(result).toContain("TRIK CEPAT INI");
    });

    it("generates victory formula for preset 'booyah'", () => {
      const config: VideoConfigData = {
        aspectRatio: "9:16",
        thumbnailStylePreset: "booyah",
        thumbnailFaceDominance: true,
      };

      const result = buildThumbnailStudioPromptSection(config, false);

      expect(result).toContain("DILARANG KERAS hanya menulis kata template mentah \"BOOYAH!\"!");
      expect(result).toContain("HASILNYA MELEDAK!");
      expect(result).toContain("TEMBUS 100X!");
    });

    it("generates open loop mystery formula for preset 'kaget'", () => {
      const config: VideoConfigData = {
        aspectRatio: "9:16",
        thumbnailStylePreset: "kaget",
        thumbnailFaceDominance: true,
      };

      const result = buildThumbnailStudioPromptSection(config, false);

      expect(result).toContain("DILARANG KERAS hanya menulis kata template mentah \"KAGET!\"!");
      expect(result).toContain("SIAPA SANGKA?!");
      expect(result).toContain("KORBAN BERIKUTNYA?");
    });

    it("switches to dramatic focal object when thumbnailFaceDominance is false", () => {
      const config: VideoConfigData = {
        aspectRatio: "16:9",
        thumbnailStylePreset: "anti_gagal",
        thumbnailFaceDominance: false,
      };

      const result = buildThumbnailStudioPromptSection(config, false);

      expect(result).toContain("Primary dramatic focal object with high-contrast scale, extreme transformation or glowing anomaly filling 60–80% of the frame");
      expect(result).not.toContain("intense, hyper-expressive emotional facial expression");
      expect(result).toContain("--ar 16:9");
    });

    it("applies 16:9 aspect ratio in Funnel Pack long pillar mode", () => {
      const config: VideoConfigData = {
        aspectRatio: "9:16", // Global is 9:16, but Funnel Pillar is 16:9
        thumbnailStylePreset: "anti_gagal",
        thumbnailFaceDominance: true,
      };

      const result = buildThumbnailStudioPromptSection(config, true);

      expect(result).toContain("--ar 16:9");
    });
  });

  describe("generateMasterPrompt integration", () => {
    it("injects enhanced thumbnail studio when thumbnailIdea is true", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Rahasia Akar Tanaman Subur",
        "Eksperimen pot kaca",
        {
          targetPlatform: "TIKTOK",
          aspectRatio: "9:16",
          thumbnailIdea: true,
          thumbnailStylePreset: "anti_gagal",
          thumbnailFaceDominance: true,
        }
      );

      expect(masterPrompt).toContain("## THUMBNAIL STUDIO");
      expect(masterPrompt).toContain("KLAUSUL TIPOGRAFI TERSEMAT (IN-IMAGE TYPOGRAPHY CLAUSE)");
      expect(masterPrompt).toContain("DILARANG KERAS hanya menulis kata template mentah \"ANTI GAGAL\"!");
      expect(masterPrompt).toContain("TEKS OVERLAY SEO: [Teks hook utama 2-4 kata huruf kapital tebal");
    });

    it("omits thumbnail studio when thumbnailIdea is false", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Video Tanpa Thumbnail",
        "",
        {
          targetPlatform: "TIKTOK",
          aspectRatio: "9:16",
          thumbnailIdea: false,
          selectedSections: ["HOOK", "SCENE", "CTA"],
        }
      );

      expect(masterPrompt).not.toContain("## THUMBNAIL STUDIO");
    });
  });

  describe("Parser compatibility", () => {
    it("correctly extracts structured thumbnail data from output containing in-image typography clauses", () => {
      const rawAiOutput = `
## THUMBNAIL STUDIO
TEKS OVERLAY SEO: JANGAN DISIRAM!
OPSI 1 PROMPT: Close-up shot, an intensely shocked botanist holding a vibrant glass cutaway pot with glowing roots, featuring bold stylized 3D typography text reading "JANGAN DISIRAM!" seamlessly rendered in the left third negative space, vibrant high-contrast yellow with volumetric rim lighting --ar 9:16
OPSI 1 TEKS OVERLAY: JANGAN DISIRAM!
OPSI 2 PROMPT: Extreme close-up split composition of dying plant vs lush exploding planter, featuring bold stylized 3D typography text reading "TERNYATA SALAH?!" seamlessly rendered in the upper-left negative space --ar 9:16
OPSI 2 TEKS OVERLAY: TERNYATA SALAH?!
REKOMENDASI WARNA & ELEMEN: Teks kuning neon dengan outline hitam tebal di area 1/3 kiri.
`;

      const parsed = extractThumbnailData(rawAiOutput);

      expect(parsed).not.toBeNull();
      expect(parsed?.seoText).toBe("JANGAN DISIRAM!");
      expect(parsed?.opsi1Overlay).toBe("JANGAN DISIRAM!");
      expect(parsed?.opsi1Prompt).toContain("featuring bold stylized 3D typography text reading \"JANGAN DISIRAM!\"");
      expect(parsed?.opsi2Overlay).toBe("TERNYATA SALAH?!");
      expect(parsed?.opsi2Prompt).toContain("featuring bold stylized 3D typography text reading \"TERNYATA SALAH?!\"");
      expect(parsed?.recommendations).toContain("Teks kuning neon dengan outline hitam tebal");
    });
  });
});
