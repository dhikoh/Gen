import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  label: z.string().trim().min(1, "Label platform wajib diisi"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    let options = await prisma.platformOption.findMany({
      where: {
        OR: [
          { isSystem: true },
          ...(userId ? [{ createdByUserId: userId }] : []),
        ],
      },
      orderBy: [{ isSystem: "desc" }, { label: "asc" }],
    });

    if (options.length === 0) {
      const defaultPlatforms = [
        "TikTok",
        "Instagram Reels",
        "YouTube Shorts",
        "YouTube Long",
        "Facebook Video",
        "LinkedIn",
        "Twitter / X",
      ];
      options = defaultPlatforms.map((label, idx) => ({
        id: `sys-platform-${idx}`,
        label,
        isSystem: true,
        createdByUserId: null,
        createdAt: new Date(),
      }));
    }

    return NextResponse.json({ success: true, options });
  } catch (error) {
    console.error("GET /api/platform-options error:", error);
    return NextResponse.json({ error: "Gagal mengambil daftar opsi platform." }, { status: 500 });
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

    const existing = await prisma.platformOption.findFirst({
      where: {
        label,
        OR: [{ isSystem: true }, { createdByUserId: session.user.id }],
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, option: existing });
    }

    const option = await prisma.platformOption.create({
      data: {
        label,
        isSystem: false,
        createdByUserId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, option });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }
    console.error("POST /api/platform-options error:", error);
    return NextResponse.json({ error: "Gagal menambahkan opsi platform." }, { status: 500 });
  }
}
