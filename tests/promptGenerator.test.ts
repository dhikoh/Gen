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

  describe("Fix #71 & #72: Persona & POV Kreator, Negative CTA, and Directives", () => {
    it("injects Creator Persona & POV from videoConfig.pov", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Review Gadget Terbaru",
        "",
        {
          pov: "Energetic Reviewer (Review Produk)",
          targetPlatform: "TIKTOK",
        }
      );

      expect(masterPrompt).toContain('- Persona & Sudut Pandang Kreator: "Energetic Reviewer (Review Produk)"');
    });

    it("falls back to channel.personaPov when videoConfig.pov is missing", () => {
      const channelWithPersona = {
        ...dummyChannel,
        personaPov: "Expert Storyteller (Edukasi & Inspirasi)",
      };

      const { masterPrompt } = generateMasterPrompt(
        channelWithPersona,
        "Kisah Sukses",
        "",
        {
          targetPlatform: "TIKTOK",
        }
      );

      expect(masterPrompt).toContain('- Persona & Sudut Pandang Kreator: "Expert Storyteller (Edukasi & Inspirasi)"');
    });

    it("enforces negative CTA directive and blocks channel CTA when includeCTA is false", () => {
      const channelWithCTA = {
        ...dummyChannel,
        cta1: "Subscribe ke channel kami!",
        cta2: "Follow akun kami!",
      };

      const { masterPrompt } = generateMasterPrompt(
        channelWithCTA,
        "Topik Tanpa Promosi",
        "",
        {
          includeCTA: false,
          targetPlatform: "TIKTOK",
        }
      );

      expect(masterPrompt).toContain("[LARANGAN MUTLAK — CTA DINONAKTIFKAN OLEH USER]");
      expect(masterPrompt).not.toContain('Kalimat CTA Utama: "Subscribe ke channel kami!"');
      expect(masterPrompt).not.toContain('Kalimat CTA Alternatif: "Follow akun kami!"');
    });

    it("injects hookStyle and endingStyle directives correctly", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Rahasia Algoritma",
        "",
        {
          includeHook: true,
          includeCTA: true,
          hookStyle: "Fakta Mengejutkan",
          endingStyle: "Pertanyaan Terbuka",
          targetPlatform: "TIKTOK",
        }
      );

      expect(masterPrompt).toContain("[GAYA HOOK PEMBUKA — FAKTA MENGEJUTKAN]");
      expect(masterPrompt).toContain("[GAYA PENUTUP NASKAH — PERTANYAAN TERBUKA]");
    });
  });

  describe("Cognitive Priming & Material Deconstruction 2026", () => {
    it("instructs AI to deconstruct material/strategy before presenting titles in Tahap 1", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Rahasia Algoritma YouTube 2026",
        "Riset menunjukkan bahwa retensi 3 detik pertama menentukan APV",
        {
          targetPlatform: "YOUTUBE_SHORTS",
          aspectRatio: "9:16",
        }
      );

      expect(masterPrompt).toContain("TAHAP 1: Dekonstruksi Materi, Tampilkan Ide Konten & Tunggu Konfirmasi");
      expect(masterPrompt).toContain("[DEKONSTRUKSI MATERI & INTISARI STRATEGIS 2026]");
      expect(masterPrompt).toContain("Masalah Inti / Pain Point Audiens:");
      expect(masterPrompt).toContain("Transformasi & Janji Nilai 3 Detik (0-3s Value Promise):");
      expect(masterPrompt).toContain("Sudut Pandang Kontras / Angle Pembeda:");
      expect(masterPrompt).toContain("Berdasarkan hasil dekonstruksi materi di atas, lanjutkan dengan menyajikan tepat 10 ide judul");
    });

    it("instructs AI to deconstruct material even when title section is disabled", () => {
      const { masterPrompt } = generateMasterPrompt(
        dummyChannel,
        "Skrip Langsung",
        "",
        {
          targetPlatform: "TIKTOK",
          selectedSections: ["HOOK", "BODY", "CTA"], // No TITLE section
        }
      );

      expect(masterPrompt).toContain("[DEKONSTRUKSI MATERI & INTISARI STRATEGIS 2026]");
      expect(masterPrompt).toContain("Sebelum menulis naskah, pelajari seluruh materi, topik, konteks tambahan");
    });
  });

  describe("YouTube 2026 Strategy Master Reference Document Ingestion", () => {
    it("injects YOUTUBE_2026_STRATEGY_MASTER_DOC and sets mastery mandate in systemInstruction for YouTube Shorts", () => {
      const { masterPrompt, systemInstruction } = generateMasterPrompt(
        dummyChannel,
        "Strategi Shorts Viral 2026",
        "",
        {
          targetPlatform: "YOUTUBE_SHORTS",
          aspectRatio: "9:16",
        }
      );

      expect(masterPrompt).toContain("[DOKUMEN RUJUKAN UTAMA: PANDUAN LENGKAP STRATEGI YOUTUBE 2026 (SHORTS & LONG-FORM)]");
      expect(masterPrompt).toContain("PARADIGMA SISTEM REKOMENDASI 2026 (PREDICTIVE VIEWER SATISFACTION)");
      expect(masterPrompt).toContain("STORYTELLING BEREMPATI: FRAMEWORK VET 3-ACT");
      expect(masterPrompt).toContain("PACING & RETENSI TINGGI (ZERO DEAD-AIR & DINAMIKA AUDIO)");
      expect(masterPrompt).toContain("FORMULA THUMBNAIL 2026 & MOBILE SHRINK TEST (120px)");
      expect(masterPrompt).toContain("ARSITEKTUR METADATA SEO 3-TIER");
      expect(masterPrompt).toContain("Sebelum membuat ide judul, pelajari dan serap secara mendalam [DOKUMEN RUJUKAN UTAMA: PANDUAN LENGKAP STRATEGI YOUTUBE 2026]");

      expect(systemInstruction).toContain("Panduan Lengkap Strategi YouTube 2026 (Shorts & Long-Form)");
    });

    it("injects YOUTUBE_2026_STRATEGY_MASTER_DOC for YouTube Long-Form", () => {
      const { masterPrompt, systemInstruction } = generateMasterPrompt(
        dummyChannel,
        "Deep Dive AI Long Form",
        "",
        {
          targetPlatform: "YOUTUBE_LONG",
          aspectRatio: "16:9",
        }
      );

      expect(masterPrompt).toContain("[DOKUMEN RUJUKAN UTAMA: PANDUAN LENGKAP STRATEGI YOUTUBE 2026 (SHORTS & LONG-FORM)]");
      expect(systemInstruction).toContain("Panduan Lengkap Strategi YouTube 2026 (Shorts & Long-Form)");
    });

    it("does NOT inject YouTube Master Reference Document for non-YouTube platforms like TikTok", () => {
      const { masterPrompt, systemInstruction } = generateMasterPrompt(
        dummyChannel,
        "Video TikTok Biasa",
        "",
        {
          targetPlatform: "TIKTOK",
          aspectRatio: "9:16",
        }
      );

      expect(masterPrompt).not.toContain("[DOKUMEN RUJUKAN UTAMA: PANDUAN LENGKAP STRATEGI YOUTUBE 2026 (SHORTS & LONG-FORM)]");
      expect(systemInstruction).not.toContain("Panduan Lengkap Strategi YouTube 2026 (Shorts & Long-Form)");
    });
  });

  describe("Chapter Structure & Long-Form vs Short-Form Auto Detection", () => {
    it("does NOT inject chapter grouping for vertical 9:16 Shorts with 7 scenes", () => {
      const { systemInstruction } = generateMasterPrompt(
        dummyChannel,
        "Reptil Gecko Eye Lick",
        "",
        {
          targetPlatform: "SHORTS",
          aspectRatio: "9:16",
          targetSceneCount: 7,
          targetDurationSec: 50,
          overlayStyle: "auto",
        },
        undefined,
        [],
        "English"
      );

      expect(systemInstruction).not.toContain("KONTEN LONG-FORM");
      expect(systemInstruction).not.toContain("## CHAPTER 1");
      expect(systemInstruction).not.toContain("## BAB 1");
    });

    it("injects localized CHAPTER structure for 16:9 Long-Form English video", () => {
      const { systemInstruction } = generateMasterPrompt(
        dummyChannel,
        "Why Geckos Lick Their Eyes Deep Dive",
        "",
        {
          targetPlatform: "YOUTUBE_LONG",
          aspectRatio: "16:9",
          targetSceneCount: 8,
          targetDurationSec: 480,
          overlayStyle: "auto",
        },
        undefined,
        [],
        "English"
      );

      expect(systemInstruction).toContain("[STRUKTUR CHAPTER OTOMATIS — KONTEN LONG-FORM]");
      expect(systemInstruction).toContain("## CHAPTER 1: Opening Hook");
      expect(systemInstruction).toContain("## CHAPTER 2: Core Deep Dive");
    });

    it("injects localized BAB structure for 16:9 Long-Form Indonesian video", () => {
      const { systemInstruction } = generateMasterPrompt(
        dummyChannel,
        "Misteri Mata Tokek Long Form",
        "",
        {
          targetPlatform: "YOUTUBE_LONG",
          aspectRatio: "16:9",
          targetSceneCount: 8,
          targetDurationSec: 480,
          overlayStyle: "auto",
        },
        undefined,
        [],
        "Indonesian"
      );

      expect(systemInstruction).toContain("[STRUKTUR BAB OTOMATIS — KONTEN LONG-FORM]");
      expect(systemInstruction).toContain("## BAB 1: Opening Hook");
      expect(systemInstruction).toContain("## BAB 2: Pembahasan Utama");
    });
  });
});


