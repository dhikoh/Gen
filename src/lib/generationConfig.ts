import type { Prisma } from "@prisma/client";
import { isRecord } from "@/lib/typeGuards";

type JsonObject = Record<string, Prisma.InputJsonValue>;

function pickString(v: unknown, max: number): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
}
function pickNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}
function pickBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}
function pickStringArray(v: unknown, maxItems: number, maxLen: number): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === "string" && item.trim()) out.push(item.trim().slice(0, maxLen));
    if (out.length >= maxItems) break;
  }
  return out.length ? out : undefined;
}
function put(obj: JsonObject, key: string, value: Prisma.InputJsonValue | undefined): void {
  if (value !== undefined) obj[key] = value;
}

/**
 * Ambil snapshot pengaturan Generator Studio untuk satu channel dari User.generatorPreferences.
 * Hanya field whitelist yang disalin (tidak ada API key / data sensitif).
 * Mengembalikan null jika tidak ada state yang cocok.
 */
export function buildGenerationConfigSnapshot(
  prefs: unknown,
  channelId: string,
  now: Date = new Date()
): JsonObject | null {
  if (!isRecord(prefs)) return null;

  let state: Record<string, unknown> | null = null;
  let source = "";

  const channelStates = prefs.channelFormStates;
  const candidate = isRecord(channelStates) ? channelStates[channelId] : undefined;
  if (isRecord(candidate)) {
    state = candidate;
    source = "channelFormStates";
  } else if (isRecord(prefs.generatorFormState) && prefs.generatorFormState.channelId === channelId) {
    state = prefs.generatorFormState;
    source = "generatorFormState";
  }
  if (!state) return null;

  const out: JsonObject = {};
  put(out, "capturedAt", now.toISOString());
  put(out, "source", source);
  put(out, "outputLanguage", pickString(state.outputLanguage, 50));
  put(out, "rolePOV", pickString(state.rolePOV, 100));
  put(out, "customRolePOV", pickString(state.customRolePOV, 300));
  put(out, "toneOfVoice", pickString(state.toneOfVoice, 100));
  put(out, "visualStyleKey", pickString(state.visualStyleKey, 100));
  put(out, "cameraMovementEnabled", pickBool(state.cameraMovementEnabled));
  put(out, "cameraMovementPresets", pickStringArray(state.cameraMovementPresets, 20, 80));
  put(out, "cameraMovementCustom", pickString(state.cameraMovementCustom, 300));
  put(out, "cameraMovementProMode", pickBool(state.cameraMovementProMode));

  if (isRecord(state.videoConfig)) {
    const vc: JsonObject = {};
    put(vc, "targetPlatform", pickString(state.videoConfig.targetPlatform, 60));
    put(vc, "targetDurationSec", pickNumber(state.videoConfig.targetDurationSec));
    put(vc, "targetSceneCount", pickNumber(state.videoConfig.targetSceneCount));
    put(vc, "aspectRatio", pickString(state.videoConfig.aspectRatio, 20));
    put(vc, "speechRate", pickNumber(state.videoConfig.speechRate));
    if (Object.keys(vc).length > 0) out.videoConfig = vc;
  }

  return out;
}
