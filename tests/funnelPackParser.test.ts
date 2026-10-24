import { describe, it, expect } from "vitest";
import {
  detectOutputStructure,
  extractSourceAudit,
  parseFunnelPack,
  parseScenes,
} from "@/lib/parsers";

const SAMPLE_FUNNEL_OUTPUT = `
### [SOURCE AUDIT]
- **URL Sumber**: https://example.com/ai-revolution-2026
- **Fakta & Data Kunci**:
  1. 85% creator beralih ke format hybrid shorts-to-long di 2026.
  2. Retensi video panjang meningkat 3.2x jika dipicu oleh short teaser.
  3. AI generative video sekarang mampu konsisten multi-scene.
- **Sudut Pandang Baru (Angle Shift)**: Mengungkap rahasia mengapa strategi 1 video tunggal sudah mati dan bagaimana funnel 3-in-1 mendominasi algoritma.
- **Jembatan Funnel**: Short 1 memicu rasa penasaran hook, Short 2 membedah mitos/problem, dan Long Pillar memberikan tutorial teknis langkah demi langkah.
- **Disclaimer**: Data riset internal creator analytics 2026.

----------------------------------------------------
### [SEGMENT: SHORT 1]
Judul: 90% Creator Salah Bikin Video Pendek!
Aspek Rasio: 9:16 Vertikal
Platform: TikTok / YouTube Shorts / Reels
Target Durasi: ~45 detik (3 scene)

CAPTION: Jangan bikin video pendek sebelum tahu trik ini! Tonton video panjangnya di channel kami untuk bedah tuntas.
HASHTAGS: #ContentCreation #CreatorTips #ViralShorts

## SCENE 1
KONTEKS SCENE: Hook penasaran ekstrem
NARASI: [gasp] Kalau kamu masih posting video pendek cara lama, stop sekarang juga! [beat] Algoritma 2026 berubah total.
TARGET EMOSI (VET): Rasa Penasaran Tinggi
TEKNIK EDITING & PACING: Jump Cut 0s dead-air
TEKS OVERLAY: STOP BIKIN SHORT CARA LAMA!
PANDUAN SUARA: [Context: suasana hook | Note: intonasi penasaran | Traits: vokal tegas]
SETTING KAMERA: CU | eye-level | 35mm | shallow DOF | slow push-in | centered
VISUAL PROMPT: Cinematic close-up of a creator staring in shock at analytics dashboard glowing red --ar 9:16
DURASI: 5 detik

## SCENE 2
KONTEKS SCENE: Inti pesan
NARASI: Video pendek tanpa jembatan funnel cuma buang-buang waktu. [pause] Kamu butuh ekosistem 3 lapis.
TARGET EMOSI (VET): Kejelasan
TEKNIK EDITING & PACING: B-Roll Cutaway
TEKS OVERLAY: EKOSISTEM 3 LAPIS
PANDUAN SUARA: [Context: penegasan | Note: tegas | Traits: meyakinkan]
SETTING KAMERA: MS | low angle | 50mm | deep focus | static | centered
VISUAL PROMPT: Over the shoulder shot of a futuristic mindmap showing interconnected video nodes --ar 9:16
DURASI: 6 detik

----------------------------------------------------
### [SEGMENT: SHORT 2]
Judul: Kenapa Video Panjangmu Sepi Penonton?
Aspek Rasio: 9:16 Vertikal
Platform: TikTok / YouTube Shorts / Reels
Target Durasi: ~45 detik (2 scene)

CAPTION: Ini alasan video panjangmu sepi views. Cek tutorial lengkapnya di channel!
HASHTAGS: #YouTubeStrategy #ContentAudit

## SCENE 1
KONTEKS SCENE: Problem framing
NARASI: [sigh] Capek bikin video 10 menit tapi penontonnya cuma puluhan? Masalahnya bukan di kualitasmu.
TARGET EMOSI (VET): Empati & Penasaran
TEKNIK EDITING & PACING: Stabilized Flow
TEKS OVERLAY: KENAPA VIDEO SEPI?
PANDUAN SUARA: [Context: empati hangat | Note: bersahabat | Traits: empati]
SETTING KAMERA: MS | eye-level | 35mm | shallow DOF | static | centered
VISUAL PROMPT: Frustrated editor looking at low view counts on laptop in a dark cozy studio --ar 9:16
DURASI: 6 detik

## SCENE 2
KONTEKS SCENE: Contrarian angle
NARASI: Masalahnya penonton nggak tahu video itu ada! Kamu butuh magnet short untuk menyalurkan traffic.
TARGET EMOSI (VET): Pencerahan
TEKNIK EDITING & PACING: Fast Cut
TEKS OVERLAY: BUTUH MAGNET SHORT!
PANDUAN SUARA: [Context: solusi | Note: energetik | Traits: bersemangat]
SETTING KAMERA: CU | high angle | 24mm | shallow DOF | push-in | centered
VISUAL PROMPT: Glowing funnel visualization with views flowing into a central pillar --ar 9:16
DURASI: 5 detik

----------------------------------------------------
### [SEGMENT: LONG PILLAR]
Judul: Masterclass Funnel Konten 2026: Dari 0 ke 100K Views
Aspek Rasio: 16:9 Horizontal Widescreen
Platform: YouTube Long-Form
Target Durasi: ~10 menit (3 scene)

CAPTION: Panduan komprehensif menguasai algoritma YouTube 2026 dengan sistem 3-in-1 Funnel.
HASHTAGS: #Masterclass #YouTube2026 #ContentMarketing

## BAB 1: PENGANTAR & BLUEPRINT
## SCENE 1
KONTEKS SCENE: Sinematik Masterclass Intro
NARASI: Selamat datang di masterclass strategi konten modern. [beat] Hari ini kita bongkar seluruh cetak biru funnel 3-in-1.
TARGET EMOSI (VET): Inspiratif & Fokus
TEKNIK EDITING & PACING: Stabilized Flow
TEKS OVERLAY: [CHAPTER TITLE] BAB 1: CETAK BIRU FUNNEL
PANDUAN SUARA: [Context: masterclass | Note: berwibawa | Traits: hangat & jelas]
SETTING KAMERA: WS | eye-level | 50mm | deep focus | slow dolly-in | centered
VISUAL PROMPT: Wide cinematic view of a sleek modern creator studio with warm ambient lighting --ar 16:9
DURASI: 8 detik

## SCENE 2
KONTEKS SCENE: Analisis Data
NARASI: Mari kita pelajari data nyata dari 1000 channel teratas. Perhatikan pola retensinya.
TARGET EMOSI (VET): Analitis
TEKNIK EDITING & PACING: Screen share cutaway
TEKS OVERLAY: [KEY POINT] ANALISIS 1000 CHANNEL
PANDUAN SUARA: [Context: analitis | Note: jelas | Traits: profesional]
SETTING KAMERA: MS | eye-level | 35mm | shallow DOF | static | centered
VISUAL PROMPT: Holographic bar chart animating retention curves with glowing teal highlights --ar 16:9
DURASI: 10 detik

## THUMBNAIL STUDIO
TEKS OVERLAY SEO: FUNNEL 2026!
OPSI 1 PROMPT: Close-up of expressive creator pointing at massive glowing viral graph, high contrast lighting --ar 16:9
OPSI 1 TEKS OVERLAY: BONGKAR RAHASIA
OPSI 2 PROMPT: Split lighting studio shot with shocked facial expression looking at monitor --ar 16:9
OPSI 2 TEKS OVERLAY: RAHASIA VIRAL
REKOMENDASI WARNA & ELEMEN: Teks kuning emas dengan latar belakang dark navy
`;

describe("Funnel Pack Parser & Multi-Segment Engine", () => {
  it("detectOutputStructure correctly identifies FUNNEL_BUNDLE and SINGLE", () => {
    expect(detectOutputStructure(SAMPLE_FUNNEL_OUTPUT)).toBe("FUNNEL_BUNDLE");

    const singleScript = `
## SCENE 1
NARASI: Halo semua, ini video tunggal.
VISUAL PROMPT: A person smiling --ar 9:16
DURASI: 5 detik
`;
    expect(detectOutputStructure(singleScript)).toBe("SINGLE");
    expect(detectOutputStructure("")).toBe("SINGLE");
  });

  it("extractSourceAudit extracts all metadata fields cleanly", () => {
    const audit = extractSourceAudit(SAMPLE_FUNNEL_OUTPUT);
    expect(audit).not.toBeNull();
    expect(audit?.sourceUrl).toBe("https://example.com/ai-revolution-2026");
    expect(audit?.angleShift).toContain("Mengungkap rahasia mengapa strategi 1 video tunggal");
    expect(audit?.pillarBridge).toContain("Short 1 memicu rasa penasaran hook");
    expect(audit?.disclaimer).toContain("Data riset internal creator analytics 2026");
    expect(audit?.keyFacts).toBeDefined();
    expect(audit?.keyFacts?.length).toBe(3);
    expect(audit?.keyFacts?.[0]).toContain("85% creator beralih");
  });

  it("parseFunnelPack correctly splits into 3 segments with isolated IDs", () => {
    const pack = parseFunnelPack(SAMPLE_FUNNEL_OUTPUT, 0.35);

    expect(pack.isFunnel).toBe(true);
    expect(pack.sourceAudit).not.toBeNull();
    expect(pack.sourceAudit?.sourceUrl).toBe("https://example.com/ai-revolution-2026");

    // Short 1 Checks
    const s1 = pack.segments.short1;
    expect(s1.id).toBe("short1");
    expect(s1.title).toBe("90% Creator Salah Bikin Video Pendek!");
    expect(s1.aspectRatio).toBe("9:16");
    expect(s1.scenes.length).toBe(2);
    expect(s1.scenes[0].id).toBe(101); // Isolated ID offset 100
    expect(s1.scenes[1].id).toBe(102);
    expect(s1.caption).toContain("Jangan bikin video pendek");
    expect(s1.hashtags).toContain("#ContentCreation");

    // Short 2 Checks
    const s2 = pack.segments.short2;
    expect(s2.id).toBe("short2");
    expect(s2.title).toBe("Kenapa Video Panjangmu Sepi Penonton?");
    expect(s2.aspectRatio).toBe("9:16");
    expect(s2.scenes.length).toBe(2);
    expect(s2.scenes[0].id).toBe(201); // Isolated ID offset 200
    expect(s2.scenes[1].id).toBe(202);
    expect(s2.caption).toContain("Ini alasan video panjangmu sepi views");

    // Long Pillar Checks
    const long = pack.segments.long;
    expect(long.id).toBe("long");
    expect(long.title).toBe("Masterclass Funnel Konten 2026: Dari 0 ke 100K Views");
    expect(long.aspectRatio).toBe("16:9");
    expect(long.scenes.length).toBe(2);
    expect(long.scenes[0].id).toBe(301); // Isolated ID offset 300
    expect(long.scenes[1].id).toBe(302);
    expect(long.scenes[0].chapterTitle).toBe("PENGANTAR & BLUEPRINT");
    expect(long.caption).toContain("Panduan komprehensif menguasai algoritma YouTube 2026");
    expect(long.thumbnailData).not.toBeNull();
    expect(long.thumbnailData?.seoText).toBe("FUNNEL 2026!");
    expect(long.thumbnailData?.opsi1Prompt).toContain("Close-up of expressive creator");
  });

  it("parseScenes backward compatibility: defaults to 1, 2, 3 ID without offset", () => {
    const single = `
## SCENE 1
NARASI: Scene pertama
VISUAL PROMPT: Test visual 1
DURASI: 5s

## SCENE 2
NARASI: Scene kedua
VISUAL PROMPT: Test visual 2
DURASI: 5s
`;
    const scenes = parseScenes(single, 0.35);
    expect(scenes.length).toBe(2);
    expect(scenes[0].id).toBe(1);
    expect(scenes[1].id).toBe(2);
  });

  it("auto-heals collapsed script whitespace with missing newlines and glued scene headers", () => {
    const collapsed = `[SOURCE AUDIT]URL Sumber: https://example.com/source   Fakta & Data Kunci: Data 1. Data 2.   [SEGMENT: SHORT 1]Judul: Short 1 Viral Hook   CAPTION: Test caption   HASHTAGS: #viral   SCENE 1KONTEKS SCENE: Hook penasaran NARASI: Narasi scene 1 DURASI: 5 detik   SCENE 2KONTEKS SCENE: Masalah NARASI: Narasi scene 2 DURASI: 6 detik   [SEGMENT: SHORT 2]Judul: Short 2 Contrarian   CAPTION: Short 2 caption   HASHTAGS: #problem   SCENE 1KONTEKS SCENE: Problem hook NARASI: Narasi s2 scene 1 DURASI: 5 detik   [SEGMENT: LONG PILLAR]Judul: Long Pillar Tutorial   CAPTION: Long caption   SCENE 1KONTEKS SCENE: Intro NARASI: Narasi long scene 1 DURASI: 10 detik`;

    expect(detectOutputStructure(collapsed)).toBe("FUNNEL_BUNDLE");
    const pack = parseFunnelPack(collapsed, 0.35);
    expect(pack.segments.short1.scenes.length).toBe(2);
    expect(pack.segments.short2.scenes.length).toBe(1);
    expect(pack.segments.long.scenes.length).toBe(1);
    expect(pack.segments.short1.scenes[0].sceneContext).toContain("Hook penasaran");
    expect(pack.segments.short1.scenes[0].narasi).toContain("Narasi scene 1");
    expect(pack.segments.short1.scenes[1].narasi).toContain("Narasi scene 2");
  });
});

