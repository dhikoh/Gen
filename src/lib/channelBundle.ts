import { z } from "zod";
import { isRecord } from "@/lib/typeGuards";

// ── SCHEMA DEFINITION FOR EXPORT / IMPORT CHANNEL BUNDLE ──

export const bundleProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().nonnegative(),
  link: z.string().max(1000).optional().nullable(),
});

export const bundleUsedTitleSchema = z.union([
  z.string().min(1).max(500),
  z.object({
    title: z.string().min(1).max(500),
    type: z.enum(["VIDEO", "IMAGE"]).optional().default("VIDEO"),
  }),
]);

export const bundleGeneratorSettingsSchema = z.object({
  outputLanguage: z.string().max(50).optional(),
  rolePOV: z.string().max(100).optional(),
  customRolePOV: z.string().max(500).optional(),
  toneOfVoice: z.string().max(100).optional(),
  visualStyleKey: z.string().max(100).optional(),
  hookStyleType: z.string().max(100).optional(),
  customHookText: z.string().max(300).optional(),
  musicPreference: z.boolean().optional(),
  sfxPreference: z.boolean().optional(),
  voPreference: z.boolean().optional(),
  narrationModeOverride: z.string().optional().nullable(),
  cameraMovementEnabled: z.boolean().optional(),
  cameraMovementPresets: z.array(z.string().max(80)).max(30).optional(),
  cameraMovementCustom: z.string().max(300).optional(),
  cameraMovementProMode: z.boolean().optional(),
  affiliateAngle: z.boolean().optional(),
  affiliateAngleMode: z.enum(["CTA", "SOFT"]).optional(),
  affiliateMarketplaces: z.array(z.string().max(100)).max(20).optional().nullable(),
  affiliateCustomUrl: z.string().max(500).optional().nullable(),
  videoProductionMode: z.enum(["AI_VIDEO_GENERATOR", "REMOTION_CODE"]).optional(),
  videoConfig: z.object({
    targetPlatform: z.string().max(100).optional(),
    targetDurationSec: z.number().positive().max(3600).optional(),
    targetSceneCount: z.number().int().positive().max(120).optional(),
    aspectRatio: z.string().max(20).optional(),
    speechRate: z.number().positive().max(2).optional(),
  }).optional(),
}).passthrough();

export const channelBundleSchema = z.object({
  version: z.literal("1.0"),
  app: z.literal("Prompt Gen"),
  exportedAt: z.string().datetime({ offset: true }).or(z.string()),
  channel: z.object({
    channelName: z.string().min(1, "Nama channel harus diisi").max(100),
    niche: z.string().max(200).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    targetPlatform: z.string().max(100).optional().nullable(),
    personaPov: z.string().max(500).optional().nullable(),
    speechRate: z.number().positive().max(2).optional().nullable(),
    visualAesthetic: z.string().max(200).optional().nullable(),
    cta1: z.string().max(500).optional().nullable(),
    cta2: z.string().max(500).optional().nullable(),
    audioBGM: z.boolean().optional().default(true),
    audioSFX: z.boolean().optional().default(true),
    audioVO: z.boolean().optional().default(true),
    socialLinks: z.union([
      z.record(z.string(), z.string().max(1000)),
      z.object({
        website: z.string().max(1000).optional(),
        tiktok: z.string().max(1000).optional(),
        instagram: z.string().max(1000).optional(),
        facebook: z.string().max(1000).optional(),
        youtube: z.string().max(1000).optional(),
      }),
    ]).optional().nullable(),
    contentArchetype: z.object({
      name: z.string().max(100),
      narrationMode: z.string().max(50).optional(),
    }).optional().nullable(),
  }),
  generatorSettings: bundleGeneratorSettingsSchema.optional().nullable(),
  products: z.array(bundleProductSchema).max(500).optional().default([]),
  usedTitles: z.array(bundleUsedTitleSchema).max(5000).optional().default([]),
});

export type ChannelBundle = z.infer<typeof channelBundleSchema>;
export type BundleProduct = z.infer<typeof bundleProductSchema>;
export type BundleUsedTitle = z.infer<typeof bundleUsedTitleSchema>;
export type BundleGeneratorSettings = z.infer<typeof bundleGeneratorSettingsSchema>;

/**
 * Menghasilkan objek bundle dari entitas Channel, Produk, UsedTitles, dan Snapshot Generator
 */
export function buildChannelBundle(params: {
  channel: {
    channelName: string;
    niche?: string | null;
    description?: string | null;
    targetPlatform?: string | null;
    personaPov?: string | null;
    speechRate?: number | null;
    visualAesthetic?: string | null;
    cta1?: string | null;
    cta2?: string | null;
    audioBGM?: boolean;
    audioSFX?: boolean;
    audioVO?: boolean;
    socialLinks?: unknown;
    contentArchetype?: { name: string; narrationMode: string } | null;
  };
  products?: Array<{
    name: string;
    description?: string | null;
    price: number;
    link?: string | null;
  }>;
  usedTitles?: Array<{
    title: string;
    type?: string | null;
  }>;
  generatorSettings?: Record<string, unknown> | null;
  exportedAt?: string;
}): ChannelBundle {
  const socialLinksObj: Record<string, string> = {};
  if (isRecord(params.channel.socialLinks)) {
    for (const [k, v] of Object.entries(params.channel.socialLinks)) {
      if (typeof v === "string") socialLinksObj[k] = v;
    }
  }

  // Filter generator settings to whitelist
  let cleanGeneratorSettings: BundleGeneratorSettings | undefined;
  if (params.generatorSettings && isRecord(params.generatorSettings)) {
    const raw = params.generatorSettings;
    cleanGeneratorSettings = {
      outputLanguage: typeof raw.outputLanguage === "string" ? raw.outputLanguage : undefined,
      rolePOV: typeof raw.rolePOV === "string" ? raw.rolePOV : undefined,
      customRolePOV: typeof raw.customRolePOV === "string" ? raw.customRolePOV : undefined,
      toneOfVoice: typeof raw.toneOfVoice === "string" ? raw.toneOfVoice : undefined,
      visualStyleKey: typeof raw.visualStyleKey === "string" ? raw.visualStyleKey : undefined,
      hookStyleType: typeof raw.hookStyleType === "string" ? raw.hookStyleType : undefined,
      customHookText: typeof raw.customHookText === "string" ? raw.customHookText : undefined,
      musicPreference: typeof raw.musicPreference === "boolean" ? raw.musicPreference : undefined,
      sfxPreference: typeof raw.sfxPreference === "boolean" ? raw.sfxPreference : undefined,
      voPreference: typeof raw.voPreference === "boolean" ? raw.voPreference : undefined,
      cameraMovementEnabled: typeof raw.cameraMovementEnabled === "boolean" ? raw.cameraMovementEnabled : undefined,
      cameraMovementPresets: Array.isArray(raw.cameraMovementPresets) ? raw.cameraMovementPresets.filter((x): x is string => typeof x === "string") : undefined,
      cameraMovementCustom: typeof raw.cameraMovementCustom === "string" ? raw.cameraMovementCustom : undefined,
      cameraMovementProMode: typeof raw.cameraMovementProMode === "boolean" ? raw.cameraMovementProMode : undefined,
      affiliateAngle: typeof raw.affiliateAngle === "boolean" ? raw.affiliateAngle : undefined,
      affiliateAngleMode: raw.affiliateAngleMode === "CTA" || raw.affiliateAngleMode === "SOFT" ? raw.affiliateAngleMode : undefined,
      affiliateMarketplaces: Array.isArray(raw.affiliateMarketplaces) ? raw.affiliateMarketplaces.filter((x): x is string => typeof x === "string") : undefined,
      affiliateCustomUrl: typeof raw.affiliateCustomUrl === "string" ? raw.affiliateCustomUrl : undefined,
      videoProductionMode: raw.videoProductionMode === "AI_VIDEO_GENERATOR" || raw.videoProductionMode === "REMOTION_CODE" ? raw.videoProductionMode : undefined,
      videoConfig: isRecord(raw.videoConfig) ? {
        targetPlatform: typeof raw.videoConfig.targetPlatform === "string" ? raw.videoConfig.targetPlatform : undefined,
        targetDurationSec: typeof raw.videoConfig.targetDurationSec === "number" ? raw.videoConfig.targetDurationSec : undefined,
        targetSceneCount: typeof raw.videoConfig.targetSceneCount === "number" ? raw.videoConfig.targetSceneCount : undefined,
        aspectRatio: typeof raw.videoConfig.aspectRatio === "string" ? raw.videoConfig.aspectRatio : undefined,
        speechRate: typeof raw.videoConfig.speechRate === "number" ? raw.videoConfig.speechRate : undefined,
      } : undefined,
    };
  }

  return {
    version: "1.0",
    app: "Prompt Gen",
    exportedAt: params.exportedAt || new Date().toISOString(),
    channel: {
      channelName: params.channel.channelName,
      niche: params.channel.niche,
      description: params.channel.description,
      targetPlatform: params.channel.targetPlatform,
      personaPov: params.channel.personaPov,
      speechRate: params.channel.speechRate ?? 0.35,
      visualAesthetic: params.channel.visualAesthetic,
      cta1: params.channel.cta1,
      cta2: params.channel.cta2,
      audioBGM: params.channel.audioBGM ?? true,
      audioSFX: params.channel.audioSFX ?? true,
      audioVO: params.channel.audioVO ?? true,
      socialLinks: Object.keys(socialLinksObj).length > 0 ? socialLinksObj : null,
      contentArchetype: params.channel.contentArchetype ? {
        name: params.channel.contentArchetype.name,
        narrationMode: params.channel.contentArchetype.narrationMode,
      } : null,
    },
    generatorSettings: cleanGeneratorSettings || null,
    products: (params.products || []).map((p) => ({
      name: p.name,
      description: p.description,
      price: p.price,
      link: p.link,
    })),
    usedTitles: (params.usedTitles || []).map((t) => ({
      title: t.title,
      type: t.type === "IMAGE" ? "IMAGE" : "VIDEO",
    })),
  };
}
