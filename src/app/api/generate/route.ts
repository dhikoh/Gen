import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";
import { requireActiveSubscription } from "@/lib/subscription";
import { generateMasterPrompt } from "@/lib/promptGenerator";
import { generateImagePrompt } from "@/lib/imagePromptGenerator";

const videoConfigSchema = z.object({
  targetPlatform: z.string().optional(),
  targetDurationSec: z.number().optional(),
  pov: z.string().optional(),
  speechRate: z.string().optional(),
  hookStyle: z.string().optional(),
  endingStyle: z.string().optional(),
  composition: z.object({
    education: z.number(),
    entertainment: z.number(),
    marketing: z.number()
  }).optional(),
  includeHook: z.boolean().optional(),
  includeCTA: z.boolean().optional(),
  socialCaption: z.boolean().optional(),
  thumbnailIdea: z.boolean().optional(),
  htmlBlog: z.boolean().optional(),
});

const imageConfigSchema = z.object({
  cameraType: z.string().optional(),
  shotType: z.string().optional(),
  lighting: z.string().optional(),
  mood: z.string().optional(),
  colorGrading: z.string().optional(),
  visualStyle: z.string().optional(),
  negativePrompt: z.string().optional(),
  variations: z.number().optional(),
  aspectRatio: z.string().optional()
});

const generateSchema = z.object({
  type: z.enum(["VIDEO", "IMAGE"]),
  channelId: z.string(),
  topic: z.string().min(1, "Topik tidak boleh kosong"),
  additionalContext: z.string().optional(),
  videoConfig: videoConfigSchema.optional(),
  imageConfig: imageConfigSchema.optional(),
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
  try {
    const t = await getApiTranslator();
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
      return NextResponse.json({ error: t("invalidData"), details: parsedData.error.flatten() }, { status: 400 });
    }

    const { type, channelId, topic, additionalContext, videoConfig, imageConfig } = parsedData.data;

    let dbUser, plan;
    try {
      const result = await requireActiveSubscription(session.user.id);
      dbUser = result.user;
      plan = result.plan;
    } catch (err: any) {
      if (err.message === "User not found") {
        return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
      }
      return NextResponse.json({ error: t("inactiveSub") }, { status: 403 });
    }

    if (dbUser.role !== "SUPERADMIN") {
      // Validasi fitur Image Prompt Studio (Bagian 5.5.B)
      if (type === "IMAGE") {
        const features = plan?.features as any;
        if (!features || features.imagePromptStudio !== true) {
          return NextResponse.json({ error: t("imageStudioLocked") }, { status: 403 });
        }
      }
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

    // Fetch previous titles to exclude
    const previousDrafts = await prisma.draft.findMany({
      where: { channelId, type },
      select: { title: true }
    });
    const previousTitles = previousDrafts.map(d => d.title).filter(Boolean);
    let titleContext = "";
    if (previousTitles.length > 0) {
      titleContext = `\n[JUDUL YANG SUDAH PERNAH DIPAKAI (HINDARI)]\n${previousTitles.join(", ")}\n`;
    }

    let masterPrompt = "";
    let systemInstruction = "";
    let finalJson: string | undefined = undefined;

    if (type === "VIDEO" && videoConfig) {
      const result = generateMasterPrompt(channel, topic, additionalContext || "", videoConfig);
      masterPrompt = result.masterPrompt + titleContext;
      systemInstruction = result.systemInstruction;
    } else if (type === "IMAGE" && imageConfig) {
      const result = generateImagePrompt(channel, topic, additionalContext || "", imageConfig);
      masterPrompt = result.masterPrompt + titleContext;
      systemInstruction = result.systemInstruction;
      finalJson = result.finalJson;
    }

    const outputData: any = {
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
