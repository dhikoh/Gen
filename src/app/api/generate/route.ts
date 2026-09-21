import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";
import { requireActiveSubscription } from "@/lib/subscription";
import { generateMasterPrompt, ProfileChannelData, ContentArchetypeData, TopPerformingDraftSummary } from "@/lib/promptGenerator";
import { generateImagePrompt } from "@/lib/imagePromptGenerator";
import { hasFeature } from "@/lib/planFeatures";
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
    education: z.coerce.number().default(0),
    entertainment: z.coerce.number().default(0),
    marketing: z.coerce.number().default(0)
  }).optional().nullable(),
  includeHook: z.boolean().optional().nullable(),
  includeCTA: z.boolean().optional().nullable(),
  socialCaption: z.boolean().optional().nullable(),
  thumbnailIdea: z.boolean().optional().nullable(),
  htmlBlog: z.boolean().optional().nullable(),
  affiliateAngle: z.boolean().optional().nullable(),
  affiliateAngleMode: z.enum(["CTA", "SOFT"]).optional().nullable(),
  cameraMovementProMode: z.boolean().optional().nullable(),
  includeCaption: z.boolean().optional().nullable(),
  includeThumbnail: z.boolean().optional().nullable(),
  includeHtmlBlog: z.boolean().optional().nullable(),
  // Archetype & Narration Mode (Bagian 23)
  contentArchetypeId: z.string().optional().nullable(),
  narrationMode: z.enum(["VOICE_OVER", "DIEGETIC_ONLY", "SILENT_TEXT_ONLY", "HYBRID"]).optional().nullable(),
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
  // SEO & Keyword Targets (vidIQ / YouTube Live)
  targetKeywords: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  trendingAudio: z.string().max(200).optional().nullable(),
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
  aspectRatio: z.string().optional().nullable(),
  // Fix #59: targetKeywords terintegrasi di IMAGE path
  targetKeywords: z.union([z.array(z.string()), z.string()]).optional().nullable(),
});

const generateSchema = z.object({
  type: z.enum(["VIDEO", "IMAGE"]),
  channelId: z.string().min(1),
  topic: z.string().optional().nullable(),
  additionalContext: z.string().optional().nullable(),
  videoConfig: videoConfigSchema.optional().nullable(),
  imageConfig: imageConfigSchema.optional().nullable(),
  outputLanguage: z.string().optional().nullable(),
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

    const { type, channelId, outputLanguage, topic, additionalContext, videoConfig, imageConfig } = parsedData.data;

    // Fetch system prompt settings
    const promptSettings = await prisma.promptSettings.findUnique({
      where: { id: "singleton" }
    });

    // Content filter: Check banned words (P1-14: comprehensive boundary-safe scan)
    if (promptSettings && Array.isArray(promptSettings.bannedWords) && promptSettings.bannedWords.length > 0) {
      const keywordsStr = Array.isArray(videoConfig?.targetKeywords) 
        ? videoConfig.targetKeywords.join(" ") 
        : typeof videoConfig?.targetKeywords === "string" 
          ? videoConfig.targetKeywords 
          : "";
      const visualStyleStr = imageConfig?.visualStyle || "";
      const customHookStr = videoConfig?.customHookText || "";
      const cameraCustomStr = videoConfig?.cameraMovementCustom || "";
      const inputContent = `${topic || ""} ${additionalContext || ""} ${keywordsStr} ${visualStyleStr} ${customHookStr} ${cameraCustomStr}`.toLowerCase();
      const bannedList = promptSettings.bannedWords as unknown[];

      const containsBannedWord = bannedList.some((word) => {
        if (typeof word !== "string") return false;
        const cleanWord = word.trim().toLowerCase();
        if (!cleanWord) return false;
        const escaped = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(^|\\W)${escaped}($|\\W)`, "i");
        return regex.test(inputContent);
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

      // Fix audit 5.1: gunakan hasFeature() dari planFeatures.ts, hapus duplikat closure lokal
      const getFeatureValue = (key: string) => hasFeature(rawFeatures, key);

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
      // Server WAJIB punya entitlement AND user harus opt-in via toggle PRO (cameraMovementProMode).
      // cameraMovementProMode dari client hanya sebagai INTENT — server tetap penentu akhir.
      const serverHasProEntitlement = getFeatureValue("cameraMovementPro");
      const clientOptedInProMode = videoConfig?.cameraMovementProMode === true;
      cameraMovementProEnabled = serverHasProEntitlement && clientOptedInProMode;
    }

    const channel = await prisma.profileChannel.findUnique({
      where: { id: channelId },
      include: { products: true, contentArchetype: true }
    });

    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: t("invalidChannel") }, { status: 400 });
    }

    if (channel.isLocked) {
      return NextResponse.json({ error: t("channelLocked") }, { status: 403 });
    }

    // Auto fallback topic to channel.niche if topic is empty
    const effectiveTopic = (topic && topic.trim().length > 0) ? topic.trim() : (channel.niche || "Topik Umum");

    // Fix arsitektur: exclude titles dibaca dari UsedTitle (permanen) + Draft (historis)
    // Dual-source agar tidak ada gap selama masa transisi migrasi data
    const [usedTitleRecords, previousDrafts] = await Promise.all([
      prisma.usedTitle.findMany({
        where: { channelId, type },
        select: { title: true }
      }),
      prisma.draft.findMany({
        where: { channelId, type, title: { not: null } },
        select: { title: true }
      })
    ]);

    const seenExclude = new Set<string>();
    const previousTitles: string[] = [];
    for (const ut of usedTitleRecords) {
      const key = ut.title.trim().toLowerCase();
      if (!seenExclude.has(key)) { seenExclude.add(key); previousTitles.push(ut.title); }
    }
    for (const d of previousDrafts) {
      if (!d.title) continue;
      const key = d.title.trim().toLowerCase();
      if (!seenExclude.has(key)) { seenExclude.add(key); previousTitles.push(d.title); }
    }


    let masterPrompt = "";
    let systemInstruction = "";
    let finalJson: string | undefined = undefined;

    // Closed-loop Performance Query (Tugas 5)
    let topPerformers: TopPerformingDraftSummary[] = [];
    if (type === "VIDEO") {
      try {
        const topPerformances = await prisma.draftPerformance.findMany({
          where: {
            draft: { channelId },
            views: { gt: 0 },
          },
          include: {
            draft: true,
          },
          orderBy: [
            { views: "desc" },
            { retentionPct: "desc" },
          ],
          take: 5,
        });

        topPerformers = topPerformances.map((perf) => {
          const d = perf.draft;
          interface ParsedShape {
            scenes?: Array<{ narasi?: string; teksOverlay?: string }>;
            segments?: Array<{ caption?: string; visual?: string }>;
            metadata?: { toneOfVoice?: string; targetKeywords?: string[] | string };
          }
          const parsed: ParsedShape = (d.parsedData && typeof d.parsedData === "object" ? d.parsedData : {}) as ParsedShape;
          let hookText = "";
          if (Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
            hookText = parsed.scenes[0].narasi || parsed.scenes[0].teksOverlay || "";
          } else if (Array.isArray(parsed.segments) && parsed.segments.length > 0) {
            hookText = parsed.segments[0].caption || parsed.segments[0].visual || "";
          }
          if (!hookText && d.title) {
            hookText = d.title;
          }

          return {
            id: d.id,
            title: d.title || "Konten Video",
            views: perf.views || 0,
            retentionPct: perf.retentionPct,
            likes: perf.likes || 0,
            hookText: hookText ? hookText.substring(0, 150) : null,
            toneOfVoice: parsed.metadata?.toneOfVoice || channel.visualAesthetic || null,
            targetKeywords: parsed.metadata?.targetKeywords || null,
          };
        });
      } catch (err) {
        console.error("Closed-loop top drafts query failed:", err);
      }
    }

    if (type === "VIDEO" && videoConfig) {
      let selectedProduct;
      if (videoConfig.selectedProductId) {
        const found = channel.products.find((p) => p.id === videoConfig.selectedProductId);
        if (found) {
          selectedProduct = { name: found.name, price: found.price, description: found.description };
        }
      }

      // Resolve archetype: videoConfig override or channel archetype
      let effectiveArchetype = channel.contentArchetype;
      if (videoConfig.contentArchetypeId && videoConfig.contentArchetypeId !== channel.contentArchetypeId) {
        const customArch = await prisma.contentArchetype.findUnique({
          where: { id: videoConfig.contentArchetypeId },
        });
        if (customArch) effectiveArchetype = customArch;
      }

      // P1-6: Dynamic composition category validation based on resolved archetype
      const compCategories = Array.isArray(effectiveArchetype?.compositionCategories)
        ? (effectiveArchetype.compositionCategories as Array<{ label: string; required?: boolean }>)
        : [];
      const hasRequiredCategories = compCategories.length > 0 && compCategories.some((c) => c && c.required);

      if (hasRequiredCategories) {
        for (const cat of compCategories) {
          if (cat && cat.required) {
            const labelLower = (cat.label || "").toLowerCase();
            const val = videoConfig.composition
              ? (labelLower.includes("edukasi") || labelLower.includes("education")
                  ? videoConfig.composition.education
                  : labelLower.includes("hiburan") || labelLower.includes("entertainment")
                    ? videoConfig.composition.entertainment
                    : labelLower.includes("marketing") || labelLower.includes("promosi")
                      ? videoConfig.composition.marketing
                      : 0)
              : 0;
            if (val <= 0) {
              return NextResponse.json({
                error: t("compositionCategoryRequired", { category: cat.label })
              }, { status: 400 });
            }
          }
        }
      }

      // If standard composition applies (no custom archetype, or archetype has required categories):
      if (!effectiveArchetype || hasRequiredCategories) {
        if (videoConfig.composition) {
          const { education = 0, entertainment = 0, marketing = 0 } = videoConfig.composition;
          // If any composition value is configured (> 0), ensure the sum equals 100
          if (education > 0 || entertainment > 0 || marketing > 0) {
            if (education + entertainment + marketing !== 100) {
              return NextResponse.json({ error: t("compError") }, { status: 400 });
            }
          }
        }
      }

      const typedArchetype: ContentArchetypeData | null = effectiveArchetype
        ? {
            id: effectiveArchetype.id,
            name: effectiveArchetype.name,
            narrationMode: effectiveArchetype.narrationMode,
            emotionalArcTemplate: effectiveArchetype.emotionalArcTemplate,
            defaultIncludedSections: effectiveArchetype.defaultIncludedSections as { hook?: boolean; cta?: boolean; caption?: boolean; thumbnail?: boolean } | null,
            compositionCategories: effectiveArchetype.compositionCategories as Array<{ label: string; required: boolean }> | null,
            durationCalcMode: effectiveArchetype.durationCalcMode,
            cameraMovementRoleMap: effectiveArchetype.cameraMovementRoleMap as Record<string, string[]> | null,
          }
        : null;

      const fullVideoConfig = {
        ...videoConfig,
        contentArchetype: typedArchetype,
        narrationMode: videoConfig.narrationMode || effectiveArchetype?.narrationMode,
        selectedProduct,
        cameraMovementProEnabled, // server-resolved PRO entitlement — never read from client body
      };

      const mappedChannel: ProfileChannelData = {
        channelName: channel.channelName,
        niche: channel.niche,
        description: channel.description,
        visualAesthetic: channel.visualAesthetic,
        cta1: channel.cta1,
        cta2: channel.cta2,
        audioBGM: channel.audioBGM,
        audioSFX: channel.audioSFX,
        audioVO: channel.audioVO,
        products: channel.products,
        socialLinks: channel.socialLinks as Array<{ platform: string; url: string }> | null,
        contentArchetypeId: channel.contentArchetypeId,
        contentArchetype: typedArchetype,
        speechRate: channel.speechRate,
        targetPlatform: channel.targetPlatform,
      };

      const result = generateMasterPrompt(mappedChannel, effectiveTopic, additionalContext || "", fullVideoConfig, promptSettings, previousTitles, outputLanguage, topPerformers);
      masterPrompt = result.masterPrompt;
      systemInstruction = result.systemInstruction;
    } else if (type === "IMAGE" && imageConfig) {
      const mappedChannel: ProfileChannelData = {
        channelName: channel.channelName,
        niche: channel.niche,
        description: channel.description,
        visualAesthetic: channel.visualAesthetic,
        cta1: channel.cta1,
        cta2: channel.cta2,
        audioBGM: channel.audioBGM,
        audioSFX: channel.audioSFX,
        audioVO: channel.audioVO,
        products: channel.products,
        socialLinks: channel.socialLinks as Array<{ platform: string; url: string }> | null,
        contentArchetypeId: channel.contentArchetypeId,
        speechRate: channel.speechRate,
        targetPlatform: channel.targetPlatform,
      };
      const result = generateImagePrompt(
        mappedChannel,
        effectiveTopic,
        additionalContext || "",
        imageConfig,
        promptSettings,
        previousTitles,
        outputLanguage,
        imageConfig.targetKeywords, // Fix #59: pass keywords to IMAGE generator
      );
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
