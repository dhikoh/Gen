import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";

export async function GET() {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
  }

  try {
    let promptSettings = await prisma.promptSettings.findUnique({
      where: { id: "singleton" }
    });

    if (!promptSettings) {
      promptSettings = await prisma.promptSettings.create({
        data: {
          id: "singleton",
          videoSystemInstruction: "",
          imageSystemInstruction: "",
          defaultSpeechRate: "medium",
          defaultNegativePrompt: "",
          bannedWords: []
        }
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
    const body = await req.json();
    const {
      videoSystemInstruction,
      imageSystemInstruction,
      defaultSpeechRate,
      defaultNegativePrompt,
      bannedWords
    } = body;

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
