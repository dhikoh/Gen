import { describe, it, expect } from "vitest";
import { cleanMarkdownLinks, cleanValue, cleanParsedValue, extractThumbnailData, extractTitles, cleanNarasiForTts, parseScenes, extractThreeTierSeo, parseVoiceGuidelines } from "@/lib/parsers";

describe("parsers", () => {
  describe("cleanMarkdownLinks", () => {
    it("converts markdown link syntax to raw URL", () => {
      const input = "Check this [OpenAI](https://openai.com) and [Google](https://google.com)";
      expect(cleanMarkdownLinks(input)).toBe("Check this https://openai.com and https://google.com");
    });

    it("handles empty strings", () => {
      expect(cleanMarkdownLinks("")).toBe("");
    });
  });

  describe("cleanValue", () => {
    it("strips wrapping square brackets and double quotes", () => {
      expect(cleanValue("[Some Bracketed Value]")).toBe("Some Bracketed Value");
      expect(cleanValue('"Some Quoted Value"')).toBe("Some Quoted Value");
      expect(cleanValue("  Plain Value  ")).toBe("Plain Value");
    });
  });

  describe("cleanParsedValue", () => {
    it("strips trailing horizontal rules, colons, asterisks, and whitespace", () => {
      expect(cleanParsedValue("**Section Title:**\n---")).toBe("Section Title");
      expect(cleanParsedValue(": Value with colon :")).toBe("Value with colon");
      expect(cleanParsedValue("")).toBe("");
    });
  });

  describe("extractThumbnailData", () => {
    it("returns null when no thumbnail header exists", () => {
      expect(extractThumbnailData("Just a plain script with pure narrative content.")).toBeNull();
    });

    it("parses structured thumbnail section", () => {
      const sample = `
## THUMBNAIL STUDIO
TEKS OVERLAY SEO: Rahasia Prompt AI
OPSI 1 PROMPT: Futuristic cyberpunk desk with neon lights
OPSI 1 TEKS OVERLAY: AI Mengubah Semuanya!
OPSI 2 PROMPT: Minimalist aesthetic workspace
OPSI 2 TEKS OVERLAY: Jangan Terlewat
REKOMENDASI: Gunakan warna kontras tinggi.
      `;
      const result = extractThumbnailData(sample);
      expect(result).not.toBeNull();
      expect(result?.seoText).toBe("Rahasia Prompt AI");
      expect(result?.opsi1Prompt).toBe("Futuristic cyberpunk desk with neon lights");
      expect(result?.opsi1Overlay).toBe("AI Mengubah Semuanya!");
      expect(result?.opsi2Prompt).toBe("Minimalist aesthetic workspace");
      expect(result?.opsi2Overlay).toBe("Jangan Terlewat");
    });
  });

  describe("extractTitles", () => {
    it("extracts clean titles without fake viral percentages or metadata lines", () => {
      const output = `
# TAHAP 1: 10 IDE JUDUL & RISET
JUDUL 1: "Cara Bikin Video AI 2026 yang Menghasilkan"
FORMAT HOOK: Curiosity Gap
TARGET AUDIENS: Konten Kreator Pemula
ALASAN POTENSI: Topik AI video sedang trending dengan search demand tinggi

JUDUL 2: "Rahasia Prompt Generator yang Jarang Diketahui"
FORMAT HOOK: Negative Twist
TARGET AUDIENS: Digital Marketer
ALASAN POTENSI: Membuka rahasia yang memicu rasa ingin tahu audiens

JUDUL 3: "5 Tool AI Gratis untuk Mengubah Konten Anda"
FORMAT HOOK: Listicle
TARGET AUDIENS: Freelancer
ALASAN POTENSI: Memberikan solusi langsung dan aplikatif
      `;
      const titles = extractTitles(output);
      expect(titles).toHaveLength(3);
      expect(titles[0]).toBe("Cara Bikin Video AI 2026 yang Menghasilkan");
      expect(titles[1]).toBe("Rahasia Prompt Generator yang Jarang Diketahui");
      expect(titles[2]).toBe("5 Tool AI Gratis untuk Mengubah Konten Anda");
      // Verify no metadata lines leaked into titles
      expect(titles.some((t) => t.includes("FORMAT HOOK"))).toBe(false);
      expect(titles.some((t) => t.includes("ALASAN POTENSI"))).toBe(false);
      expect(titles.some((t) => t.includes("%"))).toBe(false);
    });

    it("cleans legacy percentage notation if encountered", () => {
      const legacyOutput = `
# VARIASI JUDUL
1. "Trik Video AI Otomatis" (95%)
2. "Bongkar Algoritma Reels" (88%)
      `;
      const titles = extractTitles(legacyOutput);
      expect(titles).toHaveLength(2);
      expect(titles[0]).toBe("Trik Video AI Otomatis");
      expect(titles[1]).toBe("Bongkar Algoritma Reels");
    });

    it("ignores dekonstruksi materi section when extracting titles", () => {
      const outputWithDeconstruction = `
[DEKONSTRUKSI MATERI & INTISARI STRATEGIS 2026]
- Masalah Inti / Pain Point Audiens: Banyak kreator mengalami cliff drop di 3 detik pertama karena tidak menyampaikan value promise.
- Transformasi & Janji Nilai 3 Detik (0-3s Value Promise): Cara mengunci 85%+ retention rate dengan hook langsung ke solusi.
- Sudut Pandang Kontras / Angle Pembeda: Jangan mulai dengan salam atau perkenalan diri, langsung ke inti.

# RISET & VARIASI JUDUL (10 IDE KONTEN)
1. "Rahasia Retensi 85% YouTube Shorts 2026"
   Alasan Potensi: Memancing rasa penasaran audiens kreator video
2. "Jangan Pernah Ucapkan Kata Ini di 3 Detik Pertama!"
   Alasan Potensi: Negative hook yang memicu rasa takut salah
      `;
      const titles = extractTitles(outputWithDeconstruction);
      expect(titles).toHaveLength(2);
      expect(titles[0]).toBe("Rahasia Retensi 85% YouTube Shorts 2026");
      expect(titles[1]).toBe("Jangan Pernah Ucapkan Kata Ini di 3 Detik Pertama!");
      expect(titles.some((t) => t.includes("Masalah Inti"))).toBe(false);
      expect(titles.some((t) => t.includes("Value Promise"))).toBe(false);
    });
  });

  describe("cleanNarasiForTts", () => {
    it("strips acting notes in parentheses and sound effect brackets", () => {
      const rawNarration = "(berbisik antusias) Coba bayangkan [SFX: Whoosh], dalam 3 detik hidupmu berubah total! (tersenyum mantap)";
      const cleaned = cleanNarasiForTts(rawNarration);
      expect(cleaned).toBe("Coba bayangkan, dalam 3 detik hidupmu berubah total!");
      expect(cleaned).not.toContain("berbisik");
      expect(cleaned).not.toContain("SFX");
      expect(cleaned).not.toContain("tersenyum");
    });

    it("strips acting notes in parentheses, asterisks, brackets, and quotes from Claude & ChatGPT", () => {
      // Claude sample with quotes & acting note
      const claude1 = `(hushed, urgent whisper) "This reptile has a third eye. Right on top of its skull."`;
      expect(cleanNarasiForTts(claude1)).toBe("This reptile has a third eye. Right on top of its skull.");

      // Claude sample with pause & apostrophe (can't)
      const claude2 = `(curious, building) "It can't see pictures like your eyes do. (pause) But it tracks light... shadow... the slow crawl of the sun across the sky. "`;
      expect(cleanNarasiForTts(claude2)).toBe("It can't see pictures like your eyes do. But it tracks light... shadow... the slow crawl of the sun across the sky.");

      // ChatGPT sample with asterisks *(urgent, fast, controlled shock)* & SFX bracket
      const chatgpt1 = `*(urgent, fast, controlled shock)* Some chameleons can launch their tongues up to two-and-a-half body lengths. [SFX: sharp whoosh]`;
      expect(cleanNarasiForTts(chatgpt1)).toBe("Some chameleons can launch their tongues up to two-and-a-half body lengths.");

      // Scene with aside and multiple pauses
      const complexScene = `(soft revelation, connecting) "Here's the part that'll really get you: (pause) you have a buried piece of this same ancient eye too — deep inside your brain. [SFX: gentle glimmer] (warmly, aside) If that just cracked your brain a little... you know what to do."`;
      expect(cleanNarasiForTts(complexScene)).toBe("Here's the part that'll really get you: you have a buried piece of this same ancient eye too — deep inside your brain. If that just cracked your brain a little... you know what to do.");
    });

    it("handles plain text without modifications", () => {
      expect(cleanNarasiForTts("Ini narasi biasa tanpa instruksi sutradara.")).toBe("Ini narasi biasa tanpa instruksi sutradara.");
    });
  });

  describe("parseScenes with YouTube 2026 VET emotion and pacing", () => {
    it("parses TARGET EMOSI and TEKNIK PACING from scene blocks", () => {
      const script = `
=== SCENE 1 ===
DURASI: 00:00 - 00:05
TARGET EMOSI: Penasaran Ekstrem (Curiosity Gap)
TEKNIK PACING: Hook Cepat Staccato (0-3s Value Promise)
TEKS OVERLAY: Jangan Lakukan Ini di 2026!
VISUAL: Extreme close-up of a high-tech robotic iris focusing with neon cyan reflections
NARASI: (berbisik tegang) Kamu masih pakai cara lama ini? [SFX: Tension riser]

=== SCENE 2 ===
DURASI: 00:05 - 00:15
TARGET EMOSI: Validasi Masalah & Empati
TEKNIK PACING: Ritme Sedang Penjelasan
TEKS OVERLAY: Solusi Sebenarnya
VISUAL: Wide shot showing split screen of old manual methods vs automated neural engine
NARASI: Faktanya, 90% kreator pemula gagal karena melupakan langkah krusial ini.
      `;

      const scenes = parseScenes(script);
      expect(scenes).toHaveLength(2);
      expect(scenes[0].targetEmosi).toBe("Penasaran Ekstrem (Curiosity Gap)");
      expect(scenes[0].teknikPacing).toBe("Hook Cepat Staccato (0-3s Value Promise)");
      expect(scenes[0].teksOverlay).toBe("Jangan Lakukan Ini di 2026!");
      expect(scenes[1].targetEmosi).toBe("Validasi Masalah & Empati");
      expect(scenes[1].teknikPacing).toBe("Ritme Sedang Penjelasan");
    });
  });

  describe("extractThreeTierSeo", () => {
    it("extracts 3-tier tags, narrative description, and upload checklist", () => {
      const output = `
## METADATA SEO YOUTUBE 2026
TAG SPESIFIK: #PromptGen, #GeminiTTS, #YouTubeStrategy2026
TAG UMUM: #VideoEditing, #ContentCreator, #DigitalMarketing, #YouTubeGrowth
TAG MAJEMUK (LONG-TAIL): Cara membuat naskah youtube otomatis, strategi algoritma youtube 2026, optimasi retensi video shorts
DESKRIPSI YOUTUBE (SEO & EMPATI):
Pernahkah kamu merasa video yang kamu buat dengan susah payah sepi penonton? Di video ini, kita membedah arsitektur retensi YouTube 2026 secara tuntas.

Dapatkan rahasia hook 3 detik pertama dan formula thumbnail anti-gagal di sini!

CHECKLIST KESIAPAN AKHIR:
- [ ] Hook 3 detik pertama telah menyampaikan Janji Nilai yang kuat
- [ ] Teks thumbnail 1-3 kata dengan ekspresi wajah dominan 60-80%
- [ ] Audio telah diberi efek Fade-in dan Fade-out halus
      `;

      const seo = extractThreeTierSeo(output);
      expect(seo).not.toBeNull();
      expect(seo?.tagSpesifik).toContain("#PromptGen");
      expect(seo?.tagUmum).toContain("#VideoEditing");
      expect(seo?.tagMajemuk).toContain("Cara membuat naskah youtube otomatis");
      expect(seo?.deskripsi).toContain("Pernahkah kamu merasa video");
      expect(seo?.checklist.length).toBeGreaterThanOrEqual(3);
      expect(seo?.checklist[0]).toContain("Janji Nilai");
    });
  });

  describe("parseVoiceGuidelines", () => {
    it("parses context, note, traits, and sync fields", () => {
      const input = `Context: malam hari dekat terarium | Note: berbisik pelan lalu cepat | Traits: energetic, husky whisper | Sync: [SFX: Wet Tongue Flick] tepat saat lidah menyentuh mata`;
      const result = parseVoiceGuidelines(input);
      expect(result).toBeDefined();
      expect(result?.sampleContext).toBe("malam hari dekat terarium");
      expect(result?.directorsNote).toBe("berbisik pelan lalu cepat");
      expect(result?.traits).toBe("energetic, husky whisper");
      expect(result?.sync).toBe("[SFX: Wet Tongue Flick] tepat saat lidah menyentuh mata");
    });
  });

  describe("parseScenes bilingual chapters & sync integration", () => {
    it("parses CHAPTER and BAB markers, sets chapterPrefix, and captures sync in voice guidelines", () => {
      const script = `
## CHAPTER 1: The Weird Habit

## SCENE 1
NARASI: Ever seen an animal lick its own eyeball? [SFX: Wet Tongue Flick]
TARGET EMOSI: Rasa Ingin Tahu
TEKNIK PACING: Jump cut cepat
TEKS OVERLAY: [CHAPTER TITLE] The Weird Habit
PANDUAN SUARA: Context: malam hari | Note: berbisik pelan | Traits: energetic | Sync: [SFX: Wet Tongue Flick] tepat saat snap zoom
VISUAL: Extreme close-up of gecko eye --ar 9:16
DURASI: 6 detik

## BAB 2: Investigasi Sains

## SCENE 2
NARASI: Most geckos don't have eyelids at all. [SFX: Soft Whoosh]
TARGET EMOSI: Kejutan
TEKNIK PACING: Rack focus
TEKS OVERLAY: [CHAPTER TITLE] No Eyelids, No Problem?
PANDUAN SUARA: Context: terarium terang | Note: santai | Traits: confident | Sync: [SFX: Soft Whoosh] saat rack focus
VISUAL: Medium close-up of full face --ar 9:16
DURASI: 7 detik
      `;

      const scenes = parseScenes(script);
      expect(scenes).toHaveLength(2);

      // Scene 1 with CHAPTER
      expect(scenes[0].chapter).toBe(1);
      expect(scenes[0].chapterTitle).toBe("The Weird Habit");
      expect(scenes[0].chapterPrefix).toBe("CHAPTER");
      expect(scenes[0].overlayType).toBe("chapter_title");
      expect(scenes[0].voiceGuidelines?.sync).toBe("[SFX: Wet Tongue Flick] tepat saat snap zoom");

      // Scene 2 with BAB
      expect(scenes[1].chapter).toBe(2);
      expect(scenes[1].chapterTitle).toBe("Investigasi Sains");
      expect(scenes[1].chapterPrefix).toBe("BAB");
      expect(scenes[1].overlayType).toBe("chapter_title");
      expect(scenes[1].voiceGuidelines?.sync).toBe("[SFX: Soft Whoosh] saat rack focus");
    });

    it("parses ChatGPT markdown with single hash scenes and bolded headers", () => {
      const chatGptOutput = `
# RISET & VARIASI JUDUL
**JUDUL TERPILIH:** The Reptile That Looks Harmless

---

# SCENE 1

**NARASI:**
*(urgent, fast, controlled shock)* Some chameleons can launch their tongues up to two-and-a-half body lengths. [SFX: sharp whoosh]

**TARGET EMOSI (VET):** Shock / Curiosity

**TEKNIK EDITING & PACING:**
Hard cold-open on tongue launch at frame 0. Snap cut on the prey contact moment.

**TEKS OVERLAY:**
**2.5 BODY LENGTHS**

**PANDUAN SUARA:**
Context: explosive wildlife reveal | Note: immediate attack | Traits: energetic | Sync: [SFX: sharp whoosh] on launch

**VISUAL PROMPT:**
Extreme close-up of a chameleon perched on a mossy branch --ar 9:16

**DURASI:** 6 seconds

---

# SCENE 2

**NARASI:**
*(intrigued, slightly slower)* And that is not a trick. [SFX: subtle reveal]

**TARGET EMOSI (VET):** Intrigue

**TEKNIK EDITING & PACING:**
Match cut from the tongue impact into a wider spatial visualization.

**TEKS OVERLAY:**
**LONGER THAN IT LOOKS**

**PANDUAN SUARA:**
Context: scientific reveal | Note: slightly slower | Traits: warm storyteller | Sync: [SFX: subtle reveal] at extension

**VISUAL PROMPT:**
Medium side-profile shot of a chameleon holding still --ar 9:16

**DURASI:** 7 seconds

---

# THUMBNAIL STUDIO
**TEKS OVERLAY SEO:** 264 G
`;

      const scenes = parseScenes(chatGptOutput);
      expect(scenes).toHaveLength(2);
      expect(scenes[0].sceneNumber).toBe("Scene 1");
      expect(scenes[0].targetEmosi).toBe("Shock / Curiosity");
      expect(scenes[0].teksOverlay).toBe("2.5 BODY LENGTHS");
      expect(scenes[0].durasi).toBe("6s");
      expect(scenes[0].voiceGuidelines?.sync).toBe("[SFX: sharp whoosh] on launch");
      expect(scenes[0].narasi).toContain("Some chameleons can launch their tongues");
      expect(scenes[1].sceneNumber).toBe("Scene 2");
      expect(scenes[1].durasi).toBe("7s");
    });
  });
});

