import { describe, it, expect } from "vitest";
import {
  channelBundleSchema,
  buildChannelBundle,
  type ChannelBundle,
} from "@/lib/channelBundle";

describe("Channel Bundle Contract & Validation", () => {
  it("builds a valid bundle from channel, products, used titles, and generator settings", () => {
    const bundle = buildChannelBundle({
      channel: {
        channelName: "Organictopia",
        niche: "Urban Organic Gardening & Micro-Farming",
        description: "Small spaces grow big harvests",
        targetPlatform: "YouTube Shorts, TikTok, Instagram Reels",
        personaPov: "Urban farming researcher",
        speechRate: 0.35,
        visualAesthetic: "Documentary Organic (Warm & Authentic)",
        cta1: "Follow @organictopia",
        cta2: "Read guides at organictopia.blogspot.com",
        audioBGM: true,
        audioSFX: true,
        audioAmbient: true,
        audioVO: true,
        socialLinks: {
          blog: "https://organictopia.blogspot.com",
          instagram: "@organictopia",
          tiktok: "@organictopia",
        },
        contentArchetype: {
          name: "VET Documentary",
          narrationMode: "VOICE_OVER",
        },
      },
      products: [
        {
          name: "Balcony Starter Pack",
          description: "Organic seeds and soil nutrients",
          price: 150000,
          link: "https://tokopedia.com/product",
        },
      ],
      usedTitles: [
        {
          title: "How to Grow 5kg Tomatoes on a Balcony",
          type: "VIDEO",
        },
      ],
      generatorSettings: {
        outputLanguage: "en",
        rolePOV: "Urban farming researcher",
        toneOfVoice: "Warm & Authoritative",
        visualStyleKey: "documentary",
        videoConfig: {
          targetPlatform: "YouTube Shorts",
          targetDurationSec: 60,
          aspectRatio: "9:16",
          speechRate: 0.35,
        },
        videoProductionMode: "REMOTION_CODE",
      },
    });

    expect(bundle.version).toBe("1.0");
    expect(bundle.app).toBe("Prompt Gen");
    expect(bundle.channel.channelName).toBe("Organictopia");
    expect(bundle.products).toHaveLength(1);
    expect(bundle.products![0].name).toBe("Balcony Starter Pack");
    expect(bundle.usedTitles).toHaveLength(1);
    expect(bundle.generatorSettings?.outputLanguage).toBe("en");
    expect(bundle.generatorSettings?.videoProductionMode).toBe("REMOTION_CODE");

    // Must validate cleanly through channelBundleSchema
    const parsed = channelBundleSchema.safeParse(bundle);
    expect(parsed.success).toBe(true);
  });

  it("validates bundles with string array used titles", () => {
    const rawBundle: ChannelBundle = {
      version: "1.0",
      app: "Prompt Gen",
      exportedAt: new Date().toISOString(),
      channel: {
        channelName: "Zoo Nation",
        niche: "Exotic Animals",
        audioBGM: true,
        audioSFX: true,
        audioAmbient: true,
        audioVO: true,
      },
      products: [],
      usedTitles: [
        "This Snake Flattens Its Body Into a Wing and Glides Between Trees",
        "The Deep Sea Creature That Never Ages",
      ],
      generatorSettings: null,
    };

    const parsed = channelBundleSchema.safeParse(rawBundle);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid bundle schemas (wrong version or missing channelName)", () => {
    const invalidVersion = {
      version: "2.0", // invalid
      app: "Prompt Gen",
      exportedAt: new Date().toISOString(),
      channel: { channelName: "Test" },
    };
    expect(channelBundleSchema.safeParse(invalidVersion).success).toBe(false);

    const missingName = {
      version: "1.0",
      app: "Prompt Gen",
      exportedAt: new Date().toISOString(),
      channel: { channelName: "" },
    };
    expect(channelBundleSchema.safeParse(missingName).success).toBe(false);
  });

  it("accepts rich visual aesthetic descriptions exceeding 200 characters", () => {
    const richVisualBundle = {
      version: "1.0",
      app: "Prompt Gen",
      exportedAt: new Date().toISOString(),
      channel: {
        channelName: "Organictopia",
        visualAesthetic: "Stylized 3D semi-realistic animation, DreamWorks aesthetic, warm earthy tactile textures, weathered wood and mossy stone, rich sun-drenched golden hour lighting, subtle volumetric dust motes, macro botanical focus. ABSOLUTELY NO full-body human characters, single focal object per scene, physically plausible.",
        personaPov: "Expert botanical researcher & master storyteller communicating university-backed urban farming science with persuasive storytelling and curiosity hooks.",
      },
      products: [],
      usedTitles: [],
      generatorSettings: null,
    };
    expect(channelBundleSchema.safeParse(richVisualBundle).success).toBe(true);
  });
});
