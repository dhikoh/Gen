import JSZip from "jszip";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import { storageGet } from "@/lib/storage";
import { storyboardError } from "@/lib/storyboardAccess";
import {
  extractStoryboardScenes,
  readAspectRatio,
  readCameraMovementEnabled,
  readStyleBible,
} from "@/lib/storyboardData";
import { buildPanelPrompt, buildStyleBiblePrompt } from "@/lib/storyboardPromptBuilder";

export const runtime = "nodejs";

// GET /api/drafts/[id]/storyboard/export — ZIP berisi panel_XX.webp + storyboard.md
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return storyboardError(401, "UNAUTHORIZED");

  const allowed = await applyRateLimit(`storyboard_export_${userId}`, 10, 60);
  if (!allowed) return storyboardError(429, "RATE_LIMITED");

  const { id: draftId } = await params;
  const draft = await prisma.draft.findUnique({
    where: { id: draftId },
    select: { id: true, userId: true, title: true, parsedData: true, storyboard: true, generationConfig: true },
  });
  if (!draft || draft.userId !== userId) return storyboardError(404, "DRAFT_NOT_FOUND");

  const panels = await prisma.storyboardPanel.findMany({
    where: { draftId },
    orderBy: { sceneNumber: "asc" },
    select: { sceneNumber: true, storageKey: true },
  });

  const scenes = extractStoryboardScenes(draft.parsedData);
  const aspectRatio = readAspectRatio(draft.generationConfig);
  const cameraMovementEnabled = readCameraMovementEnabled(draft.generationConfig);
  const bible = readStyleBible(draft.storyboard);

  const zip = new JSZip();
  const md: string[] = [`# Storyboard — ${draft.title ?? ""}`, "", "## Style Bible prompt", "", "```", buildStyleBiblePrompt(bible, aspectRatio, draft.title ?? ""), "```", ""];

  for (const scene of scenes) {
    md.push(`## Scene ${scene.index}`, "");
    if (scene.settingKamera) md.push(`Camera: ${scene.settingKamera}`, "");
    md.push("```", buildPanelPrompt(scene, scenes.length, { aspectRatio, cameraMovementEnabled }), "```", "");
  }
  zip.file("storyboard.md", md.join("\n"));

  for (const p of panels) {
    const data = await storageGet(p.storageKey);
    if (data) zip.file(`panel_${String(p.sceneNumber).padStart(2, "0")}.webp`, data);
  }

  const out = await zip.generateAsync({ type: "arraybuffer" });
  return new Response(out, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="storyboard-${draftId}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
