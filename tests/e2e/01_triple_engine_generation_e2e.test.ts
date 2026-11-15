import { describe, it, expect } from "vitest";
import { generateMasterPrompt, VideoConfigData } from "@/lib/promptGenerator";
import { generateImagePrompt, ImageConfigData } from "@/lib/imagePromptGenerator";
import { MOCK_TECH_CHANNEL, MOCK_FASHION_CHANNEL } from "./testHarness";

describe("E2E Skenario 1: Triple-Engine Generation Flow (VIDEO, IMAGE, MOTION) & Anti-Clashing", () => {
  const commonTopic = "5 Tools AI Otomasi Terbaik untuk Solo Founder 2026";
  const commonContext = "Target pemula yang ingin menghemat 20 jam per minggu tanpa tim besar.";

  describe("Engine 1: 🎬 Video Script (Diffusion AI Mode)", () => {
    it("generates complete cinematic video script prompt with physical camera & 4-way audio directives", () => {
      const videoConfig: VideoConfigData = {
        targetPlatform: "TikTok / Reels (9:16)",
        targetDurationSec: 60,
        targetSceneCount: 5,
        aspectRatio: "9:16",
        speechRate: "medium",
        includeHook: true,
        includeCTA: true,
        musicPreference: true,
        sfxPreference: true,
        ambientPreference: true,
        voPreference: true,
        videoProductionMode: "DIFFUSION_AI",
        cameraMovementEnabled: true,
        cameraMovementPresets: ["SLOW_PUSH_IN", "ORBIT"],
      };

      const result = generateMasterPrompt(
        MOCK_TECH_CHANNEL,
        commonTopic,
        commonContext,
        videoConfig,
        null,
        ["Judul Lawas Yang Pernah Dipakai 2025"],
        "id"
      );

      expect(result.masterPrompt).toBeTruthy();
      expect(result.systemInstruction).toBeTruthy();

      // 1. Verifikasi Field Labels Sinematografi Fisik
      expect(result.masterPrompt).toContain("SETTING KAMERA:");
      expect(result.masterPrompt).toContain("VISUAL PROMPT:");
      expect(result.masterPrompt).toContain("NARASI:");

      // 2. Verifikasi 4-Way Audio Directives
      expect(result.masterPrompt).toContain("[BGM:");
      expect(result.masterPrompt).toContain("[SFX:");
      expect(result.masterPrompt).toContain("[AMBIENT:");

      // 3. Verifikasi Deduplikasi Judul (Exclusion List)
      expect(result.masterPrompt).toContain("Judul Lawas Yang Pernah Dipakai 2025");

      // 4. Verifikasi Anti-Clashing: Mode Video Difusi TIDAK BOLEH memuat instruksi HTML/GSAP/#world
      expect(result.masterPrompt).not.toContain("<!DOCTYPE html>");
      expect(result.masterPrompt).not.toContain("PERGERAKAN KAMERA (#world):");
      expect(result.masterPrompt).not.toContain("gsap.timeline");
      expect(result.masterPrompt).not.toContain("KOMPONEN GRAFIS & ANIMASI:");
    });
  });

  describe("Engine 2: 🖼️ Image Prompt Studio", () => {
    it("generates high-definition multi-platform image prompt with visual aesthetic and aspect ratio", () => {
      const imageConfig: ImageConfigData = {
        aspectRatio: "16:9",
        visualStyle: "Cyberpunk Cinematic Neon",
        mood: "Futuristic & Mysterious",
        lighting: "Neon Rim Light",
      };

      const result = generateImagePrompt(
        MOCK_TECH_CHANNEL,
        commonTopic,
        commonContext,
        imageConfig,
        null,
        [],
        "id"
      );

      expect(result.masterPrompt).toBeTruthy();
      expect(result.masterPrompt).toContain("16:9");
      expect(result.masterPrompt).toContain("PANDUAN PENGGUNAAN PROMPT GAMBAR");

      expect(result.finalJson).toBeTruthy();
      const parsed = JSON.parse(result.finalJson!);
      expect(parsed.topic).toBe(commonTopic);
      expect(parsed.variations.length).toBeGreaterThan(0);

      // Anti-clashing: Image prompt tidak memuat instruksi video timeline atau HTML
      expect(result.masterPrompt).not.toContain("<!DOCTYPE html>");
      expect(result.masterPrompt).not.toContain("gsap.to");
    });
  });

  describe("Engine 3: ✨ Web Motion Engine (Code-as-Video HTML5+GSAP)", () => {
    it("generates deterministic HTML5+GSAP code prompt with virtual #world camera and zero physical lens clashing", () => {
      const motionConfig: VideoConfigData = {
        targetPlatform: "TikTok / Reels (9:16)",
        targetDurationSec: 45,
        targetSceneCount: 4,
        aspectRatio: "9:16",
        speechRate: "medium",
        includeHook: true,
        includeCTA: true,
        musicPreference: true,
        sfxPreference: true,
        ambientPreference: true,
        voPreference: true,
        videoProductionMode: "WEB_MOTION_HTML",
        motionStyle: "SAAS_EXPLAINER",
        motionBackground: "GLOW_HORIZON",
        motionPacing: "SNAPPY",
      };

      const result = generateMasterPrompt(
        MOCK_TECH_CHANNEL,
        commonTopic,
        commonContext,
        motionConfig,
        null,
        ["Judul Naskah Motion Kemarin"],
        "id"
      );

      // 1. Verifikasi Field Labels Khusus Web Motion
      expect(result.masterPrompt).toContain("PERGERAKAN KAMERA (#world):");
      expect(result.masterPrompt).toContain("KOMPONEN GRAFIS & ANIMASI:");
      expect(result.masterPrompt).toContain("NARASI:");

      // 2. Verifikasi 4 Hukum Sinematik bang-motion/lemo-opuscar pada systemInstruction
      expect(result.systemInstruction).toContain("HUKUM SINEMATIK BANG-MOTION");
      expect(result.systemInstruction).toContain("ANTI-PPT");
      expect(result.systemInstruction).toContain("DETERMINISTIK MUTLAK");
      expect(result.systemInstruction).toContain("AKRESI PER FRASA");
      expect(result.systemInstruction).toContain("PERMUKAAN LATAR");

      // 3. Verifikasi Konfigurasi Visual Terpilih
      expect(result.systemInstruction).toContain("SAAS_EXPLAINER");
      expect(result.systemInstruction).toContain("GLOW_HORIZON");

      // 4. Verifikasi Standalone Output Mandiri pada masterPrompt
      expect(result.masterPrompt).toContain("<!DOCTYPE html>");
      expect(result.masterPrompt).toContain("KODE WEB MOTION LENGKAP (STANDALONE HTML5 + GSAP)");

      // 5. Verifikasi Anti-Clashing (Negative Directives): Dilarang menyebut kamera optik fisik
      expect(result.systemInstruction).toContain("DILARANG memberikan instruksi lensa kamera fisik optik");
      expect(result.systemInstruction).toContain("35mm, f/1.8");

      // 6. Verifikasi Title Deduplication pada Mode Motion
      expect(result.masterPrompt).toContain("Judul Naskah Motion Kemarin");
    });
  });
});
