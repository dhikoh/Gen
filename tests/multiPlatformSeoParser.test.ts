import { describe, it, expect } from "vitest";
import {
  extractMultiPlatformSeo,
  evaluatePlatformSeoStatus,
  parseFunnelPack,
} from "@/lib/parsers";

describe("Multi-Platform SEO & Metadata Parser 2026", () => {
  const sample4PlatformScript = `
# JUDUL: Rahasia Sukses Produktivitas 2026
## SCENE 1
KONTEKS SCENE: Pembuka
NARASI: Hai semua! Hari ini kita bahas cara melipatgandakan fokus kerja.
DURASI: 5s

## KONTEN PLATFORM & METADATA SEO 4 PLATFORM (2026)

### [PLATFORM: YOUTUBE]
DESKRIPSI: Panduan lengkap melipatgandakan produktivitas kerja hingga 3x lipat dalam waktu 30 hari. Temukan strategi time-blocking terbaik, teknik eliminasi distraksi modern, serta framework kerja yang terbukti efektif untuk profesional dan kreator. Kunjungi channel kami untuk update harian: https://youtube.com/@produktivitas
HASHTAGS: #Produktivitas #ManajemenWaktu #FokusKerja #SelfImprovement
TAGS REKOMENDASI: cara produktif kerja, tips fokus belajar, time blocking method, manajemen waktu 2026, produktivitas kerja, tips anti malas

### [PLATFORM: TIKTOK]
DESKRIPSI: Ini dia 1 trik rahasia fokus 4 jam tanpa ngantuk & tanpa scrolling medsos! Tonton sampai habis ya.
HASHTAGS: #FokusKerja #TipsProduktif #BelajarBareng #FYP
TAGS REKOMENDASI: cara fokus kerja, tips anti distraksi, tips produktivitas fyp, cara belajar cepat

### [PLATFORM: INSTAGRAM]
DESKRIPSI: Berhenti multitasking sekarang kalau kamu gak mau burnout di usia muda! 🚫 Simpan postingan ini buat pengingat besok pagi saat mulai kerja. Jangan lupa share ke teman kerjamu yang sering keteteran deadline.
HASHTAGS: #ProduktivitasDiri #KarierSukses #TipsKerja #WorkLifeBalance #SelfGrowth
TAGS REKOMENDASI: tips karier, motivasi kerja, burnout prevention, produktif tanpa lelah

### [PLATFORM: FACEBOOK]
DESKRIPSI: Rekan-rekan profesional, berapa jam biasanya waktu Anda terbuang percuma hanya karena membalas email atau notifikasi yang tidak mendesak? Kami menemukan bahwa metode batching bisa menghemat 12 jam per minggu. Menurut Anda, apa tantangan terbesar menjaga fokus di tempat kerja saat ini? Mari berdiskusi di kolom komentar.
HASHTAGS: #DuniaKerja #ManajemenWaktu #KomunitasProfesional
TAGS REKOMENDASI: dunia kerja, efisiensi kerja, diskusi karier, manajemen tim
`;

  it("berhasil mengekstrak metadata 4 platform secara lengkap dan terpisah", () => {
    const result = extractMultiPlatformSeo(sample4PlatformScript);
    expect(result).not.toBeNull();
    expect(result?.youtube).toBeDefined();
    expect(result?.tiktok).toBeDefined();
    expect(result?.instagram).toBeDefined();
    expect(result?.facebook).toBeDefined();

    // YouTube
    expect(result?.youtube?.description).toContain("Panduan lengkap melipatgandakan produktivitas");
    expect(result?.youtube?.hashtags).toContain("#Produktivitas");
    expect(result?.youtube?.tags).toContain("cara produktif kerja");

    // TikTok
    expect(result?.tiktok?.description).toContain("1 trik rahasia fokus 4 jam");
    expect(result?.tiktok?.hashtags).toContain("#FYP");
    expect(result?.tiktok?.tags).toContain("tips produktivitas fyp");

    // Instagram
    expect(result?.instagram?.description).toContain("Berhenti multitasking sekarang");
    expect(result?.instagram?.hashtags).toContain("#SelfGrowth");
    expect(result?.instagram?.tags).toContain("burnout prevention");

    // Facebook
    expect(result?.facebook?.description).toContain("Rekan-rekan profesional");
    expect(result?.facebook?.hashtags).toContain("#KomunitasProfesional");
    expect(result?.facebook?.tags).toContain("diskusi karier");
  });

  it("menghitung jumlah karakter dan evaluasi sweet spot dengan akurat", () => {
    const result = extractMultiPlatformSeo(sample4PlatformScript);
    expect(result?.youtube?.charCount.description).toBeGreaterThan(150);
    expect(result?.youtube?.charCount.hashtags).toBeGreaterThan(0);
    expect(result?.youtube?.charCount.tags).toBeGreaterThan(0);
    expect(result?.youtube?.status.descriptionIdeal).toBe(true);

    expect(result?.tiktok?.charCount.description).toBeGreaterThan(50);
    expect(result?.tiktok?.charCount.description).toBeLessThan(350);
    expect(result?.tiktok?.status.descriptionIdeal).toBe(true);

    expect(result?.instagram?.charCount.description).toBeGreaterThan(100);
    expect(result?.instagram?.status.descriptionIdeal).toBe(true);

    expect(result?.facebook?.charCount.description).toBeGreaterThan(150);
    expect(result?.facebook?.status.descriptionIdeal).toBe(true);
  });

  it("memberikan peringatan jika karakter melanggar batas (hard limit / sweet spot warning)", () => {
    // YouTube tags > 500 chars
    const overTags = "tag, ".repeat(150); // ~750 chars
    const statusYT = evaluatePlatformSeoStatus("youtube", 1000, overTags.length);
    expect(statusYT.tagsWarning).toContain("500 karakter");

    // TikTok caption > 400 chars
    const longTikTok = "A".repeat(450);
    const statusTT = evaluatePlatformSeoStatus("tiktok", longTikTok.length, 50);
    expect(statusTT.descriptionWarning).toContain("menutupi video");

    // Instagram caption > 600 chars
    const longIG = "B".repeat(600);
    const statusIG = evaluatePlatformSeoStatus("instagram", longIG.length, 50);
    expect(statusIG.descriptionWarning).toContain("125 karakter");
  });

  it("mendukung variasi sintaks (bold markdown, tanpa kurung siku, dan penomoran)", () => {
    const variedSyntaxScript = `
## METADATA SEO
### 1. YOUTUBE
**DESKRIPSI**: Deskripsi YouTube bold markdown
**HASHTAGS**: #YT #Video
**TAGS**: tag1, tag2

### 2. TIKTOK
CAPTION: Caption TikTok santai
HASHTAG: #TikTokViral
KATA KUNCI SEARCH SEO: pencarian tiktok 1, pencarian tiktok 2

### 3. INSTAGRAM
DESKRIPSI: Hook IG Reels
HASHTAGS: #Reels #IG
REKOMENDASI KEYWORD: explore keyword 1

### 4. FACEBOOK
STATUS: Status FB ramah komunitas
HASHTAGS: #FB #Diskusi
TOPIK KOMUNITAS: komunitas fb
`;

    const result = extractMultiPlatformSeo(variedSyntaxScript);
    expect(result?.youtube?.description).toBe("Deskripsi YouTube bold markdown");
    expect(result?.youtube?.tags).toBe("tag1, tag2");
    expect(result?.tiktok?.description).toBe("Caption TikTok santai");
    expect(result?.tiktok?.tags).toBe("pencarian tiktok 1, pencarian tiktok 2");
    expect(result?.instagram?.description).toBe("Hook IG Reels");
    expect(result?.instagram?.tags).toBe("explore keyword 1");
    expect(result?.facebook?.description).toBe("Status FB ramah komunitas");
    expect(result?.facebook?.tags).toBe("komunitas fb");
  });

  it("gracefully fallback ke legacy caption/hashtags jika naskah tidak memiliki pemisah 4 platform", () => {
    const legacyScript = `
## SCENE 1
NARASI: Halo ini naskah lama
DURASI: 5s

## KONTEN PLATFORM
CAPTION: Ini adalah caption umum naskah lama
HASHTAGS: #NaskahLama #Classic
`;

    const result = extractMultiPlatformSeo(legacyScript);
    expect(result).not.toBeNull();
    expect(result?.youtube?.description).toBe("Ini adalah caption umum naskah lama");
    expect(result?.youtube?.hashtags).toBe("#NaskahLama #Classic");
    expect(result?.tiktok?.description).toBe("Ini adalah caption umum naskah lama");
    expect(result?.instagram?.description).toBe("Ini adalah caption umum naskah lama");
    expect(result?.facebook?.description).toBe("Ini adalah caption umum naskah lama");
  });

  it("mengintegrasikan multiPlatformSeo secara mulus di parseFunnelPack", () => {
    const funnelWithPlatformScript = `
### [SEGMENT: SHORT 1]
Judul: Short 1 Hook
Aspek Rasio: 9:16
## SCENE 1
NARASI: Short 1 narasi
DURASI: 5s
### [PLATFORM: TIKTOK]
DESKRIPSI: TikTok Short 1
HASHTAGS: #S1TT
TAGS REKOMENDASI: s1 tag

### [SEGMENT: SHORT 2]
Judul: Short 2 Problem
Aspek Rasio: 9:16
## SCENE 1
NARASI: Short 2 narasi
DURASI: 5s
### [PLATFORM: INSTAGRAM]
DESKRIPSI: IG Short 2
HASHTAGS: #S2IG
TAGS REKOMENDASI: s2 tag

### [SEGMENT: LONG PILLAR]
Judul: Long Pillar Masterclass
Aspek Rasio: 16:9
## SCENE 1
NARASI: Long masterclass narasi
DURASI: 10s
### [PLATFORM: YOUTUBE]
DESKRIPSI: YouTube Long Pillar komprehensif
HASHTAGS: #LongYT
TAGS REKOMENDASI: long tag
`;

    const funnelPack = parseFunnelPack(funnelWithPlatformScript);
    expect(funnelPack.isFunnel).toBe(true);
    expect(funnelPack.segments.short1.multiPlatformSeo?.tiktok?.description).toBe("TikTok Short 1");
    expect(funnelPack.segments.short2.multiPlatformSeo?.instagram?.description).toBe("IG Short 2");
    expect(funnelPack.segments.long.multiPlatformSeo?.youtube?.description).toBe("YouTube Long Pillar komprehensif");
    expect(funnelPack.multiPlatformSeo).not.toBeNull();
  });
});
