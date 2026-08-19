import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  label: z.string().trim().min(1, "Label kategori niche wajib diisi"),
});

export async function GET() {
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
    return NextResponse.json({ error: "Gagal mengambil kategori niche." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      return NextResponse.json({ error: error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }
    console.error("POST /api/niche-category-presets error:", error);
    return NextResponse.json({ error: "Gagal menambahkan kategori niche." }, { status: 500 });
  }
}
