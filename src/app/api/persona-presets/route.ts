import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getApiTranslator } from "@/lib/apiI18n";

const createSchema = z.object({
  label: z.string().trim().min(1),
  description: z.string().trim().optional(),
});

export async function GET() {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    let presets = await prisma.personaPreset.findMany({
      where: {
        OR: [
          { isSystem: true },
          ...(userId ? [{ createdByUserId: userId }] : []),
        ],
      },
      orderBy: [{ isSystem: "desc" }, { label: "asc" }],
    });

    if (presets.length === 0) {
      const defaultPersonas = [
        "Expert Storyteller (Edukasi & Inspirasi)",
        "Energetic Reviewer (Review Produk & Unboxing)",
        "Casual Friend (Santai & Relatable)",
        "Educational Tutor (Penjelasan Step-by-Step)",
        "Professional Instructor (Formal & Otoritatif)",
        "Motivational Coach (Semangat & Solutif)",
        "Direct Sales Specialist (Persuasif & High-Converting)",
      ];
      presets = defaultPersonas.map((label, idx) => ({
        id: `sys-persona-${idx}`,
        label,
        description: null,
        isSystem: true,
        createdByUserId: null,
        createdAt: new Date(),
      }));
    }

    return NextResponse.json({ success: true, presets });
  } catch (error) {
    console.error("GET /api/persona-presets error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { label, description } = createSchema.parse(body);

    const existing = await prisma.personaPreset.findFirst({
      where: {
        label,
        OR: [{ isSystem: true }, { createdByUserId: session.user.id }],
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, preset: existing });
    }

    const preset = await prisma.personaPreset.create({
      data: {
        label,
        description: description || null,
        isSystem: false,
        createdByUserId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, preset });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }
    console.error("POST /api/persona-presets error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }

    const preset = await prisma.personaPreset.findUnique({ where: { id } });

    if (!preset) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    if (preset.isSystem) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    if (preset.createdByUserId !== session.user.id && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    await prisma.personaPreset.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/persona-presets error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
