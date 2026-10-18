import type { VideoTimeline } from "@/types/videoTimeline";
import { formatTime } from "@/lib/formatTime";

export type FullVideoPromptFormat = "cinematic" | "script_to_video" | "story";

export interface FullVideoPromptOptions {
  format?: FullVideoPromptFormat;
  aspectRatio?: string;
  includeTimestamps?: boolean;
  includeNarration?: boolean;
  includeOverlay?: boolean;
  includeTransitions?: boolean;
  additionalInstructions?: string;
}

/**
 * Format detik ke format mm:ss (misal: 00:00, 01:23)
 */
function formatTimecode(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Membangun 1 prompt video utuh dari Scene 1 hingga scene terakhir
 * untuk digunakan langsung pada AI Video Generator eksternal
 * (Sora, Runway Gen-3, Kling AI, Luma Dream Machine, InVideo AI, CapCut, dll).
 */
export function buildFullVideoAiPrompt(
  timeline: VideoTimeline,
  opts?: FullVideoPromptOptions
): string {
  if (!timeline || !timeline.scenes || timeline.scenes.length === 0) {
    return "";
  }

  const format = opts?.format ?? "cinematic";
  const ar = opts?.aspectRatio || "16:9";
  const includeTimestamps = opts?.includeTimestamps ?? true;
  const includeNarration = opts?.includeNarration ?? true;
  const includeOverlay = opts?.includeOverlay ?? true;
  const includeTransitions = opts?.includeTransitions ?? true;
  const totalDuration = timeline.totalDurationSec;
  const sceneCount = timeline.scenes.length;

  const lines: string[] = [];

  if (format === "cinematic") {
    // ── FORMAT 1: CINEMATIC MULTI-SCENE / TEMPORAL VIDEO PROMPT ──
    // Dirancang untuk model Generative Video lanjutan (Sora, Runway, Kling, Luma)
    lines.push("# MASTER CINEMATIC VIDEO GENERATION PROMPT");
    lines.push("");
    lines.push(`Aspect Ratio: ${ar}`);
    lines.push(`Total Duration: ${totalDuration}s (${formatTime(totalDuration)})`);
    lines.push(`Total Sequences: ${sceneCount} continuous scenes`);
    lines.push("Camera Style: Dynamic motivated cinematic camera movement, 8k resolution, photorealistic, seamless sequence continuity.");
    lines.push("");
    lines.push("## CORE PRODUCTION INSTRUCTIONS");
    lines.push("Generate one continuous, cohesive, single video encompassing all consecutive scenes below without sudden disconnected cuts. Maintain identical character appearance, art direction, color grading, lighting temperature, and environmental physics across every transition.");
    lines.push("");

    if (opts?.additionalInstructions?.trim()) {
      lines.push("## SPECIAL USER DIRECTIVES");
      lines.push(opts.additionalInstructions.trim());
      lines.push("");
    }

    lines.push("## SEQUENTIAL SCENE BREAKDOWN");
    lines.push("");

    timeline.scenes.forEach((scene, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === sceneCount - 1;
      const nextScene = !isLast ? timeline.scenes[idx + 1] : null;

      const startCode = formatTimecode(scene.startOffsetSec);
      const endCode = formatTimecode(scene.startOffsetSec + scene.durationSec);
      const timestampStr = includeTimestamps ? ` [${startCode} - ${endCode}]` : "";

      lines.push(`### SEQUENCE ${scene.sceneNumber}${timestampStr} (Duration: ${scene.durationSec}s)`);

      if (scene.chapterTitle) {
        lines.push(`Chapter / Theme: ${scene.chapterTitle}`);
      }

      if (scene.sceneContext && scene.sceneContext !== "—") {
        lines.push(`Scene Context: ${scene.sceneContext}`);
      }

      const visualText = scene.visualPrompt?.trim() || "Cinematic visual shot";
      lines.push(`Visual Action: ${visualText}`);

      if (includeOverlay && scene.textOverlay && scene.textOverlay !== "—") {
        lines.push(`On-Screen Typography: "${scene.textOverlay}" (clean modern lower-third/subtle cinematic placement)`);
      }

      if (includeNarration && scene.narration && scene.narration !== "—") {
        lines.push(`Voiceover / Audio Beat: "${scene.narration}"`);
      }

      if (includeTransitions) {
        if (isLast) {
          lines.push("Transition: Fade to natural resolution / final concluding hold.");
        } else if (nextScene) {
          lines.push(`Transition to Sequence ${nextScene.sceneNumber}: Smooth fluid camera trajectory & continuous spatial pacing.`);
        }
      }

      lines.push("");
    });

  } else if (format === "script_to_video") {
    // ── FORMAT 2: ALL-IN-ONE SCRIPT-TO-VIDEO ──
    // Dirancang untuk InVideo AI, CapCut Script-to-Video, Pictory
    lines.push("# SCRIPT-TO-VIDEO PRODUCTION SPECIFICATION");
    lines.push("");
    lines.push(`Target Aspect Ratio: ${ar}`);
    lines.push(`Target Video Duration: ~${totalDuration} seconds (${formatTime(totalDuration)})`);
    lines.push(`Number of Scenes: ${sceneCount}`);
    lines.push("");
    lines.push("## SUMMARY & CREATIVE BRIEF");
    lines.push("Create a complete, fully-edited video with synced narration, cinematic b-roll visuals, clean text overlays, and cohesive background music that matches the pacing of each scene.");
    lines.push("");

    if (opts?.additionalInstructions?.trim()) {
      lines.push("## CUSTOM INSTRUCTIONS");
      lines.push(opts.additionalInstructions.trim());
      lines.push("");
    }

    lines.push("## SCENE BY SCENE SCRIPT");
    lines.push("");

    timeline.scenes.forEach((scene) => {
      const startCode = formatTimecode(scene.startOffsetSec);
      const endCode = formatTimecode(scene.startOffsetSec + scene.durationSec);
      const timeStr = includeTimestamps ? ` (${startCode} - ${endCode})` : "";

      lines.push(`[SCENE ${scene.sceneNumber}${timeStr} - ${scene.durationSec}s]`);

      if (scene.chapterTitle) {
        lines.push(`Topik: ${scene.chapterTitle}`);
      }

      if (includeNarration && scene.narration && scene.narration !== "—") {
        lines.push(`Voiceover (Narasi): ${scene.narration}`);
      }

      const visualText = scene.visualPrompt?.trim() || "-";
      lines.push(`Visual (Footage/B-Roll): ${visualText}`);

      if (includeOverlay && scene.textOverlay && scene.textOverlay !== "—") {
        lines.push(`Text on Screen (Overlay): "${scene.textOverlay}"`);
      }

      lines.push("");
    });

  } else {
    // ── FORMAT 3: CONTINUOUS STORY & NARRATIVE FLOW ──
    // Format mengalir sinematik langsung untuk storytelling AI
    lines.push(`# CONTINUOUS STORYLINE PROMPT (${ar}, ${totalDuration}s)`);
    lines.push("");
    lines.push("A continuous storytelling video progressing seamlessly through the following chronological acts:");
    lines.push("");

    if (opts?.additionalInstructions?.trim()) {
      lines.push(`Note: ${opts.additionalInstructions.trim()}\n`);
    }

    timeline.scenes.forEach((scene) => {
      const timeStr = includeTimestamps ? ` [at ${formatTimecode(scene.startOffsetSec)}]` : "";
      const visualPart = scene.visualPrompt?.trim() || "";
      const narrPart = (includeNarration && scene.narration && scene.narration !== "—")
        ? ` with dialogue/voiceover: "${scene.narration}"`
        : "";
      const overlayPart = (includeOverlay && scene.textOverlay && scene.textOverlay !== "—")
        ? ` (On-screen text: "${scene.textOverlay}")`
        : "";

      lines.push(`Scene ${scene.sceneNumber}${timeStr}: ${visualPart}${narrPart}${overlayPart}.`);
      lines.push("");
    });
  }

  // Teks judul terpakai (blacklist topic) jika ada
  if (timeline.usedTitleTexts && timeline.usedTitleTexts.length > 0) {
    lines.push("---");
    lines.push("DO NOT include or repeat the following already used channel topics:");
    timeline.usedTitleTexts.forEach((t) => {
      lines.push(`- ${t}`);
    });
  }

  return lines.join("\n").trim();
}
