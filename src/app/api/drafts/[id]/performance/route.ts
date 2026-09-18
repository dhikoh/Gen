import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit, getClientIp } from "@/lib/rateLimit";

const performanceInputSchema = z.object({
  views: z.coerce.number().int().min(0, "Views tidak boleh negatif"),
  likes: z.coerce.number().int().min(0, "Likes tidak boleh negatif").default(0),
  comments: z.coerce.number().int().min(0, "Comments tidak boleh negatif").default(0),
  shares: z.coerce.number().int().min(0, "Shares tidak boleh negatif").default(0),
  avgWatchTimeSec: z.coerce.number().min(0).optional().nullable(),
  retentionPct: z.coerce.number().min(0).max(100, "Retensi maksimal 100%").optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

/**
 * GET: Mengambil catatan performa pasca-tayang untuk draft [id]
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const { id } = await params;
    const draft = await prisma.draft.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!draft) {
      return NextResponse.json({ error: t("draftNotFound") }, { status: 404 });
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    const performance = await prisma.draftPerformance.findUnique({
      where: { draftId: id },
    });

    return NextResponse.json({
      success: true,
      data: performance || null,
    });
  } catch (error) {
    console.error("GET draft performance error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

/**
 * POST / PUT: Menyimpan atau memperbarui data performa pasca-tayang (Upsert)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleSave(req, params);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleSave(req, params);
}

async function handleSave(
  req: Request,
  paramsPromise: Promise<{ id: string }>
) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(
      `draft_performance_${session.user.id}_${ip}`,
      30,
      60
    );
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const { id } = await paramsPromise;
    const draft = await prisma.draft.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!draft) {
      return NextResponse.json({ error: t("draftNotFound") }, { status: 404 });
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    const body = await req.json();
    const parsed = performanceInputSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: errorMsg || t("invalidData") }, { status: 400 });
    }

    const { views, likes, comments, shares, avgWatchTimeSec, retentionPct, notes } = parsed.data;

    const performance = await prisma.draftPerformance.upsert({
      where: { draftId: id },
      update: {
        views,
        likes,
        comments,
        shares,
        avgWatchTimeSec,
        retentionPct,
        notes: notes || null,
        recordedAt: new Date(),
        recordedByUserId: session.user.id,
      },
      create: {
        draftId: id,
        views,
        likes,
        comments,
        shares,
        avgWatchTimeSec,
        retentionPct,
        notes: notes || null,
        recordedByUserId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: performance,
      message: "Performa draft berhasil disimpan.",
    });
  } catch (error) {
    console.error("Save draft performance error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

/**
 * DELETE: Menghapus data performa draft
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(
      `del_draft_perf_${session.user.id}_${ip}`,
      20,
      60
    );
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const { id } = await params;
    const draft = await prisma.draft.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!draft) {
      return NextResponse.json({ error: t("draftNotFound") }, { status: 404 });
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    await prisma.draftPerformance.deleteMany({
      where: { draftId: id },
    });

    return NextResponse.json({
      success: true,
      message: "Data performa draft berhasil dihapus.",
    });
  } catch (error) {
    console.error("Delete draft performance error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
