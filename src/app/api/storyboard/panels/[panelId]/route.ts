import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import { storageDelete, storageGet } from "@/lib/storage";
import { checkStoryboardAccess, storyboardError } from "@/lib/storyboardAccess";

export const runtime = "nodejs";

// GET /api/storyboard/panels/[panelId]?size=thumb|full — hanya pemilik yang boleh melihat.
// Sengaja TANPA rate limit: halaman storyboard memuat banyak thumbnail sekaligus,
// dan applyRateLimit membatasi maks 30 request/menit. Keamanan dijaga oleh login + cek kepemilikan.
export async function GET(req: Request, { params }: { params: Promise<{ panelId: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return storyboardError(401, "UNAUTHORIZED");

  const { panelId } = await params;
  const panel = await prisma.storyboardPanel.findUnique({
    where: { id: panelId },
    select: { userId: true, storageKey: true, thumbKey: true, mime: true },
  });
  if (!panel || panel.userId !== userId) return storyboardError(404, "DRAFT_NOT_FOUND");

  const size = new URL(req.url).searchParams.get("size");
  const key = size === "thumb" ? panel.thumbKey : panel.storageKey;

  const data = await storageGet(key);
  if (!data) return storyboardError(404, "DRAFT_NOT_FOUND");

  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": panel.mime,
      "Content-Length": String(data.length),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// DELETE /api/storyboard/panels/[panelId]
export async function DELETE(_req: Request, { params }: { params: Promise<{ panelId: string }> }) {
  const access = await checkStoryboardAccess();
  if (!access.ok) return access.response;
  const userId = access.userId;

  const allowed = await applyRateLimit(`storyboard_delete_${userId}`, 30, 60);
  if (!allowed) return storyboardError(429, "RATE_LIMITED");

  const { panelId } = await params;
  const panel = await prisma.storyboardPanel.findUnique({
    where: { id: panelId },
    select: { id: true, userId: true, storageKey: true, thumbKey: true },
  });
  if (!panel || panel.userId !== userId) return storyboardError(404, "DRAFT_NOT_FOUND");

  // DB dulu, baru file: lebih baik ada file yatim (dibersihkan cron) daripada baris DB tanpa file.
  await prisma.storyboardPanel.delete({ where: { id: panel.id } });
  await storageDelete(panel.storageKey).catch((err) => console.error("[storyboard] hapus file gagal:", err));
  await storageDelete(panel.thumbKey).catch((err) => console.error("[storyboard] hapus thumb gagal:", err));

  return NextResponse.json({ success: true });
}
