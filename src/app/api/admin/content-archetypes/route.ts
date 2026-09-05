import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getApiTranslator } from "@/lib/apiI18n";

const archetypeSchema = z.object({
  name: z.string().trim().min(1, "Nama archetype wajib diisi"),
  description: z.string().trim().optional().nullable(),
  narrationMode: z.enum(["VOICE_OVER", "DIEGETIC_ONLY", "SILENT_TEXT_ONLY", "HYBRID"]).default("VOICE_OVER"),
  emotionalArcTemplate: z.string().trim().min(1).default("Hook -> Problem -> Solution -> CTA"),
  defaultIncludedSections: z.object({
    hook: z.boolean().default(true),
    cta: z.boolean().default(true),
    caption: z.boolean().default(true),
    thumbnail: z.boolean().default(true),
  }),
  compositionCategories: z.array(z.object({
    label: z.string().trim().min(1),
    required: z.boolean().default(false),
  })).default([]),
  durationCalcMode: z.enum(["NARRATION_WORDCOUNT", "SEGMENT_SELF_ESTIMATE", "HYBRID"]).default("HYBRID"),
  cameraMovementRoleMap: z.record(z.string(), z.array(z.string())).optional().nullable(),
});

export async function GET() {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
  }

  try {
    const archetypes = await prisma.contentArchetype.findMany({
      include: {
        _count: {
          select: { channels: true },
        },
      },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ success: true, archetypes });
  } catch (error) {
    console.error("GET admin content-archetypes error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = archetypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || t("invalidData") }, { status: 400 });
    }

    const { name, description, narrationMode, emotionalArcTemplate, defaultIncludedSections, compositionCategories, durationCalcMode, cameraMovementRoleMap } = parsed.data;

    const existing = await prisma.contentArchetype.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json({ error: "Archetype dengan nama ini sudah terdaftar" }, { status: 409 });
    }

    const created = await prisma.contentArchetype.create({
      data: {
        name,
        description: description || null,
        narrationMode,
        emotionalArcTemplate,
        defaultIncludedSections,
        compositionCategories,
        durationCalcMode,
        cameraMovementRoleMap: cameraMovementRoleMap
          ? (cameraMovementRoleMap as Prisma.InputJsonValue)
          : Prisma.DbNull,
        isSystem: false,
      },
    });

    return NextResponse.json({ success: true, archetype: created }, { status: 201 });
  } catch (error) {
    console.error("POST admin content-archetypes error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
