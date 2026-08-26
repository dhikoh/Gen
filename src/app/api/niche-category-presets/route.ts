import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getApiTranslator } from "@/lib/apiI18n";
import { applyRateLimit } from "@/lib/rateLimit";

const createSchema = z.object({
  label: z.string().trim().min(1),
});

export async function GET() {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    let presets = await prisma.nicheCategoryPreset.findMany({
      where: {
        OR: [
          { isSystem: true },
          ...(userId ? [{ createdByUserId: userId }] : []),
        ],
      },
      orderBy: [{ isSystem: "desc" }, { label: "asc" }],
    });

    if (presets.length === 0) {
      const defaultNiches = [
        "Teknologi & Gadget",
        "Bisnis & Finance",
        "Edukasi & Karir",
        "Kesehatan & Fitness",
        "Kecantikan & Fashion",
        "Kuliner & Foodie",
        "Travel & Petualangan",
        "Gaming & Esports",
        "Parenting & Keluarga",
        "Hiburan & Life Hack",
      ];
      presets = defaultNiches.map((label, idx) => ({
        id: `sys-niche-${idx}`,
        label,
        isSystem: true,
        createdByUserId: null,
        createdAt: new Date(),
      }));
    }

    return NextResponse.json({ success: true, presets });
  } catch (error) {
    console.error("GET /api/niche-category-presets error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  // Fix audit 6.2: tambah rate limit ke POST endpoint preset (20 req/60s)
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const isAllowed = await applyRateLimit(`preset_create_${session.user.id}_${ip}`, 20, 60);
  if (!isAllowed) return NextResponse.json({ error: t("rateLimit") }, { status: 429 });

  try {
    const body = await req.json();
    const { label } = createSchema.parse(body);

    const existing = await prisma.nicheCategoryPreset.findFirst({
      where: {
        label,
        OR: [{ isSystem: true }, { createdByUserId: session.user.id }],
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, preset: existing });
    }

    const preset = await prisma.nicheCategoryPreset.create({
      data: {
        label,
        isSystem: false,
        createdByUserId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, preset });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }
    console.error("POST /api/niche-category-presets error:", error);
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

    const preset = await prisma.nicheCategoryPreset.findUnique({ where: { id } });

    if (!preset) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    if (preset.isSystem) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    if (preset.createdByUserId !== session.user.id && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    await prisma.nicheCategoryPreset.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/niche-category-presets error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
