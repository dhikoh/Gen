import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { z } from "zod";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import { logAdminAction } from "@/lib/auditLog";
import { Prisma } from "@prisma/client";

const promptSettingsSchema = z.object({
  videoSystemInstruction: z.string().max(20000).optional().nullable(),
  imageSystemInstruction: z.string().max(20000).optional().nullable(),
  defaultSpeechRate: z.string().max(50).optional().nullable(),
  defaultNegativePrompt: z.string().max(5000).optional().nullable(),
  bannedWords: z.union([
    z.array(z.string()),
    z.string(),
  ]).optional().nullable(),
  platformAlgorithmGuide: z.union([
    z.record(z.string(), z.string()),
    z.string(),
  ]).optional().nullable(),
});

export async function GET(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }
  if (session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const ip = getClientIp(req);
  const isAllowed = await applyRateLimit(`admin_prompt_settings_get_${session.user.id}_${ip}`, 60, 60);
  if (!isAllowed) {
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
  }

  try {
    let promptSettings = await prisma.promptSettings.findUnique({ where: { id: "singleton" } });

    if (!promptSettings) {
      promptSettings = await prisma.promptSettings.create({
        data: {
          id: "singleton",
          videoSystemInstruction: "",
          imageSystemInstruction: "",
          defaultSpeechRate: "medium",
          defaultNegativePrompt: "",
          bannedWords: [],
          platformAlgorithmGuide: Prisma.DbNull,
        },
      });
    }

    return NextResponse.json({ settings: promptSettings });
  } catch (error) {
    console.error("GET prompt settings error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }
  if (session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const ip = getClientIp(req);
  const isAllowed = await applyRateLimit(`admin_prompt_settings_put_${session.user.id}_${ip}`, 20, 60);
  if (!isAllowed) {
    return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
  }

  try {
    const rawBody = await req.json();
    const parsedBody = promptSettingsSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const {
      videoSystemInstruction,
      imageSystemInstruction,
      defaultSpeechRate,
      defaultNegativePrompt,
      bannedWords,
      platformAlgorithmGuide,
    } = parsedBody.data;

    let sanitizedBannedWords: string[] = [];
    if (Array.isArray(bannedWords)) {
      sanitizedBannedWords = bannedWords.map((w: unknown) => String(w).trim().toLowerCase()).filter(Boolean);
    } else if (typeof bannedWords === "string") {
      sanitizedBannedWords = bannedWords.split(",").map(w => w.trim().toLowerCase()).filter(Boolean);
    }

    let parsedGuide: Record<string, string> | null = null;
    if (typeof platformAlgorithmGuide === "string") {
      try {
        parsedGuide = JSON.parse(platformAlgorithmGuide);
      } catch {
        parsedGuide = null;
      }
    } else if (platformAlgorithmGuide && typeof platformAlgorithmGuide === "object") {
      parsedGuide = platformAlgorithmGuide as Record<string, string>;
    }

    const updated = await prisma.promptSettings.upsert({
      where: { id: "singleton" },
      update: {
        videoSystemInstruction: videoSystemInstruction || "",
        imageSystemInstruction: imageSystemInstruction || "",
        defaultSpeechRate: defaultSpeechRate || "medium",
        defaultNegativePrompt: defaultNegativePrompt || "",
        bannedWords: sanitizedBannedWords,
        platformAlgorithmGuide: parsedGuide ?? Prisma.DbNull,
      },
      create: {
        id: "singleton",
        videoSystemInstruction: videoSystemInstruction || "",
        imageSystemInstruction: imageSystemInstruction || "",
        defaultSpeechRate: defaultSpeechRate || "medium",
        defaultNegativePrompt: defaultNegativePrompt || "",
        bannedWords: sanitizedBannedWords,
        platformAlgorithmGuide: parsedGuide ?? Prisma.DbNull,
      }
    });

    await logAdminAction({
      adminId: session.user.id,
      action: "UPDATE_PROMPT_SETTINGS",
      targetType: "PROMPT_SETTINGS",
      targetId: "singleton",
      metadata: { bannedWordsCount: sanitizedBannedWords.length }
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("PUT prompt settings error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
