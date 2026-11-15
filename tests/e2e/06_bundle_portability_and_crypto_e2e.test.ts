import { describe, it, expect } from "vitest";
import {
  buildChannelBundle,
  channelBundleSchema,
  ChannelBundle,
} from "@/lib/channelBundle";
import { MOCK_TECH_CHANNEL } from "./testHarness";

describe("E2E Skenario 6: Channel Bundle Portability & Export/Import Zero-Loss Integrity", () => {
  it("exports channel with Web Motion, 4-way audio, products, and typed used titles without data loss", () => {
    const rawExport = buildChannelBundle({
      channel: {
        channelName: MOCK_TECH_CHANNEL.channelName,
        niche: MOCK_TECH_CHANNEL.niche,
        description: MOCK_TECH_CHANNEL.description,
        targetPlatform: MOCK_TECH_CHANNEL.targetPlatform,
        personaPov: MOCK_TECH_CHANNEL.personaPov,
        speechRate: MOCK_TECH_CHANNEL.speechRate,
        visualAesthetic: MOCK_TECH_CHANNEL.visualAesthetic,
        cta1: MOCK_TECH_CHANNEL.cta1,
        cta2: MOCK_TECH_CHANNEL.cta2,
        audioBGM: true,
        audioSFX: true,
        audioAmbient: true,
        audioVO: true,
        socialLinks: { tiktok: "https://tiktok.com/@indotech", youtube: "https://youtube.com/@indotech" },
      },
      products: MOCK_TECH_CHANNEL.products?.map((p) => ({
        name: p.name,
        price: p.price,
        description: p.description,
      })),
      usedTitles: [
        { title: "Judul Video Biasa", type: "VIDEO" },
        { title: "Judul Motion Grafis Canggih", type: "MOTION" },
        { title: "Gambar Fotorealistik Neon", type: "IMAGE" },
      ],
      generatorSettings: {
        outputLanguage: "id",
        rolePOV: "KONTEN_KREATOR",
        toneOfVoice: "Inspiratif & Energik",
        musicPreference: true,
        sfxPreference: true,
        ambientPreference: true,
        voPreference: true,
        videoProductionMode: "WEB_MOTION_HTML",
        videoConfig: {
          targetPlatform: "TikTok / Reels (9:16)",
          targetDurationSec: 45,
          targetSceneCount: 4,
          aspectRatio: "9:16",
          speechRate: 0.35,
        },
      },
    });

    // 1. Validasi Schema Bundle v1.0
    const parseResult = channelBundleSchema.safeParse(rawExport);
    expect(parseResult.success).toBe(true);

    const bundle = parseResult.data as ChannelBundle;
    expect(bundle.version).toBe("1.0");
    expect(bundle.app).toBe("Prompt Gen");
    expect(bundle.channel.channelName).toBe("Indo Tech Horizon");

    // 2. Verifikasi 4-Way Audio Flags
    expect(bundle.channel.audioBGM).toBe(true);
    expect(bundle.channel.audioSFX).toBe(true);
    expect(bundle.channel.audioAmbient).toBe(true);
    expect(bundle.channel.audioVO).toBe(true);

    // 3. Verifikasi Generator Settings & Web Motion Mode
    expect(bundle.generatorSettings?.videoProductionMode).toBe("WEB_MOTION_HTML");
    expect(bundle.generatorSettings?.ambientPreference).toBe(true);
    expect(bundle.generatorSettings?.videoConfig?.targetDurationSec).toBe(45);

    // 4. Verifikasi Produk
    expect(bundle.products).toHaveLength(2);
    expect(bundle.products[0].name).toBe("PromptGen AI Lifetime Access");
    expect(bundle.products[0].price).toBe(499000);

    // 5. Verifikasi Typed Used Titles (Termasuk tipe MOTION)
    expect(bundle.usedTitles).toHaveLength(3);
    const motionTitle = bundle.usedTitles.find(
      (t) => typeof t === "object" && t.title === "Judul Motion Grafis Canggih"
    );
    expect(motionTitle).toBeDefined();
    if (typeof motionTitle === "object") {
      expect(motionTitle.type).toBe("MOTION");
    }
  });

  it("strictly rejects corrupted or tampered bundle JSON during import validation", () => {
    const invalidBundle = {
      version: "9.9", // Versi tidak didukung
      app: "Malicious App",
      channel: {
        // channelName wajib ada
        niche: "Hacking tools",
      },
      products: [
        { name: "Negative Price Item", price: -50000 }, // Harga negatif dilarang
      ],
    };

    const result = channelBundleSchema.safeParse(invalidBundle);
    expect(result.success).toBe(false);
  });
});

