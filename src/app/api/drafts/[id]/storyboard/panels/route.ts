import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import { detectImageKind } from "@/lib/imageKind";
import { processPanelImage } from "@/lib/imageProcessing";
import { storageDelete, storagePut } from "@/lib/storage";
import { checkStoryboardAccess, storyboardError } from "@/lib/storyboardAccess";
import {
  STORYBOARD_MAX_FILE_BYTES,
  STORYBOARD_MAX_PANELS_PER_DRAFT,
  STORYBOARD_MAX_SCENE_NUMBER,
  STORYBOARD_MAX_USER_BYTES,
} from "@/lib/storyboardLimits";

export const runtime = "nodejs";

const sceneNumberSchema = z.coerce.number().int().min(1).max(STORYBOARD_MAX_SCENE_NUMBER);

// POST /api/drafts/[id]/storyboard/panels — unggah (atau ganti) satu gambar panel untuk satu scene.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await checkStoryboardAccess();
  if (!access.ok) return access.response;
  const userId = access.userId;

  const allowed = await applyRateLimit(`storyboard_upload_${userId}`, 30, 60);
  if (!allowed) return storyboardError(429, "RATE_LIMITED");

  const { id: draftId } = await params;

  // Kepemilikan: draft harus milik user dan bertipe VIDEO. Jika tidak → 404 (jangan bocorkan keberadaan).
  const draft = await prisma.draft.findUnique({
    where: { id: draftId },
    select: { id: true, userId: true, type: true },
  });
  if (!draft || draft.userId !== userId || draft.type !== "VIDEO") {
    return storyboardError(404, "DRAFT_NOT_FOUND");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return storyboardError(400, "INVALID_INPUT");
  }

  const file = form.get("file");
  const sceneParsed = sceneNumberSchema.safeParse(form.get("sceneNumber"));
  if (!(file instanceof File) || !sceneParsed.success) {
    return storyboardError(400, "INVALID_INPUT");
  }
  const sceneNumber = sceneParsed.data;

  if (file.size <= 0 || file.size > STORYBOARD_MAX_FILE_BYTES) {
    return storyboardError(413, "FILE_TOO_LARGE");
  }

  const input = Buffer.from(await file.arrayBuffer());
  if (!detectImageKind(input)) {
    return storyboardError(400, "INVALID_IMAGE");
  }

  const existing = await prisma.storyboardPanel.findMany({
    where: { draftId },
    select: { id: true, sceneNumber: true, bytes: true, storageKey: true, thumbKey: true },
  });
  const replacing = existing.find((p) => p.sceneNumber === sceneNumber);
  if (!replacing && existing.length >= STORYBOARD_MAX_PANELS_PER_DRAFT) {
    return storyboardError(409, "TOO_MANY_PANELS");
  }

  const usage = await prisma.storyboardPanel.aggregate({
    where: { userId },
    _sum: { bytes: true },
  });
  const usedBytes = (usage._sum.bytes ?? 0) - (replacing?.bytes ?? 0);

  let processed;
  try {
    processed = await processPanelImage(input);
  } catch {
    return storyboardError(400, "INVALID_IMAGE");
  }

  if (usedBytes + processed.main.length > STORYBOARD_MAX_USER_BYTES) {
    return storyboardError(413, "QUOTA_EXCEEDED");
  }

  // Nama file dibuat SERVER (acak). Nama dari client tidak pernah dipakai.
  const rand = crypto.randomBytes(12).toString("hex");
  const storageKey = `storyboard/${userId}/${draftId}/${rand}.webp`;
  const thumbKey = `storyboard/${userId}/${draftId}/${rand}_t.webp`;

  try {
    await storagePut(storageKey, processed.main);
    await storagePut(thumbKey, processed.thumb);
  } catch (err) {
    console.error("[storyboard] gagal menulis file:", err);
    await storageDelete(storageKey).catch(() => undefined);
    await storageDelete(thumbKey).catch(() => undefined);
    return storyboardError(500, "STORAGE_ERROR");
  }

  try {
    const panel = await prisma.storyboardPanel.upsert({
      where: { draftId_sceneNumber: { draftId, sceneNumber } },
      create: {
        draftId,
        userId,
        sceneNumber,
        storageKey,
        thumbKey,
        mime: "image/webp",
        bytes: processed.main.length,
        width: processed.width,
        height: processed.height,
      },
      update: {
        storageKey,
        thumbKey,
        mime: "image/webp",
        bytes: processed.main.length,
        width: processed.width,
        height: processed.height,
      },
      select: { id: true, sceneNumber: true, width: true, height: true, bytes: true, updatedAt: true },
    });

    // File lama (jika mengganti) dihapus setelah DB sukses. Gagal hapus tidak fatal (dibersihkan cron).
    if (replacing) {
      await storageDelete(replacing.storageKey).catch(() => undefined);
      await storageDelete(replacing.thumbKey).catch(() => undefined);
    }

    return NextResponse.json({ success: true, panel }, { status: 201 });
  } catch (err) {
    console.error("[storyboard] gagal menyimpan DB:", err);
    await storageDelete(storageKey).catch(() => undefined);
    await storageDelete(thumbKey).catch(() => undefined);
    return storyboardError(500, "SERVER_ERROR");
  }
}
