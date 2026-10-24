import { describe, it, expect } from "vitest";
import {
  formatPlatformSeoText,
  formatFullScriptText,
  formatThumbnailPromptText,
  buildTextPackageFiles,
} from "@/lib/gdrivePackageFormat";
import { sanitizeFolderName } from "@/lib/googleDrive";
import type { Scene, ThumbnailData, MultiPlatformSeoData } from "@/lib/parsers";

describe("Google Drive Package Format & Sanitizer", () => {
  it("sanitizeFolderName removes illegal characters and trims cleanly", () => {
    expect(sanitizeFolderName("Misteri: Rumah/Kentang *Hantu*?")).toBe("Misteri_ Rumah_Kentang _Hantu__");
    expect(sanitizeFolderName("   Spasi   Banyak   ")).toBe("Spasi Banyak");
    expect(sanitizeFolderName("")).toBe("Untitled_Project");
    expect(sanitizeFolderName('Project "Viral" <2026> | Test')).toBe("Project _Viral_ _2026_ _ Test");
  });

  it("formatPlatformSeoText formats YouTube correctly", () => {
    const text = formatPlatformSeoText(
      "youtube",
      {
        platform: "youtube",
        description: "Rahasia monetisasi YouTube 2026 yang wajib Anda ketahui.",
        hashtags: "#YouTubeTips #Monetisasi2026",
        tags: "youtube monetization, tips youtube 2026, cara dapat uang",
        charCount: { description: 56, hashtags: 27, tags: 56 },
        status: { descriptionIdeal: true },
      },
      "Panduan YouTube 2026"
    );

    expect(text).toContain("YOUTUBE METADATA & SEO — PROMPT GEN");
    expect(text).toContain("Judul Konten : Panduan YouTube 2026");
    expect(text).toContain("[DESKRIPSI VIDEO (SEO & VALUE PROMISE)]");
    expect(text).toContain("Rahasia monetisasi YouTube 2026");
    expect(text).toContain("[HASHTAGS]");
    expect(text).toContain("#YouTubeTips #Monetisasi2026");
    expect(text).toContain("[TAGS YOUTUBE STUDIO (KOMA-SEPARATED)]");
    expect(text).toContain("youtube monetization, tips youtube 2026");
    expect(text).toContain("Panjang Deskripsi : 56 karakter");
  });

  it("formatPlatformSeoText formats TikTok, Instagram, and Facebook cleanly", () => {
    const tt = formatPlatformSeoText(
      "tiktok",
      { description: "3 trik rahasia ini bikin video FYP", hashtags: "#fyp #viral", tags: "trik fyp, cara viral" },
      "Tips FYP"
    );
    expect(tt).toContain("TIKTOK CAPTION & SEARCH KEYWORDS");
    expect(tt).toContain("3 trik rahasia ini bikin video FYP");

    const ig = formatPlatformSeoText(
      "instagram",
      { description: "Simpan dulu reels ini agar tidak hilang!", hashtags: "#reelsindonesia", tags: "reels tips" },
      "Reels Hook"
    );
    expect(ig).toContain("INSTAGRAM REELS & FEED CAPTION");
    expect(ig).toContain("Simpan dulu reels ini");

    const fb = formatPlatformSeoText(
      "facebook",
      { description: "Bagaimana pengalaman Anda saat mencoba tips ini?", hashtags: "#DiskusiKreator", tags: "komunitas" },
      "Post Facebook"
    );
    expect(fb).toContain("FACEBOOK VIDEO & COMMUNITY POST");
    expect(fb).toContain("Bagaimana pengalaman Anda");
  });

  it("formatFullScriptText formats complete scene breakdown with timing and prompts", () => {
    const mockScenes: Scene[] = [
      {
        id: 1,
        sceneNumber: "1",
        durasi: "5s",
        estimatedDurationSec: 5,
        narasi: "Apakah Anda tahu bahwa 90% kreator gagal di bulan pertama?",
        targetEmosi: "Serius",
        teknikPacing: "Lambat",
        visual: "Medium close-up shot of a modern creator in a dark moody studio.",
        sceneContext: "Studio gelap dengan pencahayaan neon biru",
        settingKamera: "50mm f/1.8 lens, shallow depth of field",
        teksOverlay: "90% KREATOR GAGAL",
        chapterTitle: "Hook Awal",
      },
      {
        id: 2,
        sceneNumber: "2",
        durasi: "7s",
        estimatedDurationSec: 7,
        narasi: "Penyebab utamanya bukan algoritma, tapi retensi penonton yang anjlok di 3 detik pertama.",
        targetEmosi: "Mendesak",
        visual: "Over-the-shoulder shot looking at a video timeline with sharp dropoff curve.",
        settingKamera: "35mm slow push in",
        teksOverlay: "RETENSI 3 DETIK",
        chapterTitle: "Inti Masalah",
      },
    ];

    const script = formatFullScriptText(mockScenes, "Rahasia Retensi Video", "01_Short_1_Hook");

    expect(script).toContain("NASKAH LENGKAP & BREAKDOWN SCENE — PROMPT GEN");
    expect(script).toContain("Judul Konten  : Rahasia Retensi Video");
    expect(script).toContain("Segmen Konten : 01_Short_1_Hook");
    expect(script).toContain("Total Scene   : 2 Adegan");
    expect(script).toContain("### SCENE 1 (5s | 5s)");
    expect(script).toContain("[TARGET EMOSI]: Serius");
    expect(script).toContain("[NARASI AUDIO / VO]:");
    expect(script).toContain("[VISUAL PROMPT]:");
    expect(script).toContain("Medium close-up shot of a modern creator");
    expect(script).toContain("[TEXT OVERLAY]: 90% KREATOR GAGAL");
    expect(script).toContain("### SCENE 2 (7s | 7s)");
  });

  it("formatThumbnailPromptText formats visual concepts and Midjourney prompt", () => {
    const thumb: ThumbnailData = {
      raw: "",
      seoText: "Konsep visual kontras tinggi",
      opsi1Overlay: "90% GAGAL!",
      opsi1Prompt: "Shocked YouTuber looking at computer screen with glowing red arrows, YouTube thumbnail style --ar 16:9",
      opsi2Overlay: "JANGAN COBA INI!",
      opsi2Prompt: "Dramatic red question mark over dark background --ar 16:9",
      recommendations: "Gunakan warna kuning kontras tinggi pada teks",
    };

    const text = formatThumbnailPromptText(thumb, "Video Viral");

    expect(text).toContain("KONSEP & PROMPT THUMBNAIL STUDIO — PROMPT GEN");
    expect(text).toContain("Judul Konten: Video Viral");
    expect(text).toContain("[TEKS OVERLAY]: 90% GAGAL!");
    expect(text).toContain("Shocked YouTuber looking at computer screen");
  });

  it("buildTextPackageFiles creates separate platform files, script file, and thumbnail prompt file", () => {
    const mockSeo: MultiPlatformSeoData = {
      youtube: {
        platform: "youtube",
        description: "Deskripsi YT",
        hashtags: "#yt",
        tags: "tag1, tag2",
        charCount: { description: 12, hashtags: 3, tags: 10 },
        status: { descriptionIdeal: true },
      },
      tiktok: {
        platform: "tiktok",
        description: "Caption TikTok",
        hashtags: "#tt",
        tags: "search1",
        charCount: { description: 14, hashtags: 3, tags: 7 },
        status: { descriptionIdeal: true },
      },
      instagram: {
        platform: "instagram",
        description: "Caption IG",
        hashtags: "#ig",
        tags: "explore1",
        charCount: { description: 10, hashtags: 3, tags: 8 },
        status: { descriptionIdeal: true },
      },
      facebook: {
        platform: "facebook",
        description: "Caption FB",
        hashtags: "#fb",
        tags: "topik1",
        charCount: { description: 10, hashtags: 3, tags: 6 },
        status: { descriptionIdeal: true },
      },
    };

    const mockScenes: Scene[] = [
      {
        id: 1,
        sceneNumber: "1",
        durasi: "5s",
        narasi: "Narasi satu",
        visual: "Prompt satu",
      },
    ];

    const mockThumb: ThumbnailData = {
      raw: "",
      seoText: "Seo text",
      opsi1Prompt: "Midjourney prompt",
      opsi1Overlay: "Overlay",
      opsi2Prompt: "",
      opsi2Overlay: "",
      recommendations: "",
    };

    const files = buildTextPackageFiles({
      projectTitle: "Proyek Keren",
      scenes: mockScenes,
      multiPlatformSeo: mockSeo,
      thumbnailData: mockThumb,
      segmentLabel: "Short 1",
    });

    const fileNames = files.map((f) => f.filename);
    expect(fileNames).toContain("youtube_metadata.txt");
    expect(fileNames).toContain("tiktok_metadata.txt");
    expect(fileNames).toContain("instagram_metadata.txt");
    expect(fileNames).toContain("facebook_metadata.txt");
    expect(fileNames).toContain("naskah_scene_lengkap.txt");
    expect(fileNames).toContain("thumbnail_prompt.txt");
    expect(files.length).toBe(6);
  });

  it("Single Mode: builds smart platform-adapted files even without explicit multiPlatformSeo", () => {
    const files = buildTextPackageFiles({
      projectTitle: "Rahasia Berkebun Organik di Apartemen",
      scenes: [
        { id: 1, sceneNumber: "1", narasi: "Tomat hidroponik vs living soil di balkon Anda.", durasi: "5s", visual: "Close up tomat ceri di balkon" },
      ],
      caption: "Panduan praktis memulai kebun sayur organik di balkon sempit tanpa ribet.",
      hashtags: "#Berkebun #Organik #LivingSoil",
      aspectRatio: "9:16",
    });

    const yt = files.find((f) => f.filename === "youtube_metadata.txt")?.content || "";
    const ig = files.find((f) => f.filename === "instagram_metadata.txt")?.content || "";
    const fb = files.find((f) => f.filename === "facebook_metadata.txt")?.content || "";

    // YouTube Shorts 9:16 harus memuat #Shorts dan kata kunci tag
    expect(yt).toContain("#Shorts");
    expect(yt).toContain("Berkebun");
    expect(yt).toContain("LivingSoil");

    // Instagram harus memuat CTA simpan & share
    expect(ig).toContain("Simpan & share");

    // Facebook harus memuat CTA diskusi komunitas
    expect(fb).toContain("Bagaimana menurut Anda");

    // Tidak boleh menyertakan thumbnail_prompt.txt jika tidak disediakan
    expect(files.some((f) => f.filename === "thumbnail_prompt.txt")).toBe(false);
  });

  it("Funnel Mode: Short 1 package strictly isolates 9:16 metadata and omits long-form 16:9 thumbnail prompt", () => {
    const short1Files = buildTextPackageFiles({
      projectTitle: "Hook Rahasia Tomat",
      scenes: [{ id: 101, sceneNumber: "1", narasi: "Pernahkah Anda tahu akar tomat saling berbisik?", durasi: "5s", visual: "Akar tomat di tanah" }],
      caption: "Fakta mengejutkan tentang rhizosphere tomat organik di pot.",
      hashtags: "#TomatoTips #BalconyLiving",
      aspectRatio: "9:16",
      segmentLabel: "01_Short_1_Hook",
      thumbnailData: null, // Short 1 tidak punya 16:9 thumbnail studio
    });

    const fileNames = short1Files.map((f) => f.filename);
    expect(fileNames).toContain("youtube_metadata.txt");
    expect(fileNames).toContain("tiktok_metadata.txt");
    expect(fileNames).toContain("instagram_metadata.txt");
    expect(fileNames).toContain("facebook_metadata.txt");
    expect(fileNames).toContain("naskah_scene_lengkap.txt");
    expect(fileNames).not.toContain("thumbnail_prompt.txt");

    const ytContent = short1Files.find((f) => f.filename === "youtube_metadata.txt")?.content || "";
    expect(ytContent).toContain("#Shorts");
    expect(ytContent).toContain("Tonton video utama selengkapnya di channel ini!");
    expect(ytContent).not.toContain("4-minute deep-dive masterclass");
  });
});
