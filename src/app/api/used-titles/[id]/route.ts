import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getApiTranslator } from "@/lib/apiI18n";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";

const patchSchema = z.object({
  title: z.string().min(1).max(500),
});

type RouteContext = { params: Promise<{ id: string }> };

// ── DELETE /api/used-titles/[id] ──────────────────────────────────────────────
export async function DELETE(req: Request, context: RouteContext) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`used_titles_delete_${session.user.id}_${ip}`, 30, 60);
    if (!isAllowed) return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });

    const { id } = await context.params;

    const record = await prisma.usedTitle.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: t("notFound") }, { status: 404 });

    // Ownership check — SUPERADMIN may delete any; regular users own by userId
    if (session.user.role !== "SUPERADMIN" && record.userId !== session.user.id) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
    }

    await prisma.usedTitle.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("UsedTitle DELETE error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

// ── PATCH /api/used-titles/[id] ───────────────────────────────────────────────
// Body: { title: string }
// Constraint: channelId + type + title must remain unique — returns 409 on conflict.
export async function PATCH(req: Request, context: RouteContext) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`used_titles_patch_${session.user.id}_${ip}`, 30, 60);
    if (!isAllowed) return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });

    const { id } = await context.params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const record = await prisma.usedTitle.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: t("notFound") }, { status: 404 });

    if (session.user.role !== "SUPERADMIN" && record.userId !== session.user.id) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
    }

    // Check uniqueness constraint before update
    const conflict = await prisma.usedTitle.findUnique({
      where: {
        channelId_type_title: {
          channelId: record.channelId,
          type: record.type,
          title: parsed.data.title,
        },
      },
    });
    if (conflict && conflict.id !== id) {
      return NextResponse.json({ error: t("duplicateTitle") }, { status: 409 });
    }

    const updated = await prisma.usedTitle.update({
      where: { id },
      data: { title: parsed.data.title },
    });

    return NextResponse.json({ success: true, record: updated }, { status: 200 });
  } catch (error) {
    console.error("UsedTitle PATCH error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
