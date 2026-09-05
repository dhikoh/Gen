import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getApiTranslator } from "@/lib/apiI18n";

const updateArchetypeSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  narrationMode: z.enum(["VOICE_OVER", "DIEGETIC_ONLY", "SILENT_TEXT_ONLY", "HYBRID"]).optional(),
  emotionalArcTemplate: z.string().trim().min(1).optional(),
  defaultIncludedSections: z.object({
    hook: z.boolean(),
    cta: z.boolean(),
    caption: z.boolean(),
    thumbnail: z.boolean(),
  }).optional(),
  compositionCategories: z.array(z.object({
    label: z.string().trim().min(1),
    required: z.boolean().default(false),
  })).optional(),
  durationCalcMode: z.enum(["NARRATION_WORDCOUNT", "SEGMENT_SELF_ESTIMATE", "HYBRID"]).optional(),
  cameraMovementRoleMap: z.record(z.string(), z.array(z.string())).optional().nullable(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.contentArchetype.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Archetype tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateArchetypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || t("invalidData") }, { status: 400 });
    }

    // Check duplicate name if name changed
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const duplicate = await prisma.contentArchetype.findUnique({
        where: { name: parsed.data.name },
      });
      if (duplicate) {
        return NextResponse.json({ error: "Nama archetype sudah digunakan" }, { status: 409 });
      }
    }

    const updated = await prisma.contentArchetype.update({
      where: { id },
      data: {
        ...(parsed.data.name && !existing.isSystem ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.narrationMode ? { narrationMode: parsed.data.narrationMode } : {}),
        ...(parsed.data.emotionalArcTemplate ? { emotionalArcTemplate: parsed.data.emotionalArcTemplate } : {}),
        ...(parsed.data.defaultIncludedSections ? { defaultIncludedSections: parsed.data.defaultIncludedSections } : {}),
        ...(parsed.data.compositionCategories ? { compositionCategories: parsed.data.compositionCategories } : {}),
        ...(parsed.data.durationCalcMode ? { durationCalcMode: parsed.data.durationCalcMode } : {}),
        ...(parsed.data.cameraMovementRoleMap !== undefined
          ? {
              cameraMovementRoleMap:
                parsed.data.cameraMovementRoleMap === null
                  ? Prisma.DbNull
                  : (parsed.data.cameraMovementRoleMap as Prisma.InputJsonValue),
            }
          : {}),
      },
    });

    return NextResponse.json({ success: true, archetype: updated });
  } catch (error) {
    console.error("PUT admin content-archetypes error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.contentArchetype.findUnique({
      where: { id },
      include: {
        _count: {
          select: { channels: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Archetype tidak ditemukan" }, { status: 404 });
    }

    if (existing.isSystem) {
      return NextResponse.json({ error: "Archetype bawaan sistem tidak dapat dihapus" }, { status: 400 });
    }

    if (existing._count.channels > 0) {
      return NextResponse.json({
        error: `Archetype tidak dapat dihapus karena sedang digunakan oleh ${existing._count.channels} channel`,
      }, { status: 400 });
    }

    await prisma.contentArchetype.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin content-archetypes error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
