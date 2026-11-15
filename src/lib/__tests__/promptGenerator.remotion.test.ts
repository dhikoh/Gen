import { describe, expect, it } from "vitest";
import { generateMasterPrompt } from "@/lib/promptGenerator";

type ChannelArg = Parameters<typeof generateMasterPrompt>[0];
type VideoArg = Parameters<typeof generateMasterPrompt>[3];

const channel = {
  channelName: "ScienceInMotion",
  niche: "Sains dan Teknologi",
  targetAudience: "Pelajar dan umum",
  language: "id",
  contentType: "VIDEO",
  tone: "Inspiratif & Energik",
} as ChannelArg;

describe("generateMasterPrompt — videoProductionMode", () => {
  it("ketika videoProductionMode = REMOTION_CODE atau WEB_MOTION_HTML, menghasilkan instruksi Web Motion Engine dan blok KODE WEB MOTION LENGKAP", () => {
    const videoConfig = {
      targetPlatform: "YouTube Shorts",
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
      channel,
      "Fisika Kuantum Sederhana",
      "",
      videoConfig,
      null,
      [],
      "Indonesian",
      null
    );

    const text = typeof result === "string" ? result : JSON.stringify(result);

    // Memverifikasi instruksi Web Motion Engine (Bang Motion & Lemo Opuscar)
    expect(text).toContain("WEB MOTION ENGINE: STANDALONE HTML5 + CSS + GSAP");
    expect(text).toContain("KODE WEB MOTION LENGKAP (STANDALONE HTML5 + GSAP)");
    expect(text).toContain("<!DOCTYPE html>");
    expect(text).toContain("HUKUM SINEMATIK BANG-MOTION & LE-OPUSCAR");
    expect(text).toContain("saas_explainer");
    expect(text).toContain("glow_horizon");
    expect(text).toContain("PERGERAKAN KAMERA (#world)");
  });

  it("ketika videoProductionMode = DIFFUSION_AI atau undefined, mempertahankan prompt kamera fisik difusi", () => {
    const videoConfig = {
      targetPlatform: "TikTok",
      targetDurationSec: 60,
      targetSceneCount: 6,
      aspectRatio: "9:16",
      speechRate: 0.35,
      videoProductionMode: "DIFFUSION_AI",
    } as VideoArg;

    const result = generateMasterPrompt(
      channel,
      "Fisika Kuantum Sederhana",
      "",
      videoConfig,
      null,
      [],
      "Indonesian",
      null
    );

    const text = typeof result === "string" ? result : JSON.stringify(result);

    // Memverifikasi mode difusi fisik
    expect(text).not.toContain("KODE REMOTION LENGKAP (REACT TSX)");
    expect(text).toContain("SETTING KAMERA");
    expect(text).toContain("VISUAL PROMPT");
  });
});
