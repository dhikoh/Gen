import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { applyRateLimit } from "@/lib/rateLimit";

// Fix 2.5: Explicit Zod schema for generatorPreferences payload
// Each sub-key is namespaced to prevent collisions between GeneratorForm and ScenePromptStudio
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
  // Alias keys sent by GeneratorForm stateObj
  includeCaption: z.boolean().optional().nullable(),
  includeThumbnail: z.boolean().optional().nullable(),
  includeHtmlBlog: z.boolean().optional().nullable(),
  affiliateAngle: z.boolean().optional().nullable(),
  affiliateAngleMode: z.enum(["CTA", "SOFT"]).optional().nullable(),
}).strict();

const imageConfigSchema = z.object({
  aspectRatio: z.string().optional(),
  negativePrompt: z.string().optional().nullable(),
  quality: z.string().optional(),
  // Image-specific fields
  cameraType: z.string().optional(),
  shotType: z.string().optional(),
  lighting: z.string().optional(),
  mood: z.string().optional(),
  colorGrading: z.string().optional(),
  visualStyle: z.string().optional(),
  variations: z.number().optional(),
}).strict();

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
  cameraMovementEnabled: z.boolean().optional(),
  cameraMovementPresets: z.array(z.string()).optional(),
  cameraMovementCustom: z.string().max(300).optional(),
  cameraMovementProMode: z.boolean().optional(),
  affiliateAngle: z.boolean().optional(),
  affiliateAngleMode: z.enum(["CTA", "SOFT"]).optional(),
  affiliateMarketplaces: z.array(z.string()).optional().nullable(),
  affiliateCustomUrl: z.string().max(500).optional().nullable(),
  videoConfig: videoConfigSchema.optional(),
  imageConfig: imageConfigSchema.optional(),
  // Result state persistence (Section 14.4)
  step: z.union([z.literal(1), z.literal(2)]).optional(),
  generatedPrompt: z.string().max(50000).optional(),
  aiResultJson: z.string().max(50000).optional(),
  manualTitle: z.string().max(300).optional(),
}).strict();

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
  scenePromptState: scenePromptStateSchema.optional(),
}).strict();

const MAX_PAYLOAD_BYTES = 150_000; // 150 KB max

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

    // Fix 2.5.1: Validate with strict Zod schema
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      console.error("PUT user/preferences validation error:", parsed.error.flatten());
      return NextResponse.json({ error: "Invalid preferences structure" }, { status: 400 });
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

    // Merge — new keys overwrite old keys at the top level namespace (generatorFormState, scenePromptState)
    const merged = { ...currentPrefs, ...parsed.data };

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { generatorPreferences: merged },
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
