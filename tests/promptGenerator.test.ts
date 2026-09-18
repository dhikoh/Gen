import { describe, it, expect } from "vitest";
import { generateMasterPrompt } from "@/lib/promptGenerator";

describe("promptGenerator", () => {
  const dummyChannel = {
    id: "chan-1",
    channelName: "Tech Insights ID",
    niche: "Artificial Intelligence",
    targetAudience: "Tech Enthusiasts & Creators",
    visualAesthetic: "Modern Cyberpunk Dark",
    audioVO: true,
    toneAndVoice: "Edukatif & Bersemangat",
  };

  describe("Tahap 1: Elimination of fake viral percentages", () => {
    it("instructs qualitative potential reasons and contains NO '(Potensi Viral: %)' format", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Prompt AI 2026",
        "",
        {
          targetPlatform: "TIKTOK",
          aspectRatio: "9:16",
        }
      );

      // Must NOT contain fake viral percentage instructions
      expect(masterPrompt).not.toContain("(Potensi Viral: %)");
      expect(masterPrompt).not.toContain("Potensi Viral: [angka]% - [alasan]");

      // Must contain qualitative reason instruction
      expect(masterPrompt).toContain("Alasan Potensi:");
      expect(masterPrompt).toContain("curiosity gap, relevansi tren, emosi spesifik");
      expect(masterPrompt).toContain("TANPA mencantumkan angka persentase palsu");
    });
  });

  describe("Platform Algorithm Guide", () => {
    it("injects TikTok specific algorithm guide (retention curve, rewatch loops)", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Video TikTok AI",
        "",
        {
          targetPlatform: "TIKTOK",
          aspectRatio: "9:16",
        }
      );

      expect(masterPrompt).toContain("[STRATEGI ALGORITMA PLATFORM: TIKTOK]");
      expect(masterPrompt).toContain("Rewatch Loop");
      expect(masterPrompt).toContain("Psychological Retention Loop");
    });

    it("injects Instagram Reels specific algorithm guide (shareability & saveability)", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Reels Aesthetic",
        "",
        {
          targetPlatform: "INSTAGRAM_REELS",
          aspectRatio: "9:16",
        }
      );

      expect(masterPrompt).toContain("[STRATEGI ALGORITMA PLATFORM: INSTAGRAM REELS]");
      expect(masterPrompt).toContain("Shareability");
      expect(masterPrompt).toContain("Saveability");
      expect(masterPrompt).toContain("direct message (DM)");
    });

    it("injects YouTube Shorts specific algorithm guide (APV retention & subtle climax CTA)", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Shorts AI",
        "",
        {
          targetPlatform: "YOUTUBE_SHORTS",
          aspectRatio: "9:16",
        }
      );

      expect(masterPrompt).toContain("[STRATEGI ALGORITMA PLATFORM: YOUTUBE SHORTS]");
      expect(masterPrompt).toContain("Audience Retention Curve");
      expect(masterPrompt).toContain("Subtle Climax CTA");
    });

    it("allows admin settings to override platform algorithm guide", () => {
      const customGuide = {
        TIKTOK: "Custom TikTok Algorithm Directive: Focus on instant humor and beat drops.",
      };

      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Custom Platform Test",
        "",
        {
          targetPlatform: "TIKTOK",
          aspectRatio: "9:16",
        },
        {
          platformAlgorithmGuide: customGuide,
        }
      );

      expect(masterPrompt).toContain("Custom TikTok Algorithm Directive: Focus on instant humor and beat drops.");
    });
  });

  describe("Trending Audio / Sound Input", () => {
    it("injects trendingAudio into Audio guidelines and Voice-over cues when provided", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Tren Viral",
        "",
        {
          targetPlatform: "TIKTOK",
          aspectRatio: "9:16",
          trendingAudio: "DJ Gamon Viral TikTok 2026 - Bass Boosted",
        }
      );

      expect(masterPrompt).toContain("[PANDUAN AUDIO, SFX & BGM]");
      expect(masterPrompt).toContain("DJ Gamon Viral TikTok 2026 - Bass Boosted");
      expect(masterPrompt).toContain("tempo & mood audio tren");
      expect(masterPrompt).toContain("ketukan beat audio tersebut");
    });

    it("does not inject trending sound line when trendingAudio is omitted or empty", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Video Standar",
        "",
        {
          targetPlatform: "TIKTOK",
          aspectRatio: "9:16",
        }
      );

      expect(masterPrompt).not.toContain("SOUND / AUDIO TREN:");
    });
  });

  describe("Closed-Loop Performance Insights", () => {
    it("injects top performing drafts insight when topPerformers array is provided", () => {
      const topPerformers = [
        {
          id: "draft-1",
          title: "Cara Rahasia Dapat 100K Views",
          views: 125000,
          retentionPct: 82.5,
          likes: 8900,
          hookText: "Jangan scroll dulu kalau kamu mau tahu cara AI mengubah hidupku dalam 7 hari.",
          toneOfVoice: "Edukatif & Cepat",
          targetKeywords: ["ai video", "trik viral"],
        },
        {
          id: "draft-2",
          title: "Stop Bikin Video AI Seperti Ini!",
          views: 64000,
          retentionPct: 75.0,
          likes: 4200,
          hookText: "99% orang salah menggunakan prompt ini.",
          toneOfVoice: "Tegas & Kontras",
          targetKeywords: ["prompt ai"],
        },
      ];

      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Video Baru",
        "",
        {
          targetPlatform: "TIKTOK",
          aspectRatio: "9:16",
        },
        null,
        [],
        null,
        topPerformers
      );

      expect(masterPrompt).toContain("[PEMBELAJARAN DARI KONTEN TERBAIK CHANNEL INI (CLOSED-LOOP INSIGHT)]");
      expect(masterPrompt).toContain("Cara Rahasia Dapat 100K Views");
      expect(masterPrompt).toContain("Views");
      expect(masterPrompt).toContain("82.5% Retensi");
      expect(masterPrompt).toContain("Jangan scroll dulu kalau kamu mau tahu cara AI");
      expect(masterPrompt).toContain("Pola Hook Pembuka yang Sukses:");
    });

    it("omits the closed-loop section when topPerformers is empty or null", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Video Baru",
        "",
        {
          targetPlatform: "TIKTOK",
          aspectRatio: "9:16",
        },
        null,
        [],
        null,
        []
      );

      expect(masterPrompt).not.toContain("[PEMBELAJARAN DARI KONTEN TERBAIK CHANNEL INI (CLOSED-LOOP INSIGHT)]");
    });
  });
});
