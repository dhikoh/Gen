import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { applyRateLimit } from "@/lib/rateLimit";

// Fix 2.5: Explicit Zod schema for generatorPreferences payload
// Each sub-key is namespaced to prevent collisions between GeneratorForm and ScenePromptStudio
const videoConfigSchema = z.object({
  targetPlatform: z.string().optional().nullable(),
  targetDurationSec: z.number().optional().nullable(),
  targetSceneCount: z.number().optional().nullable(),
  aspectRatio: z.string().optional().nullable(),
  narrativeLoopStyle: z.string().optional().nullable(),
  visualLoopStyle: z.string().optional().nullable(),
  pov: z.string().optional().nullable(),
  speechRate: z.union([z.string(), z.number()]).optional().nullable(),
  hookStyle: z.string().optional().nullable(),
  endingStyle: z.string().optional().nullable(),
  selectedProductId: z.string().optional().nullable(),
  composition: z.object({ education: z.number().optional().nullable(), entertainment: z.number().optional().nullable(), marketing: z.number().optional().nullable() }).optional().nullable(),
  includeHook: z.boolean().optional().nullable(),
  includeCTA: z.boolean().optional().nullable(),
  socialCaption: z.boolean().optional().nullable(),
  thumbnailIdea: z.boolean().optional().nullable(),
  htmlBlog: z.boolean().optional().nullable(),
  // Alias keys sent by GeneratorForm stateObj
  includeCaption: z.boolean().optional().nullable(),
  includeThumbnail: z.boolean().optional().nullable(),
  includeHtmlBlog: z.boolean().optional().nullable(),
  affiliateAngle: z.boolean().optional().nullable(),
  affiliateAngleMode: z.enum(["CTA", "SOFT"]).optional().nullable(),
  targetKeywords: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  narrationModeOverride: z.string().optional().nullable(),
}).passthrough();

const imageConfigSchema = z.object({
  aspectRatio: z.string().optional().nullable(),
  negativePrompt: z.string().optional().nullable(),
  quality: z.string().optional().nullable(),
  // Image-specific fields
  cameraType: z.string().optional().nullable(),
  shotType: z.string().optional().nullable(),
  lighting: z.string().optional().nullable(),
  mood: z.string().optional().nullable(),
  colorGrading: z.string().optional().nullable(),
  visualStyle: z.string().optional().nullable(),
  variations: z.number().optional().nullable(),
}).passthrough();

const generatorFormStateSchema = z.object({
  type: z.enum(["VIDEO", "IMAGE"]).optional().nullable(),
  channelId: z.string().optional().nullable(),
  outputLanguage: z.string().optional().nullable(),
  topic: z.string().max(5000).optional().nullable(),
  additionalContext: z.string().max(50000).optional().nullable(),
  rolePOV: z.string().optional().nullable(),
  customRolePOV: z.string().max(5000).optional().nullable(),
  toneOfVoice: z.string().optional().nullable(),
  visualStyleKey: z.string().optional().nullable(),
  hookStyleType: z.string().optional().nullable(),
  customHookText: z.string().max(3000).optional().nullable(),
  musicPreference: z.boolean().optional().nullable(),
  sfxPreference: z.boolean().optional().nullable(),
  voPreference: z.boolean().optional().nullable(),
  narrationModeOverride: z.string().optional().nullable(),
  cameraMovementEnabled: z.boolean().optional().nullable(),
  cameraMovementPresets: z.array(z.string()).optional().nullable(),
  cameraMovementCustom: z.string().max(3000).optional().nullable(),
  cameraMovementProMode: z.boolean().optional().nullable(),
  affiliateAngle: z.boolean().optional().nullable(),
  affiliateAngleMode: z.enum(["CTA", "SOFT"]).optional().nullable(),
  affiliateMarketplaces: z.array(z.string()).optional().nullable(),
  affiliateCustomUrl: z.string().max(2000).optional().nullable(),
  videoConfig: videoConfigSchema.optional().nullable(),
  imageConfig: imageConfigSchema.optional().nullable(),
  // Result state persistence (Section 14.4)
  step: z.union([z.number(), z.literal(1), z.literal(2)]).optional().nullable(),
  generatedPrompt: z.string().max(500000).optional().nullable(),
  aiResultJson: z.string().max(500000).optional().nullable(),
  manualTitle: z.string().max(3000).optional().nullable(),
}).passthrough();

const scenePromptStateSchema = z.object({
  rawText: z.string().max(500000).optional().nullable(),
  selectedChannelId: z.string().optional().nullable(),
  ar: z.string().optional().nullable(),
  sref: z.string().max(10000).optional().nullable(),
  cref: z.string().max(10000).optional().nullable(),
  draftTitle: z.string().max(5000).optional().nullable(),
  ttsVoice: z.string().optional().nullable(),
  ttsModel: z.string().optional().nullable(),
  ttsPitch: z.string().optional().nullable(),
  ttsSpeed: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 1.0)]).optional().nullable(),
  ttsStyleInstruction: z.string().max(5000).optional().nullable(),
  ttsVoiceFilter: z.string().optional().nullable(),
  favoriteVoices: z.array(z.string()).optional().nullable(),
}).passthrough();

const preferencesSchema = z.object({
  generatorFormState: generatorFormStateSchema.optional().nullable(),
  channelFormStates: z.record(z.string(), generatorFormStateSchema).optional().nullable(),
  scenePromptState: scenePromptStateSchema.optional().nullable(),
}).passthrough();

const MAX_PAYLOAD_BYTES = 1_000_000; // 1 MB max for multi-channel & rich scene prompt states

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { generatorPreferences: true },
    });

    return NextResponse.json({
      success: true,
      generatorPreferences: user?.generatorPreferences || null,
    });
  } catch (error: unknown) {
    console.error("GET user/preferences error:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: keyed per user id — 60 req/min (auto-save fires max every 3s)
    const rateLimitOk = await applyRateLimit(`user-prefs-${session.user.id}`, 60, 60);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const rawText = await req.text();

    // Fix 2.5.3: Reject oversized payloads
    if (rawText.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      console.error("PUT user/preferences validation error:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid preferences structure", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { generatorPreferences: true },
    });

    const currentPrefs =
      existingUser?.generatorPreferences &&
      typeof existingUser.generatorPreferences === "object" &&
      !Array.isArray(existingUser.generatorPreferences)
        ? (existingUser.generatorPreferences as Record<string, unknown>)
        : {};

    // Merge channelFormStates per channel ID so saving one channel doesn't erase others
    const existingChannelFormStates =
      currentPrefs.channelFormStates &&
      typeof currentPrefs.channelFormStates === "object" &&
      !Array.isArray(currentPrefs.channelFormStates)
        ? (currentPrefs.channelFormStates as Record<string, unknown>)
        : {};

    const mergedChannelFormStates = parsed.data.channelFormStates
      ? { ...existingChannelFormStates, ...parsed.data.channelFormStates }
      : existingChannelFormStates;

    // Merge — new keys overwrite old keys at the top level namespace
    const merged = {
      ...currentPrefs,
      ...parsed.data,
      ...(parsed.data.channelFormStates || currentPrefs.channelFormStates
        ? { channelFormStates: mergedChannelFormStates }
        : {}),
    };

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { generatorPreferences: merged as Prisma.InputJsonValue },
    });

    return NextResponse.json({
      success: true,
      generatorPreferences: updatedUser.generatorPreferences,
    });
  } catch (error: unknown) {
    console.error("PUT user/preferences error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}

export { PUT as POST };
