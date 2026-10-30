import { describe, expect, it } from "vitest";
import { parseScenes } from "@/lib/parsers";
import { MAX_SCENE_COUNT } from "@/lib/sceneLimits";

const SAMPLE = `JUDUL TERPILIH: This Pig's Tusks Grow Straight Through Its Own Face - Babirusa

CAPTION: Tusks that grow straight through its face, and yes, it's a pig!
HASHTAGS: #babirusa #wildlifefacts

## SCENE 1
SCENE CONTEXT: Close-up of a male babirusa with tusks piercing its snout.
NARASI: [fast, intense] This babirusa's tusks grow straight through its own face. [SFX: Impact Hit] [beat] Yes, that's a pig.
TARGET EMOSI (VET): Shock
TEKNIK EDITING & PACING: Jump Cut (0s dead-air)
TEKS OVERLAY: [KEY POINT] Tusks through the face?!
PANDUAN SUARA: Sample Context: Hushed jungle; Director's Note: urgent whisper
VISUAL PROMPT: Extreme close-up of a male babirusa, slow push-in, cinematic lighting, accompanied by [SFX: Impact Hit] --ar 9:16
DURASI: 5 detik

## SCENE 2
SCENE CONTEXT: Wide shot of the babirusa wading through a Sulawesi swamp.
NARASI: Found only in Indonesia, this forest oddity looks like a prehistoric creature.
TARGET EMOSI (VET): Curiosity
TEKNIK EDITING & PACING: B-Roll Cutaway Overlay
TEKS OVERLAY: —
PANDUAN SUARA: —
VISUAL PROMPT: Wide establishing shot of a babirusa in a misty swamp, slow pan left, no sound effects --ar 9:16
DURASI: 7 detik
`;

describe("parseScenes (baseline perilaku saat ini)", () => {
  it("menemukan 2 scene", () => {
    const scenes = parseScenes(SAMPLE);
    expect(scenes).toHaveLength(2);
  });

  it("mengisi field utama scene 1", () => {
    const [s1] = parseScenes(SAMPLE);
    expect(s1.sceneContext).toContain("Close-up of a male babirusa");
    expect(s1.narasi).toContain("tusks grow straight through its own face");
    expect(s1.targetEmosi).toBe("Shock");
    expect(s1.teknikPacing).toContain("Jump Cut");
    expect(s1.visual).toContain("slow push-in");
    expect(s1.durasi).toBe("5s");
  });

  it("mengisi scene 2 dan durasi 7s", () => {
    const scenes = parseScenes(SAMPLE);
    expect(scenes[1].visual).toContain("slow pan left");
    expect(scenes[1].durasi).toBe("7s");
  });

  it("scene tanpa baris SETTING KAMERA tidak punya settingKamera (kompatibel dengan data lama)", () => {
    const scenes = parseScenes(SAMPLE);
    expect(scenes[0].settingKamera).toBeUndefined();
  });
});

describe("parseScenes — SETTING KAMERA", () => {
  const WITH_CAM = SAMPLE.replace(
    "VISUAL PROMPT:",
    "SETTING KAMERA: ECU | low angle | 50mm | shallow DOF | slow push-in | rule of thirds\nVISUAL PROMPT:"
  );

  it("membaca SETTING KAMERA pada scene yang memilikinya", () => {
    const scenes = parseScenes(WITH_CAM);
    expect(scenes).toHaveLength(2);
    expect(scenes[0].settingKamera).toBe("ECU | low angle | 50mm | shallow DOF | slow push-in | rule of thirds");
  });

  it("SETTING KAMERA tidak bocor ke field visual", () => {
    const scenes = parseScenes(WITH_CAM);
    expect(scenes[0].visual).not.toContain("SETTING KAMERA");
    expect(scenes[0].visual).toContain("slow push-in");
  });

  it("scene lain tanpa baris kamera tetap undefined", () => {
    const scenes = parseScenes(WITH_CAM);
    expect(scenes[1].settingKamera).toBeUndefined();
  });
});

describe("parseScenes overflow guard", () => {
  it("stops parsing at MAX_SCENE_COUNT even if AI returns more", () => {
    const lines: string[] = [];
    for (let i = 1; i <= 200; i++) {
      lines.push(`## SCENE ${i}`);
      lines.push(`NARASI: Scene ${i} narration text.`);
      lines.push(`VISUAL PROMPT: Scene ${i} visual.`);
      lines.push(`DURASI: 5s`);
      lines.push("");
    }
    const fakeOutput = lines.join("\n");

    const result = parseScenes(fakeOutput);
    expect(result.length).toBe(MAX_SCENE_COUNT);
    expect(result[result.length - 1].id).toBe(MAX_SCENE_COUNT);
  });
});

describe("parseScenes ReDoS resilience", () => {
  it("parses scripts with long repeated divider lines in milliseconds without hanging", () => {
    const divider50 = "=".repeat(50);
    const divider100 = "=".repeat(100);
    const textWithDividers = `
${divider50}
RISET & VARIASI JUDUL
JUDUL TERPILIH: Kucing dan Otak Kita
${divider100}
## SCENE 1
KONTEKS SCENE: Pembuka menantang
NARASI: Coba buktikan gue salah!
TARGET EMOSI (VET): Rasa Ingin Tahu
TEKNIK EDITING & PACING: Jump Cut (0s dead-air)
TEKS OVERLAY: OTAKMU LAGI DIBAJAK?!
PANDUAN SUARA: Note: nada tegas
SETTING KAMERA: MCU | 35mm
VISUAL PROMPT: Close-up of a smiling cat
DURASI: 6 detik

## SCENE 2
KONTEKS SCENE: Adegan komedi
NARASI: Bayangin aja. Gelas dijatuhin!
TARGET EMOSI (VET): Relatable
TEKNIK EDITING & PACING: Whip pan
TEKS OVERLAY: INI GUE BANGET!
PANDUAN SUARA: Note: nada santai
SETTING KAMERA: MS | 50mm
VISUAL PROMPT: Orange cat knocking over a mug
DURASI: 6 detik
${divider100}
`;

    const start = Date.now();
    const result = parseScenes(textWithDividers);
    const elapsed = Date.now() - start;

    expect(result).toHaveLength(2);
    expect(result[0].narasi).toContain("Coba buktikan gue salah!");
    expect(result[1].narasi).toContain("Bayangin aja. Gelas dijatuhin!");
    expect(elapsed).toBeLessThan(100);
  });

  it("parses user exact script with 3 divider lines and preamble in under 50ms", () => {
    const userScript = `Buatkan video, untuk panjangan per scene, mohon sesuaikan dengan durasi narasinya. Pastikan semua pengucapan narasi sempurna, seru (cewek)

==================================
RISET & VARIASI JUDUL
JUDUL TERPILIH: Coba Buktikan Gue Salah: Kamu Sebenarnya Nggak Suka Kucing, Tapi Otakmu Lagi "Dibajak"!

ANALISIS STRATEGI KONTEN & HOOK
AUDIENS PERSONA & PSIKOLOGI: Pecinta kucing...

==================================================
KONTEN PLATFORM & METADATA SEO 4 PLATFORM (2026)
CAPTION: Pernah mikir nggak sih, kenapa kita bisa sayang banget sama makhluk yang kerjanya cuma tidur?
HASHTAGS: #BentoCat #FaktaKucing

## SCENE 1
KONTEKS SCENE: Menantang penonton
NARASI: [confident, fast-paced] Coba buktikan gue salah! [beat] Kamu sebenarnya nggak suka kucing, tapi otakmu itu lagi dibajak!
TARGET EMOSI (VET): Rasa Ingin Tahu
TEKNIK EDITING & PACING: Jump Cut (0s dead-air)
TEKS OVERLAY: OTAKMU LAGI DIBAJAK?!
PANDUAN SUARA: Note: nada tegas
SETTING KAMERA: MCU | 35mm
VISUAL PROMPT: Medium close-up of charismatic man
DURASI: 6 detik

## SCENE 8
KONTEKS SCENE: Penutup
NARASI: [curious] Jadi, dari tiga tanda tadi, kelakuan anabul mana nih yang paling sukses membajak hatimu di rumah?
TARGET EMOSI (VET): Reflektif
TEKNIK EDITING & PACING: Jump Cut (0s dead-air)
TEKS OVERLAY: NOMOR BERAPA PALING RELATE?
PANDUAN SUARA: Note: intonasi santai
SETTING KAMERA: MCU | 50mm
VISUAL PROMPT: Orange cat winks at the camera
DURASI: 5 detik

## THUMBNAIL STUDIO
TEKS OVERLAY SEO: TERNYATA DIBAJAK?!
OPSI 1 PROMPT: Close-up shot of young man
OPSI 1
TEKS OVERLAY: TERNYATA DIBAJAK?!
=========================================================
`;

    const start = Date.now();
    const scenes = parseScenes(userScript);
    const elapsed = Date.now() - start;

    expect(scenes).toHaveLength(2);
    expect(scenes[0].id).toBe(1);
    expect(scenes[0].narasi).toContain("Coba buktikan gue salah!");
    expect(scenes[1].id).toBe(2);
    expect(scenes[1].narasi).toContain("kelakuan anabul mana nih");
    expect(elapsed).toBeLessThan(50);
  });
});

