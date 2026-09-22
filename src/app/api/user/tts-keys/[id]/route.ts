import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";

// Next.js 16: params is now a Promise
type RouteContext = { params: Promise<{ id: string }> };

// ─── PATCH: Update label, isActive, atau priority ─────────────────────────────
const patchSchema = z.object({
  label: z.string().max(60).optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).max(99).optional(),
});

export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Ownership check
  const existing = await prisma.userApiKey.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Key tidak ditemukan." }, { status: 404 });
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Input tidak valid." },
      { status: 400 }
    );
  }

  const { label, isActive, priority } = parsed.data;
  if (label === undefined && isActive === undefined && priority === undefined) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate." }, { status: 400 });
  }

  const updated = await prisma.userApiKey.update({
    where: { id },
    data: {
      ...(label !== undefined && { label }),
      ...(isActive !== undefined && { isActive }),
      ...(priority !== undefined && { priority }),
    },
    select: {
      id: true,
      label: true,
      keyFingerprint: true,
      isActive: true,
      priority: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    key: { ...updated, maskedKey: `\u2022\u2022\u2022\u2022 ${updated.keyFingerprint}` },
  });
}

// ─── DELETE: Hapus API key ────────────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.userApiKey.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Key tidak ditemukan." }, { status: 404 });
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.userApiKey.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
