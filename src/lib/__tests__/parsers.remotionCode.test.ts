import { describe, expect, it } from "vitest";
import { extractRemotionCode, parseScenes } from "@/lib/parsers";

describe("extractRemotionCode", () => {
  it("mengembalikan null jika tidak ada blok kode remotion", () => {
    const text = `Berikut adalah ide video tanpa kode apapun.`;
    expect(extractRemotionCode(text)).toBeNull();
  });

  it("mengekstrak blok kode tsx yang berisi import remotion", () => {
    const sample = `
Berikut rancangan videonya:

## KODE REMOTION LENGKAP (REACT TSX)

\`\`\`tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";

export const RemotionVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", opacity }}>
      <h1 style={{ color: "#ffffff", fontSize: 64 }}>Hello World</h1>
    </AbsoluteFill>
  );
};
\`\`\`

Silakan copy-paste ke Remotion Studio.
`;
    const code = extractRemotionCode(sample);
    expect(code).not.toBeNull();
    expect(code).toContain('import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion"');
    expect(code).toContain("export const RemotionVideo: React.FC");
    expect(code).toContain("Hello World");
  });

  it("mengekstrak blok typescript yang menggunakan hook useCurrentFrame", () => {
    const sample = `
\`\`\`typescript
import React from 'react';
import { Composition, useCurrentFrame } from 'remotion';

export const MyComposition = () => {
  const frame = useCurrentFrame();
  return <div style={{ color: 'red' }}>Frame: {frame}</div>;
};
\`\`\`
`;
    const code = extractRemotionCode(sample);
    expect(code).not.toBeNull();
    expect(code).toContain("export const MyComposition");
    expect(code).toContain("useCurrentFrame");
  });

  it("memilih blok kode Remotion meskipun ada blok kode JSON atau shell sebelumnya", () => {
    const sample = `
\`\`\`json
{
  "scenes": 5,
  "theme": "modern"
}
\`\`\`

Berikut adalah kodenya:
\`\`\`tsx
import { AbsoluteFill, useVideoConfig } from "remotion";

export const VideoComp = () => {
  const { width, height } = useVideoConfig();
  return <AbsoluteFill>{width}x{height}</AbsoluteFill>;
};
\`\`\`
`;
    const code = extractRemotionCode(sample);
    expect(code).not.toBeNull();
    expect(code).toContain("VideoComp");
    expect(code).not.toContain('"scenes": 5');
  });

  it("mengekstrak kode raw di bawah header ## KODE REMOTION jika tidak dibungkus markdown backticks", () => {
    const sample = `
## KODE REMOTION LENGKAP (REACT TSX)
import React from "react";
import { AbsoluteFill } from "remotion";

export const FallbackComponent = () => <AbsoluteFill>Raw</AbsoluteFill>;
`;
    const code = extractRemotionCode(sample);
    expect(code).not.toBeNull();
    expect(code).toContain("FallbackComponent");
  });
});

describe("parseScenes dengan motion design / Remotion field markers", () => {
  const REMOTION_SAMPLE = `JUDUL TERPILIH: 5 Fun Facts About Space

## SCENE 1
SCENE CONTEXT: Deep space galaxy backdrop
NARASI: Did you know that one million Earths could fit inside the sun?
TARGET EMOSI (VET): Wonder
KOMPONEN REMOTION: SunComparisonCard
ANIMASI SPRING: spring({ frame, fps: 30, config: { damping: 12, stiffness: 100 } })
MOTION DESIGN: Animated 3D sphere scaling up with kinetic text "1,000,000 Earths"
DURASI: 4 detik

## SCENE 2
SCENE CONTEXT: Black hole visualization
NARASI: Time slows down near a black hole event horizon.
TARGET EMOSI (VET): Mystery
KOMPONEN REMOTION: EventHorizonVortex
ANIMASI SPRING: interpolate(frame, [0, 45], [0, 360])
MOTION DESIGN: Spiraling particle accretion disk with glowing neon purple accents
DURASI: 5 detik

## KODE REMOTION LENGKAP (REACT TSX)
\`\`\`tsx
import { AbsoluteFill } from "remotion";
export const SpaceVideo = () => <AbsoluteFill>Space</AbsoluteFill>;
\`\`\`
`;

  it("mem-parse scene dengan label Komponen Remotion & Motion Design", () => {
    const scenes = parseScenes(REMOTION_SAMPLE);
    expect(scenes).toHaveLength(2);

    expect(scenes[0].sceneContext).toContain("Deep space galaxy");
    expect(scenes[0].settingKamera).toContain("SunComparisonCard");
    expect(scenes[0].visual).toContain("1,000,000 Earths");
    expect(scenes[0].durasi).toBe("4s");

    expect(scenes[1].sceneContext).toContain("Black hole visualization");
    expect(scenes[1].settingKamera).toContain("EventHorizonVortex");
    expect(scenes[1].visual).toContain("Spiraling particle accretion disk");
    expect(scenes[1].durasi).toBe("5s");
  });

  it("berhenti mem-parse scene sebelum blok ## KODE REMOTION LENGKAP", () => {
    const scenes = parseScenes(REMOTION_SAMPLE);
    expect(scenes).toHaveLength(2);
  });
});
