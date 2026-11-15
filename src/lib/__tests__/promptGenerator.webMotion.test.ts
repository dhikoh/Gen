import { describe, expect, it } from "vitest";
import { generateMasterPrompt } from "@/lib/promptGenerator";

type ChannelArg = Parameters<typeof generateMasterPrompt>[0];
type VideoArg = Parameters<typeof generateMasterPrompt>[3];

const dummyChannel = {
  channelName: "MotionLab",
  niche: "SaaS & Tech Explainers",
  targetAudience: "Developers & Founders",
  language: "id",
  contentType: "VIDEO",
  tone: "Inspiratif & Visioner",
} as ChannelArg;

describe("generateMasterPrompt — Web Motion Engine (Bang Motion & Lemo Opuscar)", () => {
  it("menghasilkan instruksi Web Motion HTML5+GSAP dan blok KODE WEB MOTION LENGKAP ketika videoProductionMode = WEB_MOTION_HTML", () => {
    const videoConfig = {
      targetPlatform: "TikTok",
      targetDurationSec: 45,
      targetSceneCount: 5,
      aspectRatio: "9:16",
      speechRate: 0.35,
      videoProductionMode: "WEB_MOTION_HTML",
      motionStyle: "saas_explainer",
      motionBackground: "glow_horizon",
      motionPacing: "snappy",
    } as VideoArg;

    const result = generateMasterPrompt(
      dummyChannel,
      "Cara Kerja Cloud Database Modern",
      "",
      videoConfig,
      null,
      [],
      "Indonesian",
      null
    );

    const text = typeof result === "string" ? result : JSON.stringify(result);

    // 1. Verifikasi System Instruction & Laws
    expect(text).toContain("WEB MOTION ENGINE: STANDALONE HTML5 + CSS + GSAP");
    expect(text).toContain("HUKUM SINEMATIK BANG-MOTION & LE-OPUSCAR");
    expect(text).toContain("ANTI-PPT");
    expect(text).toContain("DETERMINISTIK MUTLAK");
    expect(text).toContain("AKRESI PER FRASA");
    expect(text).toContain("saas_explainer");
    expect(text).toContain("glow_horizon");

    // 2. Verifikasi Larangan Difusi Fisik
    expect(text).toContain("LARANGAN KERAS");
    expect(text).toContain("DILARANG memberikan instruksi lensa kamera fisik optik");

    // 3. Verifikasi Label Field Adegan Khusus Motion
    expect(text).toContain("PERGERAKAN KAMERA (#world):");
    expect(text).toContain("KOMPONEN GRAFIS & ANIMASI:");

    // 4. Verifikasi Blok Kode Output Wajib
    expect(text).toContain("KODE WEB MOTION LENGKAP (STANDALONE HTML5 + GSAP)");
    expect(text).toContain("<!DOCTYPE html>");
    expect(text).toContain("gsap.min.js");
  });

  it("menghasilkan gaya Exploded 3D dan Blueprint Grid secara presisi", () => {
    const videoConfig = {
      targetPlatform: "YouTube Shorts",
      targetDurationSec: 60,
      targetSceneCount: 6,
      aspectRatio: "9:16",
      speechRate: 0.35,
      videoProductionMode: "WEB_MOTION_HTML",
      motionStyle: "exploded_3d",
      motionBackground: "blueprint_grid",
      motionPacing: "smooth",
    } as VideoArg;

    const result = generateMasterPrompt(
      dummyChannel,
      "Anatomi Mesin Jet Turbo",
      "",
      videoConfig,
      null,
      [],
      "Indonesian",
      null
    );

    const text = typeof result === "string" ? result : JSON.stringify(result);

    expect(text).toContain("exploded_3d");
    expect(text).toContain("blueprint_grid");
  });

  it("mempertahankan kaidah AI Diffusion fisik murni saat mode DIFFUSION_AI", () => {
    const videoConfig = {
      targetPlatform: "TikTok",
      targetDurationSec: 60,
      targetSceneCount: 6,
      aspectRatio: "9:16",
      speechRate: 0.35,
      videoProductionMode: "DIFFUSION_AI",
    } as VideoArg;

    const result = generateMasterPrompt(
      dummyChannel,
      "Keindahan Hutan Hujan Tropis",
      "",
      videoConfig,
      null,
      [],
      "Indonesian",
      null
    );

    const text = typeof result === "string" ? result : JSON.stringify(result);

    // AI Diffusion harus memiliki SETTING KAMERA dan VISUAL PROMPT fisik
    expect(text).toContain("SETTING KAMERA:");
    expect(text).toContain("VISUAL PROMPT:");
    expect(text).toContain("AI VIDEO DIFFUSION (CINEMATIC CAMERA)");
    expect(text).toContain("DILARANG menyertakan kode pemrograman web, tag HTML");
    expect(text).not.toContain("KODE WEB MOTION LENGKAP");
  });
});

