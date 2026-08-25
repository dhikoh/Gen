import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";
import { requireActiveSubscription } from "@/lib/subscription";
import { generateMasterPrompt, ProfileChannelData } from "@/lib/promptGenerator";
import { generateImagePrompt } from "@/lib/imagePromptGenerator";
import { KNOWN_PLAN_FEATURES } from "@/lib/planFeatures";
const videoConfigSchema = z.object({
  targetPlatform: z.string().optional().nullable(),
  targetDurationSec: z.coerce.number().optional().nullable(),
  targetSceneCount: z.coerce.number().optional().nullable(),
  aspectRatio: z.string().optional().nullable(),
  narrativeLoopStyle: z.string().optional().nullable(),
  visualLoopStyle: z.string().optional().nullable(),
  pov: z.string().optional().nullable(),
  speechRate: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().nullable(),
  hookStyle: z.string().optional().nullable(),
  endingStyle: z.string().optional().nullable(),
  selectedProductId: z.string().optional().nullable(),
  composition: z.object({
    education: z.coerce.number(),
    entertainment: z.coerce.number(),
    marketing: z.coerce.number()
  }).optional().nullable(),
  includeHook: z.boolean().optional().nullable(),
  includeCTA: z.boolean().optional().nullable(),
  socialCaption: z.boolean().optional().nullable(),
  thumbnailIdea: z.boolean().optional().nullable(),
  htmlBlog: z.boolean().optional().nullable(),
  includeCaption: z.boolean().optional().nullable(),
  includeThumbnail: z.boolean().optional().nullable(),
  includeHtmlBlog: z.boolean().optional().nullable(),
  // Push-ported enrichment params
  rolePOV: z.string().optional().nullable(),
  toneOfVoice: z.string().optional().nullable(),
  visualStyle: z.string().optional().nullable(),
  hookStyleType: z.string().optional().nullable(),
  customHookText: z.string().optional().nullable(),
  isLoopable: z.boolean().optional().nullable(),
  isVideoLoop: z.boolean().optional().nullable(),
  musicPreference: z.boolean().optional().nullable(),
  sfxPreference: z.boolean().optional().nullable(),
  voPreference: z.boolean().optional().nullable(),
  selectedSections: z.array(z.string()).optional().nullable(),
  isVideoPlatform: z.boolean().optional().nullable(),
  // Camera Movement
  cameraMovementEnabled: z.boolean().optional().nullable(),
  cameraMovementPresets: z.array(z.string()).optional().nullable(),
  cameraMovementCustom: z.string().max(500).optional().nullable(),
});

const imageConfigSchema = z.object({
  cameraType: z.string().optional().nullable(),
  shotType: z.string().optional().nullable(),
  lighting: z.string().optional().nullable(),
  mood: z.string().optional().nullable(),
  colorGrading: z.string().optional().nullable(),
  visualStyle: z.string().optional().nullable(),
  negativePrompt: z.string().optional().nullable(),
  variations: z.coerce.number().optional().nullable(),
  aspectRatio: z.string().optional().nullable()
});

const generateSchema = z.object({
  type: z.enum(["VIDEO", "IMAGE"]),
  channelId: z.string().min(1),
  topic: z.string().optional().nullable(),
  additionalContext: z.string().optional().nullable(),
  videoConfig: videoConfigSchema.optional().nullable(),
  imageConfig: imageConfigSchema.optional().nullable(),
  outputLanguage: z.string().optional().nullable(),
}).refine(data => {
  if (data.type === "VIDEO" && data.videoConfig?.composition) {
    const { education, entertainment, marketing } = data.videoConfig.composition;
    return education + entertainment + marketing === 100;
  }
  return true;
}, {
  message: "Total composition of Education, Entertainment, and Marketing must be exactly 100%.",
  path: ["videoConfig", "composition"]
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`generate_${session.user.id}_${ip}`, 10, 60); 
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = generateSchema.safeParse(body);

    if (!parsedData.success) {
      console.error("Generate API validation error:", parsedData.error.flatten());
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    let { type, channelId, outputLanguage, topic, additionalContext, videoConfig, imageConfig } = parsedData.data;

    // Fetch system prompt settings
    const promptSettings = await prisma.promptSettings.findUnique({
      where: { id: "singleton" }
    });

    // Content filter: Check banned words
    if (promptSettings && Array.isArray(promptSettings.bannedWords) && promptSettings.bannedWords.length > 0) {
      const inputContent = `${topic || ""} ${additionalContext || ""}`.toLowerCase();
      const bannedList = promptSettings.bannedWords as unknown[];
      const containsBannedWord = bannedList.some((word) => {
        if (typeof word !== "string") return false;
        const cleanWord = word.trim().toLowerCase();
        return cleanWord.length > 0 && inputContent.includes(cleanWord);
      });

      if (containsBannedWord) {
        return NextResponse.json({ error: t("bannedWordDetected") }, { status: 400 });
      }
    }

    let dbUser, plan;
    try {
      const result = await requireActiveSubscription(session.user.id);
      dbUser = result.user;
      plan = result.plan;
    } catch (err: unknown) {
      const errObj = err as Error;
      if (errObj && errObj.message === "User not found") {
        return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
      }
      return NextResponse.json({ error: t("inactiveSub") }, { status: 403 });
    }

    // SUPERADMIN always gets PRO tier; otherwise resolve from plan.features
    let cameraMovementProEnabled = dbUser.role === "SUPERADMIN";

    if (dbUser.role !== "SUPERADMIN") {
      const rawFeatures = (plan?.features || {}) as Record<string, boolean>;

      const getFeatureValue = (key: string) => {
        if (typeof rawFeatures[key] === "boolean") return rawFeatures[key];
        const def = KNOWN_PLAN_FEATURES.find(f => f.key === key)?.defaultValue;
        return def === true;
      };

      // Validasi fitur Image Prompt Studio (Bagian 5.5.B) — TIDAK BERUBAH
      if (type === "IMAGE") {
        if (!getFeatureValue("imagePromptStudio")) {
          return NextResponse.json({ error: t("imageStudioLocked") }, { status: 403 });
        }
      }

      // Validasi fitur HTML Blog Export [K1] — TIDAK BERUBAH
      if (type === "VIDEO" && (videoConfig?.htmlBlog === true || videoConfig?.includeHtmlBlog === true)) {
        if (!getFeatureValue("htmlBlogExport")) {
          return NextResponse.json({ error: t("htmlBlogLocked") }, { status: 403 });
        }
      }

      // Resolusi entitlement Camera Movement Pro — BUKAN gate blokir, hanya menentukan versi instruksi.
      // Nilai ini SELALU berasal dari server, tidak pernah dari body request client.
      cameraMovementProEnabled = getFeatureValue("cameraMovementPro");
    }

    const channel = await prisma.profileChannel.findUnique({
      where: { id: channelId },
      include: { products: true }
    });

    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: t("invalidChannel") }, { status: 400 });
    }

    if (channel.isLocked) {
      return NextResponse.json({ error: t("channelLocked") }, { status: 403 });
    }

    // Auto fallback topic to channel.niche if topic is empty
    const effectiveTopic = (topic && topic.trim().length > 0) ? topic.trim() : (channel.niche || "Topik Umum");

    // Fetch previous titles to exclude
    const previousDrafts = await prisma.draft.findMany({
      where: { channelId, type },
      select: { title: true }
    });
    const previousTitles = previousDrafts.map(d => d.title).filter((t): t is string => Boolean(t && t.trim()));

    let masterPrompt = "";
    let systemInstruction = "";
    let finalJson: string | undefined = undefined;

    if (type === "VIDEO" && videoConfig) {
      let selectedProduct;
      if (videoConfig.selectedProductId) {
        const found = channel.products.find((p) => p.id === videoConfig.selectedProductId);
        if (found) {
          selectedProduct = { name: found.name, price: found.price, description: found.description };
        }
      }

      const fullVideoConfig = {
        ...videoConfig,
        selectedProduct,
        cameraMovementProEnabled, // server-resolved PRO entitlement — never read from client body
      };

      const result = generateMasterPrompt(channel as unknown as ProfileChannelData, effectiveTopic, additionalContext || "", fullVideoConfig, promptSettings, previousTitles, outputLanguage);
      masterPrompt = result.masterPrompt;
      systemInstruction = result.systemInstruction;
    } else if (type === "IMAGE" && imageConfig) {
      const result = generateImagePrompt(channel as unknown as ProfileChannelData, effectiveTopic, additionalContext || "", imageConfig, promptSettings, previousTitles, outputLanguage);
      masterPrompt = result.masterPrompt;
      systemInstruction = result.systemInstruction;
      finalJson = result.finalJson;
    }

    const outputData: { master_prompt: string; system_instruction: string; finalJson?: string } = {
      master_prompt: masterPrompt,
      system_instruction: systemInstruction,
    };
    if (finalJson) outputData.finalJson = finalJson;

    return NextResponse.json({ 
      success: true, 
      data: outputData
    }, { status: 200 });

  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json({ error: t("generateError") }, { status: 500 });
  }
}
