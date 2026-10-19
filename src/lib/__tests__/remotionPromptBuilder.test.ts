import { describe, expect, it } from "vitest";
import * as ts from "typescript";
import {
  REMOTION_ISSUE_CODES,
  buildRemotionBoilerplate,
  buildRemotionPrompt,
  componentNameFromTitle,
  computeRemotionPlan,
  isValidComponentName,
  validateRemotionCode,
  type RemotionFps,
  type RemotionIssue,
} from "../remotionPromptBuilder";
import type { VideoTimeline, VideoTimelineScene } from "@/types/videoTimeline";

interface FakeScene {
  durationSec: number;
  textOverlay?: string;
  hasAudio?: boolean;
}

const FAKE_AUDIO = "QUJDREVGRw==".repeat(300); // payload base64 palsu

function makeTimeline(scenes: readonly FakeScene[]): VideoTimeline {
  let offset = 0;
  return {
    version: 1,
    totalDurationSec: scenes.reduce(
      (acc, s) => acc + (Number.isFinite(s.durationSec) ? s.durationSec : 0),
      0,
    ),
    usedTitleIds: [],
    usedTitleTexts: [],
    exportedAt: new Date().toISOString(),
    draftId: "draft-1",
    channelId: null,
    scenes: scenes.map((s, idx) => {
      const dur = s.durationSec;
      const scene: VideoTimelineScene = {
        sceneNumber: idx + 1,
        narration: "narration",
        durationSec: dur,
        startOffsetSec: offset,
        visualPrompt: "visual",
        sceneContext: "context",
        textOverlay: s.textOverlay ?? "Hello",
        audioRef: s.hasAudio === true ? FAKE_AUDIO : null,
        chapter: null,
        chapterTitle: null,
      };
      offset += Number.isFinite(dur) ? dur : 0;
      return scene;
    }),
  };
}

const codes = (issues: RemotionIssue[]): string[] => issues.map((i) => i.code);

const NORMAL = makeTimeline([
  { durationSec: 1.51, textOverlay: "One", hasAudio: true },
  { durationSec: 0.333, textOverlay: "Two" },
  { durationSec: 2.999, textOverlay: "Three", hasAudio: true },
  { durationSec: 7.77, textOverlay: "Four" },
]);

describe("computeRemotionPlan", () => {
  for (const fps of [30, 60] as RemotionFps[]) {
    it("menghasilkan integer murni pada " + fps + " fps", () => {
      const plan = computeRemotionPlan(NORMAL, fps);
      expect(Number.isInteger(plan.totalFrames)).toBe(true);
      for (const s of plan.scenes) {
        expect(Number.isInteger(s.from)).toBe(true);
        expect(Number.isInteger(s.durationInFrames)).toBe(true);
      }
    });
  }

  it("total = jumlah durasi, tanpa gap dan tanpa overlap", () => {
    const plan = computeRemotionPlan(NORMAL, 30);
    const sum = plan.scenes.reduce((acc, s) => acc + s.durationInFrames, 0);
    expect(plan.totalFrames).toBe(sum);
    plan.scenes.forEach((s, i) => {
      const prev = plan.scenes[i - 1];
      if (prev !== undefined) expect(s.from).toBe(prev.from + prev.durationInFrames);
      else expect(s.from).toBe(0);
    });
  });

  it("durasi 0, negatif, NaN, Infinity menjadi minimal 1 frame", () => {
    const plan = computeRemotionPlan(
      makeTimeline([
        { durationSec: 0 },
        { durationSec: -5 },
        { durationSec: Number.NaN },
        { durationSec: Number.POSITIVE_INFINITY },
      ]),
      30,
    );
    for (const s of plan.scenes) expect(s.durationInFrames).toBeGreaterThanOrEqual(1);
  });

  it("timeline kosong aman (totalFrames >= 1)", () => {
    const plan = computeRemotionPlan(makeTimeline([]), 30);
    expect(plan.scenes).toHaveLength(0);
    expect(plan.totalFrames).toBeGreaterThanOrEqual(1);
  });
});

describe("buildRemotionPrompt", () => {
  it("memuat aturan clamp, spring guard, dan frame lokal", () => {
    const p = buildRemotionPrompt(NORMAL);
    expect(p).toContain("extrapolateLeft: 'clamp'");
    expect(p).toContain("extrapolateRight: 'clamp'");
    expect(p).toContain("Math.max(0, frame - delayInFrames)");
    expect(p).toContain("LOCAL frame");
  });

  it("9:16 memuat safe zone 240/100/120/60 dan dimensi 1080x1920", () => {
    const p = buildRemotionPrompt(NORMAL, { aspectRatio: "9:16" });
    for (const n of ["240", "100", "120", "60", "1080x1920"]) expect(p).toContain(n);
  });

  it("16:9 memuat 80px dan 1920x1080", () => {
    const p = buildRemotionPrompt(NORMAL, { aspectRatio: "16:9" });
    expect(p).toContain("80px");
    expect(p).toContain("1920x1080");
  });

  it("tidak melempar untuk timeline kosong", () => {
    expect(() => buildRemotionPrompt(makeTimeline([]))).not.toThrow();
  });

  it("tidak memuat base64/data-URI audio", () => {
    const p = buildRemotionPrompt(NORMAL);
    expect(p).not.toContain(FAKE_AUDIO);
    expect(p).not.toMatch(/data:audio|base64,/i);
    expect(p).toContain('staticFile("audio/scene-1.wav")');
  });

  it("additionalInstructions dibatasi 2000 karakter", () => {
    const p = buildRemotionPrompt(NORMAL, { additionalInstructions: "x".repeat(5000) });
    expect(p).not.toContain("x".repeat(2001));
  });
});

describe("buildRemotionBoilerplate", () => {
  it("lolos validator tanpa error", () => {
    const result = validateRemotionCode(buildRemotionBoilerplate(NORMAL));
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("lolos validator untuk semua tema dan kedua rasio", () => {
    for (const theme of ["modern", "cyberpunk", "documentary", "kinetic"] as const) {
      for (const aspectRatio of ["16:9", "9:16"] as const) {
        const r = validateRemotionCode(buildRemotionBoilerplate(NORMAL, { theme, aspectRatio, fps: 60 }));
        expect(r.errors).toEqual([]);
      }
    }
  });

  it("setiap interpolate ter-clamp (CLAMP terdefinisi dan dipakai)", () => {
    const code = buildRemotionBoilerplate(NORMAL);
    expect(code).toContain('extrapolateLeft: "clamp"');
    expect(code).toContain('extrapolateRight: "clamp"');
    const calls = code.match(/interpolate\(/g) ?? [];
    expect(calls.length).toBeGreaterThan(0);
    expect(codes(validateRemotionCode(code).errors)).not.toContain("interpolateNoClamp");
  });

  it("memuat fade guard dan spring guard", () => {
    const code = buildRemotionBoilerplate(NORMAL);
    expect(code).toContain("Math.floor((scene.durationInFrames - 1) / 2)");
    expect(code).toContain("Math.max(0, frame - ENTRANCE_DELAY_FRAMES)");
  });

  it("safe zone 9:16 dan 16:9 muncul di kode", () => {
    expect(buildRemotionBoilerplate(NORMAL, { aspectRatio: "9:16" })).toContain("bottom: 240");
    expect(buildRemotionBoilerplate(NORMAL, { aspectRatio: "16:9" })).toContain("top: 80");
  });

  it("timeline kosong tetap menghasilkan kode valid dengan durationInFrames 1", () => {
    const code = buildRemotionBoilerplate(makeTimeline([]));
    expect(code).toContain("durationInFrames: 1,");
    expect(validateRemotionCode(code).valid).toBe(true);
  });

  it("componentName tidak valid memakai fallback MainVideo", () => {
    for (const bad of ["my-video", "1abc", "class", "A; evil()", "Composition", ""]) {
      const code = buildRemotionBoilerplate(NORMAL, { componentName: bad });
      expect(code).toContain("export const MainVideo: React.FC");
    }
    expect(buildRemotionBoilerplate(NORMAL, { componentName: "PromoVideo" })).toContain(
      "export const PromoVideo: React.FC",
    );
  });

  it("teks berbahaya tidak merusak syntax", () => {
    const hostile = 'He said "hi" `x` ${evil()} line1\nline2 </script> // not a comment';
    const code = buildRemotionBoilerplate(makeTimeline([{ durationSec: 2, textOverlay: hostile }]));
    expect(code).toContain(JSON.stringify(hostile));
    expect(validateRemotionCode(code).errors).toEqual([]);
  });

  it("tidak memuat base64/data-URI audio dan memakai staticFile", () => {
    const code = buildRemotionBoilerplate(NORMAL);
    expect(code).not.toContain(FAKE_AUDIO);
    expect(code).not.toMatch(/data:audio|base64,/i);
    expect(code).toContain('audioSrc: "audio/scene-1.wav"');
    expect(code).toContain("audioSrc: null");
  });

  it("frame di kode adalah integer", () => {
    const code = buildRemotionBoilerplate(NORMAL);
    expect(code).not.toMatch(/\b(?:from|durationInFrames):\s*-?\d*\.\d+/);
  });

  it("boilerplate lolos transpile tanpa diagnostics sintaks", () => {
    const out = ts.transpileModule(buildRemotionBoilerplate(NORMAL), {
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    });
    expect(out.diagnostics ?? []).toHaveLength(0);
  });
});

describe("componentName helpers", () => {
  it("isValidComponentName", () => {
    expect(isValidComponentName("MainVideo")).toBe(true);
    expect(isValidComponentName("my-video")).toBe(false);
    expect(isValidComponentName("Sequence")).toBe(false);
  });
  it("componentNameFromTitle selalu valid", () => {
    expect(isValidComponentName(componentNameFromTitle("Promo Café 2026!"))).toBe(true);
    expect(componentNameFromTitle("")).toBe("MainVideo");
    expect(componentNameFromTitle("123 go")).toBe("Video123Go");
  });
});

const VALID_BASE = [
  'import React from "react";',
  'import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";',
  'const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;',
  "export const Demo: React.FC = () => {",
  "  const frame = useCurrentFrame();",
  "  const o = interpolate(frame, [0, 10], [0, 1], CLAMP);",
  "  return <AbsoluteFill style={{ opacity: o }} />;",
  "};",
].join("\n");

describe("validateRemotionCode", () => {
  it("kode valid dasar lolos", () => {
    const r = validateRemotionCode(VALID_BASE);
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it("input kosong dan terlalu besar", () => {
    expect(codes(validateRemotionCode("   \n").errors)).toEqual(["empty"]);
    expect(codes(validateRemotionCode("a".repeat(200001)).errors)).toEqual(["tooLarge"]);
  });

  it("deteksi interpolate tanpa opsi (satu baris)", () => {
    const code = VALID_BASE.replace(", CLAMP)", ")");
    const r = validateRemotionCode(code);
    expect(codes(r.errors)).toContain("interpolateNoClamp");
    expect(r.valid).toBe(false);
  });

  it("deteksi interpolate multi-baris yang kurang extrapolateRight", () => {
    const code = [
      'import { interpolate } from "remotion";',
      "export const A = () => {",
      "  const x = interpolate(",
      "    1,",
      "    [0, 10],",
      "    [0, 1],",
      "    {",
      '      extrapolateLeft: "clamp",',
      "    },",
      "  );",
      "  return null;",
      "};",
    ].join("\n");
    expect(codes(validateRemotionCode(code).errors)).toContain("interpolateNoClamp");
  });

  it("menerima interpolate multi-baris yang lengkap", () => {
    const code = [
      'import { interpolate } from "remotion";',
      "export const A = () => {",
      "  const x = interpolate(",
      "    1,",
      "    [0, 10],",
      "    [0, 1],",
      '    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },',
      "  );",
      "  return null;",
      "};",
    ].join("\n");
    expect(codes(validateRemotionCode(code).errors)).not.toContain("interpolateNoClamp");
  });

  it("CLAMP yang definisinya tidak lengkap = error; tidak terdefinisi = warning", () => {
    const badDef = VALID_BASE.replace(', extrapolateRight: "clamp"', "");
    expect(codes(validateRemotionCode(badDef).errors)).toContain("interpolateNoClamp");
    const noDef = VALID_BASE.split("\n").filter((l) => !l.startsWith("const CLAMP")).join("\n");
    const r = validateRemotionCode(noDef);
    expect(codes(r.errors)).not.toContain("interpolateNoClamp");
    expect(codes(r.warnings)).toContain("interpolateClampUnverifiable");
  });

  it("tidak false-positive pada komentar dan string", () => {
    const code =
      VALID_BASE +
      '\n// Math.random() interpolate(x) transition: all\nconst s = "Math.random() any className=";\n';
    const r = validateRemotionCode(code);
    expect(r.errors).toEqual([]);
    expect(codes(r.warnings)).not.toContain("usesClassName");
  });

  it("mendeteksi Math.random, Date.now, any, css animation", () => {
    const base = VALID_BASE + "\n";
    expect(codes(validateRemotionCode(base + "const r = Math.random();").errors)).toContain("nonDeterministic");
    expect(codes(validateRemotionCode(base + "const d = Date.now();").errors)).toContain("nonDeterministic");
    expect(codes(validateRemotionCode(base + "const v: any = 1;").errors)).toContain("usesAny");
    expect(codes(validateRemotionCode(base + 'const s = { transition: "all 1s" };').errors)).toContain("cssAnimation");
  });

  it("mendeteksi frame desimal", () => {
    const r = validateRemotionCode(VALID_BASE + "\nconst c = { durationInFrames: 12.5 };");
    expect(codes(r.errors)).toContain("nonIntegerFrames");
  });

  it("warning: className, img, useState, spring tanpa guard, URL eksternal", () => {
    const extra = [
      "const a = <div className=\"x\" />;",
      "const b = <img src=\"a.png\" />;",
      "const [n, setN] = useState(0);",
      "const sp = spring({ frame, fps });",
      'const c = <Img src="https://example.com/a.png" />;',
    ].join("\n");
    const w = codes(validateRemotionCode(VALID_BASE + "\n" + extra).warnings);
    for (const c of ["usesClassName", "plainImgTag", "usesStateOrEffect", "springUnguarded", "externalUrl"]) {
      expect(w).toContain(c);
    }
  });

  it("memberi nomor baris", () => {
    const r = validateRemotionCode(VALID_BASE + "\nconst r = Math.random();");
    expect(r.errors.find((e) => e.code === "nonDeterministic")?.line).toBe(9);
  });

  it("tanpa import remotion = error", () => {
    expect(codes(validateRemotionCode("export const A = () => null;").errors)).toContain("missingRemotionImport");
  });
});

describe("REMOTION_ISSUE_CODES", () => {
  it("unik dan tidak kosong", () => {
    expect(new Set(REMOTION_ISSUE_CODES).size).toBe(REMOTION_ISSUE_CODES.length);
  });
});
