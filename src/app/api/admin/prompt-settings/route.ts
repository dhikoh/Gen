import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { z } from "zod";

// 4.4 fix: Explicit schema for prompt settings update
const promptSettingsSchema = z.object({
  videoSystemInstruction: z.string().max(20000).optional().nullable(),
  imageSystemInstruction: z.string().max(20000).optional().nullable(),
  defaultSpeechRate: z.string().max(50).optional().nullable(),
  defaultNegativePrompt: z.string().max(5000).optional().nullable(),
  // Accepts array of strings OR comma-separated string (both normalised to string[])
  bannedWords: z.union([
    z.array(z.string()),
    z.string(),
  ]).optional().nullable(),
});

export async function GET() {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
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

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
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
    } = parsedBody.data;


    // Process bannedWords array or string input
    let sanitizedBannedWords: string[] = [];
    if (Array.isArray(bannedWords)) {
      sanitizedBannedWords = bannedWords.map((w: unknown) => String(w).trim().toLowerCase()).filter(Boolean);
    } else if (typeof bannedWords === "string") {
      sanitizedBannedWords = bannedWords.split(",").map(w => w.trim().toLowerCase()).filter(Boolean);
    }

    const updated = await prisma.promptSettings.upsert({
      where: { id: "singleton" },
      update: {
        videoSystemInstruction: videoSystemInstruction || "",
        imageSystemInstruction: imageSystemInstruction || "",
        defaultSpeechRate: defaultSpeechRate || "medium",
        defaultNegativePrompt: defaultNegativePrompt || "",
        bannedWords: sanitizedBannedWords
      },
      create: {
        id: "singleton",
        videoSystemInstruction: videoSystemInstruction || "",
        imageSystemInstruction: imageSystemInstruction || "",
        defaultSpeechRate: defaultSpeechRate || "medium",
        defaultNegativePrompt: defaultNegativePrompt || "",
        bannedWords: sanitizedBannedWords
      }
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("PUT prompt settings error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
