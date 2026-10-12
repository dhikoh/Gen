import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import { checkStoryboardAccess, storyboardError } from "@/lib/storyboardAccess";

export const runtime = "nodejs";

const bodySchema = z.object({
  styleBible: z.object({
    artStyle: z.enum(["bw_sketch", "watercolor", "cinematic_semi_real", "cartoon_2d", "custom"]),
    customStyle: z.string().max(300).default(""),
    characters: z.string().max(1500).default(""),
    palette: z.string().max(300).default(""),
    locations: z.string().max(800).default(""),
    extraRules: z.string().max(600).default(""),
  }),
});

// PUT /api/drafts/[id]/storyboard — simpan Style Bible ke Draft.storyboard
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await checkStoryboardAccess();
  if (!access.ok) return access.response;
  const userId = access.userId;

  const allowed = await applyRateLimit(`storyboard_bible_${userId}`, 30, 60);
  if (!allowed) return storyboardError(429, "RATE_LIMITED");

  const { id: draftId } = await params;
  const draft = await prisma.draft.findUnique({
    where: { id: draftId },
    select: { id: true, userId: true, type: true },
  });
  if (!draft || draft.userId !== userId || draft.type !== "VIDEO") {
    return storyboardError(404, "DRAFT_NOT_FOUND");
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return storyboardError(400, "INVALID_INPUT");

  await prisma.draft.update({
    where: { id: draftId },
    data: { storyboard: { styleBible: parsed.data.styleBible, updatedAt: new Date().toISOString() } },
  });

  return NextResponse.json({ success: true });
}
