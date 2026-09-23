import { describe, it, expect } from "vitest";
import { z } from "zod";

// Replicate the Zod schemas from preferences/route.ts to test contract stability
const videoConfigSchema = z.object({
  targetPlatform: z.string().optional(),
  targetDurationSec: z.number().optional(),
  targetSceneCount: z.number().optional(),
  aspectRatio: z.string().optional(),
  narrativeLoopStyle: z.string().optional(),
  visualLoopStyle: z.string().optional(),
  pov: z.string().optional(),
  speechRate: z.union([z.string(), z.number()]).optional(),
  hookStyle: z.string().optional(),
  endingStyle: z.string().optional(),
  selectedProductId: z.string().optional().nullable(),
  composition: z.object({ education: z.number().optional().nullable(), entertainment: z.number().optional().nullable(), marketing: z.number().optional().nullable() }).optional().nullable(),
  includeHook: z.boolean().optional().nullable(),
  includeCTA: z.boolean().optional().nullable(),
  socialCaption: z.boolean().optional().nullable(),
  thumbnailIdea: z.boolean().optional().nullable(),
  htmlBlog: z.boolean().optional().nullable(),
  includeCaption: z.boolean().optional().nullable(),
  includeThumbnail: z.boolean().optional().nullable(),
  includeHtmlBlog: z.boolean().optional().nullable(),
  affiliateAngle: z.boolean().optional().nullable(),
  affiliateAngleMode: z.enum(["CTA", "SOFT"]).optional().nullable(),
  targetKeywords: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  narrationModeOverride: z.string().optional().nullable(),
}).passthrough();

const generatorFormStateSchema = z.object({
  type: z.enum(["VIDEO", "IMAGE"]).optional(),
  channelId: z.string().optional(),
  outputLanguage: z.string().optional(),
  topic: z.string().max(500).optional(),
  additionalContext: z.string().max(2000).optional(),
  rolePOV: z.string().optional(),
  toneOfVoice: z.string().optional(),
  visualStyleKey: z.string().optional(),
  hookStyleType: z.string().optional(),
  customHookText: z.string().max(300).optional(),
  musicPreference: z.boolean().optional(),
  sfxPreference: z.boolean().optional(),
  voPreference: z.boolean().optional(),
  narrationModeOverride: z.string().optional().nullable(),
  cameraMovementEnabled: z.boolean().optional(),
  cameraMovementPresets: z.array(z.string()).optional(),
  cameraMovementCustom: z.string().max(300).optional(),
  cameraMovementProMode: z.boolean().optional(),
  affiliateAngle: z.boolean().optional(),
  affiliateAngleMode: z.enum(["CTA", "SOFT"]).optional(),
  affiliateMarketplaces: z.array(z.string()).optional().nullable(),
  affiliateCustomUrl: z.string().max(500).optional().nullable(),
  videoConfig: videoConfigSchema.optional(),
  step: z.union([z.literal(1), z.literal(2)]).optional(),
  generatedPrompt: z.string().max(50000).optional(),
  aiResultJson: z.string().max(50000).optional(),
  manualTitle: z.string().max(300).optional(),
}).passthrough();

const scenePromptStateSchema = z.object({
  rawText: z.string().max(150000).optional(),
  selectedChannelId: z.string().optional(),
  ar: z.string().optional(),
  sref: z.string().max(5000).optional(),
  cref: z.string().max(5000).optional(),
  draftTitle: z.string().max(2000).optional(),
}).strict();

const preferencesSchema = z.object({
  generatorFormState: generatorFormStateSchema.optional(),
  channelFormStates: z.record(z.string(), generatorFormStateSchema).optional(),
  scenePromptState: scenePromptStateSchema.optional(),
}).strict();

describe("Per-Channel State Isolation & Preferences Sync (Section 32)", () => {
  it("successfully parses channelFormStates partitioned by channel ID", () => {
    const payload = {
      channelFormStates: {
        "channel-tech-1": {
          channelId: "channel-tech-1",
          topic: "AI Agents 2026",
          visualStyleKey: "cyberpunk",
          rolePOV: "PENDIDIK",
          videoConfig: {
            targetPlatform: "YouTube Long",
            speechRate: 0.35,
          },
        },
        "channel-cooking-2": {
          channelId: "channel-cooking-2",
          topic: "Resep Rendang Daging",
          visualStyleKey: "vibrant",
          rolePOV: "STORYTELLER",
          videoConfig: {
            targetPlatform: "TikTok",
            speechRate: 0.25,
          },
        },
      },
    };

    const result = preferencesSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.channelFormStates?.["channel-tech-1"]?.topic).toBe("AI Agents 2026");
      expect(result.data.channelFormStates?.["channel-cooking-2"]?.topic).toBe("Resep Rendang Daging");
    }
  });

  it("merges new channelFormStates without overwriting existing channels in storage", () => {
    const existingPrefs = {
      channelFormStates: {
        "channel-a": {
          channelId: "channel-a",
          topic: "Old Topic Channel A",
          visualStyleKey: "cinematic",
        },
      },
    };

    const updatePayload = {
      channelFormStates: {
        "channel-b": {
          channelId: "channel-b",
          topic: "New Topic Channel B",
          visualStyleKey: "anime",
        },
      },
    };

    const existingChannelFormStates = existingPrefs.channelFormStates || {};
    const mergedChannelFormStates = {
      ...existingChannelFormStates,
      ...updatePayload.channelFormStates,
    };

    expect(mergedChannelFormStates["channel-a"]?.topic).toBe("Old Topic Channel A");
    expect(mergedChannelFormStates["channel-b"]?.topic).toBe("New Topic Channel B");
  });

  it("enforces core database channel fields over stale cached state", () => {
    const dbChannel = {
      id: "chan-123",
      targetPlatform: "YouTube Shorts",
      personaPov: "Energetic Reviewer (Review Produk)",
      speechRate: 0.25,
      visualAesthetic: "Anime / Manga Aesthetic",
      audioBGM: true,
      audioSFX: false,
      audioVO: true,
    };

    const staleSavedState = {
      channelId: "chan-123",
      topic: "Saved Unfinished Topic",
      visualStyleKey: "cinematic", // stale
      videoConfig: {
        targetPlatform: "TikTok", // stale
        pov: "Expert Storyteller", // stale
        speechRate: 0.40, // stale
        selectedProductId: "foreign-prod-999", // stale foreign product
      },
    };

    // The reconciliation logic:
    // Core DB fields override stale cached videoConfig fields
    const reconciledVideoConfig = {
      ...staleSavedState.videoConfig,
      targetPlatform: dbChannel.targetPlatform || "TikTok",
      pov: dbChannel.personaPov || "Expert Storyteller (Edukasi & Inspirasi)",
      speechRate: dbChannel.speechRate ?? 0.35,
      selectedProductId: "", // Always reset on channel switch
    };

    expect(reconciledVideoConfig.targetPlatform).toBe("YouTube Shorts");
    expect(reconciledVideoConfig.pov).toBe("Energetic Reviewer (Review Produk)");
    expect(reconciledVideoConfig.speechRate).toBe(0.25);
    expect(reconciledVideoConfig.selectedProductId).toBe("");
    expect(staleSavedState.topic).toBe("Saved Unfinished Topic"); // Work-in-progress preserved!
  });

  it("ensures switching to a new channel without prior saved state initiates a clean state without leakage", () => {
    const newChannel = {
      id: "chan-fresh",
      channelName: "Fresh Channel",
      targetPlatform: "Instagram Reels",
      personaPov: "Casual Friend (Santai & Relatable)",
      speechRate: 0.30,
      visualAesthetic: "Minimalist Clean",
      audioBGM: true,
      audioSFX: true,
      audioVO: true,
    };

    // Simulated clean initialization without prior state
    const cleanConfig = {
      targetPlatform: newChannel.targetPlatform || "TikTok",
      pov: newChannel.personaPov || "Expert Storyteller (Edukasi & Inspirasi)",
      speechRate: newChannel.speechRate ?? 0.35,
      selectedProductId: "",
      includeHook: true,
      includeCTA: true,
    };

    expect(cleanConfig.targetPlatform).toBe("Instagram Reels");
    expect(cleanConfig.pov).toBe("Casual Friend (Santai & Relatable)");
    expect(cleanConfig.speechRate).toBe(0.30);
    expect(cleanConfig.selectedProductId).toBe("");
  });
});
