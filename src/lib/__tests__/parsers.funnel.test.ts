import { describe, expect, it } from "vitest";
import { parseFunnelPack, buildSegmentMultiPlatformSeo } from "@/lib/parsers";

const FUNNEL_SAMPLE = `[SOURCE AUDIT]
URL Sumber: Berdasarkan Analisis Topik
Fakta & Data Kunci: Living soil menghasilkan rasa lebih manis.
Sudut Pandang Baru: Pertanian organik berbasis mikrobiologi perkotaan.
Jembatan Funnel: Short 1 memicu penasaran, Short 2 membedah mitos, Long Pillar masterclass.

[SEGMENT: SHORT 1]
Judul: The Underground Secret Behind Super-Sweet Balcony Tomatoes
Aspek Rasio: 9:16 Vertikal
Platform: TikTok / YouTube Shorts / Reels
Target Durasi: ~45 detik (7 scene)
CAPTION: Did you know your potted plants are running an underground trading market right on your balcony? Discover why real organic growing isn't about expensive bottles.
HASHTAGS: #Organictopia #UrbanGardening #LivingSoil #BalconyGarden

## SCENE 1
KONTEKS SCENE: Hook tomat supermarket hambar vs organik.
NARASI: Did you know supermarket tomatoes lost their flavor because their roots were force-fed?
TARGET EMOSI (VET): Rasa Penasaran Tinggi
TEKNIK EDITING & PACING: Jump Cut 0s dead-air
TEKS OVERLAY: FORCE-FED ROOTS?!
PANDUAN SUARA: Context: hook pagi | Note: punchy | Traits: tegas
SETTING KAMERA: ECU | eye-level | 85mm macro
VISUAL PROMPT: Stylized 3D semi-realistic animation of a ruby-red organic tomato --ar 9:16
DURASI: 5 detik

## SCENE 2
KONTEKS SCENE: Jembatan Funnel ke video utama.
NARASI: Tap the related video below for our full organic masterclass!
TARGET EMOSI (VET): Dorongan Bertindak
TEKNIK EDITING & PACING: Audio Fade-out
TEKS OVERLAY: WATCH FULL MASTERCLASS BELOW 👇
PANDUAN SUARA: Context: penutup cepat | Note: ramah | Traits: energetic
SETTING KAMERA: MCU | eye-level | 50mm
VISUAL PROMPT: Slow pull-out from organic tomato on wooden rail --ar 9:16
DURASI: 5 detik

[SEGMENT: SHORT 2]
Judul: Stop Buying "Organic" Potting Soil Until You Check This!
Aspek Rasio: 9:16 Vertikal
Platform: TikTok / YouTube Shorts / Reels
Target Durasi: ~45 detik (7 scene)
CAPTION: Think that expensive bag of "organic" soil from the big-box store is ready to grow thriving food? Think again! Most bagged soils are biologically asleep.
HASHTAGS: #OrganicSoilMyth #BalconyFarming #CompostScience

## SCENE 1
KONTEKS SCENE: Tanah kemasan steril dan mati secara biologi.
NARASI: Did you know most bagged organic soil you buy at the store is actually biologically dead?
TARGET EMOSI (VET): Shock & Waspada
TEKNIK EDITING & PACING: B-Roll Cutaway
TEKS OVERLAY: STOP BUYING DEAD SOIL!
PANDUAN SUARA: Context: peringatan kontrarian | Note: serius | Traits: otoritatif
SETTING KAMERA: CU | high angle | 35mm
VISUAL PROMPT: Fast whip pan right stopping on a torn burlap sack spilling dry potting mix --ar 9:16
DURASI: 5 detik

## SCENE 2
KONTEKS SCENE: Jembatan Funnel ke video panjang.
NARASI: Want the exact three-ingredient recipe to build forever-soil? Click the full video below!
TARGET EMOSI (VET): Rasa Penasaran Lanjutan
TEKNIK EDITING & PACING: Question Loop
TEKS OVERLAY: GET THE 3-INGREDIENT RECIPE BELOW 👇
PANDUAN SUARA: Context: tantangan bersahabat | Note: intonasi bertanya | Traits: witty
SETTING KAMERA: CU | eye-level | 50mm
VISUAL PROMPT: Three stone bowls holding dark worm castings and rock dust --ar 9:16
DURASI: 5 detik

[SEGMENT: LONG PILLAR]
Judul: All About Organic: The Complete Science of Turning Tiny Balconies Into Living Food Forests
Aspek Rasio: 16:9 Horizontal Widescreen
Platform: YouTube Long-Form
Target Durasi: ~4 menit (40 scene)
CAPTION: Welcome to the ultimate university-backed guide to true organic container gardening. In this masterclass, we explore the rhizosphere.

## SCENE 1
KONTEKS SCENE: Sinematik Intro.
NARASI: Did you know a single teaspoon of true organic soil holds more living organisms than there are humans on Earth?
TARGET EMOSI (VET): Kekaguman Epik
TEKNIK EDITING & PACING: Stabilized Flow
TEKS OVERLAY: [CHAPTER TITLE] BAB 1: THE ORGANIC ILLUSION
PANDUAN SUARA: Context: epik sinematik | Note: intonasi berwibawa | Traits: warm & clear
SETTING KAMERA: ECU | eye-level | 85mm macro
VISUAL PROMPT: Hand-carved wooden spoon holding dark humus --ar 16:9
DURASI: 6 detik

## THUMBNAIL STUDIO
TEKS OVERLAY SEO: LIVING SOIL!
OPSI 1 PROMPT: Close-Up of glowing heirloom tomato --ar 16:9
OPSI 1 TEKS OVERLAY: IT'S ALIVE!
OPSI 2 PROMPT: Side-by-Side comparison of dry soil vs living soil --ar 16:9
OPSI 2 TEKS OVERLAY: DEAD SOIL?!
REKOMENDASI WARNA & ELEMEN: Kuning Emas Cerah dan background espresso.

## METADATA SEO YOUTUBE 2026
TAG SPESIFIK: Organictopia, All About Organic, Living Soil Science
TAG UMUM: Organic Gardening, Urban Farming
TAG MAJEMUK (LONG-TAIL): how to make organic soil for pots, living soil recipe for apartment balcony
DESKRIPSI YOUTUBE (SEO & EMPATI): Complete guide to living soil for apartment balconies.

## KONTEN PLATFORM & METADATA SEO 4 PLATFORM (2026)
[PLATFORM: YOUTUBE]
DESKRIPSI: Unlock the peer-reviewed science of All About Organic container gardening. In this 4-minute deep-dive masterclass, we break down Chapters 1 through 5.
HASHTAGS: #Organictopia #AllAboutOrganic #LivingSoil #BalconyGardening
TAGS REKOMENDASI: Organictopia, all about organic, living soil recipe for pots

[PLATFORM: TIKTOK]
DESKRIPSI: Stop trusting lifeless bagged soil! Watch the full 4-minute masterclass on our channel!
HASHTAGS: #Organictopia #LivingSoil #BalconyGarden
TAGS REKOMENDASI: how to make living soil in pots, organic balcony garden tips

[PLATFORM: INSTAGRAM]
DESKRIPSI: Your potted plants are running an underground sugar-trading market right on your balcony. Swipe through the science of the rhizosphere.
HASHTAGS: #Organictopia #OrganicContainerGardening #LivingSoilCommunity
TAGS REKOMENDASI: organic balcony garden, living soil recipe

[PLATFORM: FACEBOOK]
DESKRIPSI: Have you ever bought an expensive bag of organic potting mix? In today's full video, we share the simple 3-ingredient recipe.
HASHTAGS: #Organictopia #OrganicGardening #BalconyGardeners
TAGS REKOMENDASI: Urban Container Gardening, Organic Soil
`;

describe("parseFunnelPack Multi-Platform SEO Isolation", () => {
  it("menghasilkan 3 segmen terisolasi dengan aspek rasio dan judul masing-masing", () => {
    const pack = parseFunnelPack(FUNNEL_SAMPLE);
    expect(pack.isFunnel).toBe(true);
    expect(pack.segments.short1.title).toContain("Super-Sweet Balcony Tomatoes");
    expect(pack.segments.short1.aspectRatio).toBe("9:16");

    expect(pack.segments.short2.title).toContain("Stop Buying");
    expect(pack.segments.short2.aspectRatio).toBe("9:16");

    expect(pack.segments.long.title).toContain("All About Organic");
    expect(pack.segments.long.aspectRatio).toBe("16:9");
  });

  it("Short 1 memiliki MultiPlatformSeo unik dan TIDAK tertimpa oleh naskah masterclass Long Pillar", () => {
    const pack = parseFunnelPack(FUNNEL_SAMPLE);
    const s1Seo = pack.segments.short1.multiPlatformSeo;
    expect(s1Seo).toBeDefined();

    // TikTok Short 1 harus berisi materi Short 1
    expect(s1Seo?.tiktok?.description).toContain("underground trading market");
    expect(s1Seo?.tiktok?.description).not.toContain("4-minute deep-dive masterclass");
    expect(s1Seo?.tiktok?.hashtags).toContain("#Organictopia");

    // YouTube Shorts Short 1 harus menambahkan #Shorts
    expect(s1Seo?.youtube?.hashtags).toContain("#Shorts");
    expect(s1Seo?.youtube?.description).toContain("Tonton video utama selengkapnya di channel ini!");
  });

  it("Short 2 memiliki MultiPlatformSeo unik seputar masalah tanah kemasan mati", () => {
    const pack = parseFunnelPack(FUNNEL_SAMPLE);
    const s2Seo = pack.segments.short2.multiPlatformSeo;
    expect(s2Seo).toBeDefined();

    expect(s2Seo?.tiktok?.description).toContain("biologically asleep");
    expect(s2Seo?.tiktok?.description).not.toContain("Super-Sweet Balcony Tomatoes");
    expect(s2Seo?.tiktok?.hashtags).toContain("#OrganicSoilMyth");
  });

  it("Long Pillar mempertahankan deskripsi komprehensif masterclass 4 platform", () => {
    const pack = parseFunnelPack(FUNNEL_SAMPLE);
    const longSeo = pack.segments.long.multiPlatformSeo;
    expect(longSeo).toBeDefined();

    expect(longSeo?.youtube?.description).toContain("4-minute deep-dive masterclass");
    expect(longSeo?.youtube?.tags).toContain("all about organic");
  });

  it("buildSegmentMultiPlatformSeo menyusun 4 platform lengkap dengan batas karakter aman", () => {
    const res = buildSegmentMultiPlatformSeo({
      title: "Rahasia Kompos Cepat",
      caption: "Coba cara ini agar kompos tidak bau dan cepat matang dalam 2 minggu!",
      hashtags: "#kompos #organik #kebun",
      aspectRatio: "9:16",
    });

    expect(res.tiktok?.platform).toBe("tiktok");
    expect(res.tiktok?.description).toContain("tidak bau dan cepat matang");
    expect(res.tiktok?.hashtags).toBe("#kompos #organik #kebun");

    expect(res.youtube?.hashtags).toContain("#Shorts");
    expect(res.instagram?.description).toContain("Simpan & share");
    expect(res.facebook?.description).toContain("Tulis pendapat Anda di kolom komentar!");
  });
});
