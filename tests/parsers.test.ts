import { describe, it, expect } from "vitest";
import { cleanMarkdownLinks, cleanValue, cleanParsedValue, extractThumbnailData, extractTitles, cleanNarasiForTts, normalizeActingCuesToBrackets, parseScenes, extractThreeTierSeo, parseVoiceGuidelines } from "@/lib/parsers";

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

    it("strips acting cues and beats formatted in square brackets [...]", () => {
      const bracketSample = "[wide-eyed, urgent whisper] Right there. On top of its head. That's not a scale. [beat] That's an eye. And it's been staring at the sky this whole time.";
      expect(cleanNarasiForTts(bracketSample)).toBe("Right there. On top of its head. That's not a scale. That's an eye. And it's been staring at the sky this whole time.");
    });
  });

  describe("normalizeActingCuesToBrackets", () => {
    it("converts parenthetical stage directions into square brackets for raw audio copy", () => {
      const rawWithParens = "(wide-eyed, urgent whisper) Right there. On top of its head. That's not a scale. (beat) That's an eye. And it's been staring at the sky this whole time.";
      const normalized = normalizeActingCuesToBrackets(rawWithParens);
      expect(normalized).toBe("[wide-eyed, urgent whisper] Right there. On top of its head. That's not a scale. [beat] That's an eye. And it's been staring at the sky this whole time.");
    });

    it("preserves stage directions already formatted in square brackets", () => {
      const alreadyBrackets = "[antusias, tempo cepat] Stop! [beat] Perhatikan baik-baik...";
      expect(normalizeActingCuesToBrackets(alreadyBrackets)).toBe("[antusias, tempo cepat] Stop! [beat] Perhatikan baik-baik...");
    });

    it("handles markdown asterisks around parentheses", () => {
      const withAsterisks = "*(urgent, fast, controlled shock)* Some chameleons can launch their tongues.";
      expect(normalizeActingCuesToBrackets(withAsterisks)).toBe("[urgent, fast, controlled shock] Some chameleons can launch their tongues.");
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

    it("parses narration with brackets and normalizes parentheses into brackets for raw copy while cleaning cleanly for TTS", () => {
      const script = `
## SCENE 1
NARASI: (wide-eyed, urgent whisper) Right there. On top of its head. That's not a scale. (beat) That's an eye. And it's been staring at the sky this whole time.
VISUAL: Cinematic close-up
DURASI: 8s
      `;
      const scenes = parseScenes(script);
      expect(scenes).toHaveLength(1);
      // Raw copy narration has brackets [...]
      expect(scenes[0].narasi).toBe("[wide-eyed, urgent whisper] Right there. On top of its head. That's not a scale. [beat] That's an eye. And it's been staring at the sky this whole time.");
      // Clean TTS narration strips both [...]
      expect(cleanNarasiForTts(scenes[0].narasi)).toBe("Right there. On top of its head. That's not a scale. That's an eye. And it's been staring at the sky this whole time.");
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

    it("parses ChatGPT markdown with # ## double prefix headers", () => {
      const doubleHashPrefixOutput = `
# ## RISET & VARIASI JUDUL
**JUDUL TERPILIH:** This Reptile Can Survive What Should Kill It

# ## SCENE 1

**NARASI:**
*(shocked whisper, then rapidly accelerating)* “This tiny reptile can survive temperatures below freezing. [SFX: icy impact] And the craziest part? It doesn’t always need to freeze.”

**TARGET EMOSI (VET):**
Shock / Curiosity

**TEKNIK EDITING & PACING:**
Aggressive cold open.

**TEKS OVERLAY:**
**IT SURVIVES**

**PANDUAN SUARA:**
Context: urgent scientific reveal | Note: whisper first | Traits: energetic | Sync: [SFX: icy impact] on reveal

**VISUAL PROMPT:**
Extreme macro opening frame of a tiny painted turtle hatchling --ar 9:16

**DURASI:** 7 seconds

---

# ## SCENE 2

**NARASI:**
*(fast, explanatory)* “Painted turtle hatchlings spend winter buried in shallow nests, where temperatures can drop below zero.”

**TARGET EMOSI (VET):**
Disbelief / Tension

**TEKNIK EDITING & PACING:**
Fast environmental reveal.

**TEKS OVERLAY:**
**BELOW ZERO**

**PANDUAN SUARA:**
Context: underground winter | Note: rapid | Traits: authoritative | Sync: [SFX: low winter rumble] on ground reveal

**VISUAL PROMPT:**
Begin with a tight side-profile view of the hatchling tucked beneath compact soil --ar 9:16

**DURASI:** 7 seconds

---

# ## THUMBNAIL STUDIO
**TEKS OVERLAY SEO:** GILA!
`;

      const scenes = parseScenes(doubleHashPrefixOutput);
      expect(scenes).toHaveLength(2);
      expect(scenes[0].sceneNumber).toBe("Scene 1");
      expect(scenes[0].targetEmosi).toBe("Shock / Curiosity");
      expect(scenes[0].teksOverlay).toBe("IT SURVIVES");
      expect(scenes[0].durasi).toBe("7s");
      expect(scenes[0].voiceGuidelines?.sync).toBe("[SFX: icy impact] on reveal");
      expect(scenes[0].narasi).toContain("This tiny reptile can survive temperatures below freezing");
      expect(scenes[1].sceneNumber).toBe("Scene 2");
      expect(scenes[1].durasi).toBe("7s");

      // Verify thumbnail data extraction with # ##
      const thumb = extractThumbnailData(doubleHashPrefixOutput);
      expect(thumb).not.toBeNull();
      expect(thumb?.seoText).toBe("GILA!");
    });

    it("parses full 7-scene ChatGPT output with # ## headers and extracts all metadata", () => {
      const chatGptFull = `
# ## RISET & VARIASI JUDUL
**JUDUL TERPILIH:**
**This Reptile Can Survive What Should Kill It**

---

# ## SCENE 1
**NARASI:**
*(shocked whisper, then rapidly accelerating)* “This tiny reptile can survive temperatures below freezing. [SFX: icy impact] And the craziest part? It doesn’t always need to freeze.”
**TARGET EMOSI (VET):** Shock / Curiosity
**TEKNIK EDITING & PACING:** Aggressive cold open.
**TEKS OVERLAY:** **IT SURVIVES**
**PANDUAN SUARA:** Context: urgent | Note: whisper | Traits: energetic | Sync: [SFX: icy impact] on reveal
**VISUAL PROMPT:** Extreme macro opening frame of a tiny painted turtle hatchling --ar 9:16
**DURASI:** 7 seconds

---

# ## SCENE 2
**NARASI:**
*(fast, explanatory)* “Painted turtle hatchlings spend winter buried in shallow nests, where temperatures can drop below zero.”
**TARGET EMOSI (VET):** Disbelief / Tension
**TEKNIK EDITING & PACING:** Fast environmental reveal.
**TEKS OVERLAY:** **BELOW ZERO**
**PANDUAN SUARA:** Context: underground winter | Note: rapid | Traits: authoritative | Sync: [SFX: low winter rumble] on ground reveal
**VISUAL PROMPT:** Begin with a tight side-profile view --ar 9:16
**DURASI:** 7 seconds

---

# ## SCENE 3
**NARASI:**
*(leaning closer, fascinated)* “But here’s the trick: when conditions get brutal, the turtle can remain liquid inside—even below the normal freezing point.”
**TARGET EMOSI (VET):** Wonder / Curiosity
**TEKNIK EDITING & PACING:** Progressive visual reveal.
**TEKS OVERLAY:** **STILL LIQUID**
**PANDUAN SUARA:** Context: scientific | Note: slow | Traits: fascinated | Sync: [SFX: crystalline shimmer] on reveal
**VISUAL PROMPT:** Open on the turtle's shell --ar 9:16
**DURASI:** 8 seconds

---

# ## SCENE 4
**NARASI:**
*(excited, punchy)* “And this is where it gets weird. Its body has adaptations that help keep ice from invading vulnerable tissues.”
**TARGET EMOSI (VET):** Surprise / Fascination
**TEKNIK EDITING & PACING:** Mid-video plot pivot.
**TEKS OVERLAY:** **ICE: STOPPED**
**PANDUAN SUARA:** Context: unexpected | Note: hit weird | Traits: energetic | Sync: [SFX: sharp crystalline crack] on invading
**VISUAL PROMPT:** Start with an extreme macro --ar 9:16
**DURASI:** 7 seconds

---

# ## SCENE 5
**NARASI:**
*(dramatic, slower)* “So it’s not simply a frozen turtle waking back up. The real survival trick is controlling the freezing process itself.”
**TARGET EMOSI (VET):** Realization / Awe
**TEKNIK EDITING & PACING:** Major re-engagement moment.
**TEKS OVERLAY:** **THE REAL TRICK**
**PANDUAN SUARA:** Context: myth-busting | Note: slow | Traits: deep | Sync: [SFX: deep pulse] under split
**VISUAL PROMPT:** Open on a dramatic visual contrast --ar 9:16
**DURASI:** 8 seconds

---

# ## SCENE 6
**NARASI:**
*(amazed, energetic)* “That means this tiny hatchling can face a winter that would be devastating to most animals—and still emerge when spring returns.”
**TARGET EMOSI (VET):** Awe / Relief
**TEKNIK EDITING & PACING:** Transition from danger to resolution.
**TEKS OVERLAY:** **WAIT FOR SPRING**
**PANDUAN SUARA:** Context: survival payoff | Note: accelerate | Traits: warm | Sync: [SFX: soft thawing crackle] on melting
**VISUAL PROMPT:** Begin underground with hatchling --ar 9:16
**DURASI:** 7 seconds

---

# ## SCENE 7
**NARASI:**
*(smiling, reflective, then playful)* “A turtle this small basically found a loophole in winter. Would you call that a superpower?”
**TARGET EMOSI (VET):** Wonder / Engagement
**TEKNIK EDITING & PACING:** Slow pull-out ending.
**TEKS OVERLAY:** **SUPERPOWER?**
**PANDUAN SUARA:** Context: satisfying conclusion | Note: calm | Traits: warm | Sync: [SFX: subtle magical chime] on loophole
**VISUAL PROMPT:** Open on a close-up of the painted turtle --ar 9:16
**DURASI:** 6 seconds

---

# ## THUMBNAIL STUDIO
**TEKS OVERLAY SEO:** **GILA!**
**OPSI 1 PROMPT:** Extreme close-up of a painted turtle hatchling --ar 9:16
**OPSI 1 TEKS OVERLAY:** **GILA!**
**OPSI 2 PROMPT:** Medium close-up of a painted turtle hatchling --ar 9:16
**OPSI 2 TEKS OVERLAY:** **KAGET!**
**REKOMENDASI WARNA & ELEMEN:** Use high-contrast bright yellow or white text.

---

# ## METADATA SEO YOUTUBE 2026
**TAG SPESIFIK:** painted turtle, painted turtle hatchling
**TAG UMUM:** reptiles, turtles, animal facts
**TAG MAJEMUK (LONG-TAIL):** how painted turtles survive winter
**DESKRIPSI YOUTUBE (SEO & EMPATI):**
How can a tiny painted turtle hatchling survive a winter cold enough to freeze its surroundings?
`;

      const scenes = parseScenes(chatGptFull);
      expect(scenes).toHaveLength(7);
      expect(scenes[0].sceneNumber).toBe("Scene 1");
      expect(scenes[0].durasi).toBe("7s");
      expect(scenes[6].sceneNumber).toBe("Scene 7");
      expect(scenes[6].durasi).toBe("6s");

      // Verify TTS cleaning on scene 1
      const cleanNarasi1 = cleanNarasiForTts(scenes[0].narasi);
      expect(cleanNarasi1).toBe("This tiny reptile can survive temperatures below freezing. And the craziest part? It doesn’t always need to freeze.");
      expect(cleanNarasi1).not.toContain("shocked whisper");
      expect(cleanNarasi1).not.toContain("SFX");

      // Verify Thumbnail
      const thumb = extractThumbnailData(chatGptFull);
      expect(thumb).not.toBeNull();
      expect(thumb?.seoText).toBe("GILA!");
      expect(thumb?.opsi1Overlay).toBe("GILA!");
      expect(thumb?.opsi2Overlay).toBe("KAGET!");

      // Verify SEO
      const seo = extractThreeTierSeo(chatGptFull);
      expect(seo).not.toBeNull();
      expect(seo?.tagSpesifik).toContain("painted turtle");
      expect(seo?.tagMajemuk).toContain("how painted turtles survive winter");
    });

    it("parses full 7-scene Claude output and normalizes durasi properly", () => {
      const claudeFull = `
## RISET & VARIASI JUDUL
**JUDUL TERPILIH:** *The Snake With Built-In Heat Vision*

## SCENE 1
**NARASI:** (hushed, tense whisper) Total darkness. Zero light. [SFX: Low Ambient Drone] (voice drops, urgent) And somewhere out there... something can still see you. Perfectly.
**TARGET EMOSI (VET):** Tegang & Penasaran (Suspense/Curiosity)
**TEKNIK EDITING & PACING:** Jump cut agresif tanpa dead-air.
**TEKS OVERLAY:** SOMETHING SEES YOU
**PANDUAN SUARA:** Context: Momen pembuka | Note: mulai pelan | Traits: suara rendah | Sync: [SFX: Low Ambient Drone] masuk bersamaan layar gelap
**VISUAL PROMPT:** Extreme close-up opening on a single reptilian eye --ar 9:16
**DURASI:** 6 detik

## SCENE 2
**NARASI:** (building intensity, almost proud) That's not magic. That's the pit viper — a snake that reads body heat like a living thermal camera. [SFX: Soft Electronic Ping]
**TARGET EMOSI (VET):** Kagum bercampur Takjub (Awe)
**TEKNIK EDITING & PACING:** Slow reveal dolly-out.
**TEKS OVERLAY:** MEET THE PIT VIPER
**PANDUAN SUARA:** Context: Reveal identitas | Note: tempo naik | Traits: energik | Sync: [SFX: Soft Electronic Ping] muncul tepat saat kamera dolly-out
**VISUAL PROMPT:** Medium close-up continuing framing --ar 9:16
**DURASI:** 7 detik

## SCENE 3
**NARASI:** (explaining, fascinated tone) Between its eye and its nostril sits a tiny pit — [SFX: Subtle Digital Beep] packed with nerve endings.
**TARGET EMOSI (VET):** Penasaran Ilmiah
**TEKNIK EDITING & PACING:** Steady arc shot.
**TEKS OVERLAY:** A HEAT-SENSING PIT
**PANDUAN SUARA:** Context: Penjelasan ilmiah | Note: tempo sedang | Traits: nada penasaran | Sync: overlay grafis muncul
**VISUAL PROMPT:** Medium shot picking up --ar 9:16
**DURASI:** 8 detik

## SCENE 4
**NARASI:** (leaning in, almost conspiratorial) Here's the wild part — this isn't just "sensing warm."
**TARGET EMOSI (VET):** Kejutan
**TEKNIK EDITING & PACING:** Rack focus.
**TEKS OVERLAY:** PINPOINT ACCURATE HEAT SENSE
**PANDUAN SUARA:** Context: Titik balik | Note: tempo dipercepat | Traits: penuh semangat | Sync: [SFX: Rising Tension Hit]
**VISUAL PROMPT:** Close-up opening on pit organ --ar 9:16
**DURASI:** 8 detik

## SCENE 5
**NARASI:** (fast, breathless) No eyes needed. No light needed. Just heat — and a strike faster than you can blink. [SFX: Whoosh Snake Strike]
**TARGET EMOSI (VET):** Ketegangan Puncak
**TEKNIK EDITING & PACING:** Handheld terkendali.
**TEKS OVERLAY:** STRIKES WITHOUT SEEING
**PANDUAN SUARA:** Context: Momen aksi puncak | Note: tempo cepat | Traits: intens | Sync: [SFX: Whoosh Snake Strike]
**VISUAL PROMPT:** Low wide shot opening --ar 9:16
**DURASI:** 7 detik

## SCENE 6
**NARASI:** (softer, reflective, warm) Evolution built this heat-sensing system millions of years before humans ever invented a thermal camera.
**TARGET EMOSI (VET):** Kekaguman Reflektif
**TEKNIK EDITING & PACING:** Slow crane-up.
**TEKS OVERLAY:** MILLIONS OF YEARS AHEAD
**PANDUAN SUARA:** Context: Refleksi | Note: tempo melambat | Traits: hangat | Sync: transisi cross-fade
**VISUAL PROMPT:** Wide shot opening --ar 9:16
**DURASI:** 8 detik

## SCENE 7
**NARASI:** (energetic, warm smile in voice) So next time someone calls reptiles "boring"... tell them about the snake with built-in heat vision.
**TARGET EMOSI (VET):** Keterlibatan
**TEKNIK EDITING & PACING:** Kembali ke tempo cepat.
**TEKS OVERLAY:** WHICH SUPERPOWER WOULD YOU PICK?
**PANDUAN SUARA:** Context: Penutup | Note: tempo kembali cepat | Traits: hangat | Sync: [SFX: Playful Chime]
**VISUAL PROMPT:** Medium shot continuing --ar 9:16
**DURASI:** 6 detik

## THUMBNAIL STUDIO
**TEKS OVERLAY SEO:** IT SEES HEAT
**OPSI 1 PROMPT:** Extreme close-up shot --ar 9:16
**OPSI 1 TEKS OVERLAY:** IT SEES HEAT
**OPSI 2 PROMPT:** Medium close-up --ar 9:16
**OPSI 2 TEKS OVERLAY:** HIDDEN SENSE
**REKOMENDASI WARNA & ELEMEN:** Palet kontras tinggi.

## METADATA SEO YOUTUBE 2026
**TAG SPESIFIK:** pit viper, snake heat vision
**TAG UMUM:** reptiles, wildlife facts
**TAG MAJEMUK (LONG-TAIL):** how do snakes see in the dark
**DESKRIPSI YOUTUBE (SEO & EMPATI):**
Imagine a predator that can find you in complete darkness.
`;

      const scenes = parseScenes(claudeFull);
      expect(scenes).toHaveLength(7);
      expect(scenes[0].sceneNumber).toBe("Scene 1");
      expect(scenes[0].durasi).toBe("6s");
      expect(scenes[1].durasi).toBe("7s");
      expect(scenes[2].durasi).toBe("8s");
      expect(scenes[6].durasi).toBe("6s");

      // Verify TTS cleaning on scene 1
      const cleanNarasi1 = cleanNarasiForTts(scenes[0].narasi);
      expect(cleanNarasi1).toBe("Total darkness. Zero light. And somewhere out there... something can still see you. Perfectly.");
      expect(cleanNarasi1).not.toContain("hushed");
      expect(cleanNarasi1).not.toContain("SFX");
    });
  });
});

