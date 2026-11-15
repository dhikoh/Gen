import { describe, it, expect } from "vitest";
import {
  detectOutputStructure,
  parseFunnelPack,
  extractThreeTierSeo,
  formatAsYouTubeTags,
  formatAsHashtags,
  buildCombinedYouTubeTags,
} from "@/lib/parsers";

describe("E2E Skenario 5: Funnel Pack Bundle (Top/Mid/Bottom) & YouTube 3-Tier SEO Engine", () => {
  const mockFunnelScript = `
STRUKTUR KONTEN: FUNNEL_BUNDLE

## SEGMENT: SHORT 1 - The Spark Hook (9:16)
ADEGAN 1
DURASI: 15s
NARASI: Pernah gak sih kamu mikir, kenapa 90% waktu bisnis habis buat hal sepele? [SFX: Whoosh]
VISUAL: Ilustrasi laptop dan tumpukan dokumen menumpuk dengan animasi stres.

ADEGAN 2
DURASI: 15s
NARASI: Nah, hari ini kita bedah solusinya di video panjang! Cek link di kolom komentar ya!
VISUAL: Tombol play video panjang berkedip dengan pendar emas.

## SEGMENT: SHORT 2 - The Contrarian Angle (9:16)
ADEGAN 1
DURASI: 20s
NARASI: Banyak yang bilang otomasi itu mahal dan ribet. Faktanya, dengan AI gratisan ini kamu bisa mulai detik ini juga!
VISUAL: Teks perbandingan biaya konvensional vs AI.

## SEGMENT: LONG PILLAR - Masterclass Otomasi AI 2026 (16:9)
## BAB 1: Anatomi Waktu Bisnis
ADEGAN 1
DURASI: 30s
NARASI: Selamat datang di masterclass lengkap. Di bab pertama ini kita petakan 3 pilar utama workflow modern.
VISUAL: Diagram alur 3 pilar bisnis digital.

## METADATA SEO YOUTUBE 2026
TAG SPESIFIK:
otomasi solo founder 2026, workflow ai gratis, tutorial generate script ai

TAG UMUM:
kecerdasan buatan, produktivitas kerja, tips bisnis online, tools digital

TAG MAJEMUK:
cara hemat waktu bisnis dengan ai, panduan solo founder tanpa karyawan

DESKRIPSI:
Pelajari panduan lengkap mengotomasi alur kerja solo founder menggunakan tools AI modern 2026. Hemat 20 jam per minggu tanpa biaya tim besar.
`;

  it("detects output structure as FUNNEL_BUNDLE and parses all 3 segments cleanly", () => {
    const structure = detectOutputStructure(mockFunnelScript);
    expect(structure).toBe("FUNNEL_BUNDLE");

    const funnelData = parseFunnelPack(mockFunnelScript);
    expect(funnelData.isFunnel).toBe(true);

    // Short 1
    const short1 = funnelData.segments.short1;
    expect(short1).toBeDefined();
    expect(short1.id).toBe("short1");
    expect(short1.aspectRatio).toBe("9:16");
    expect(short1.scenes.length).toBe(2);

    // Short 2
    const short2 = funnelData.segments.short2;
    expect(short2).toBeDefined();
    expect(short2.id).toBe("short2");
    expect(short2.aspectRatio).toBe("9:16");

    // Long Pillar
    const longPillar = funnelData.segments.long;
    expect(longPillar).toBeDefined();
    expect(longPillar.id).toBe("long");
    expect(longPillar.aspectRatio).toBe("16:9");
    expect(longPillar.scenes.length).toBeGreaterThan(0);
    expect(longPillar.scenes[0].chapterTitle).toBe("Anatomi Waktu Bisnis");
  });

  it("extracts 3-Tier SEO metadata and formats tags and hashtags with deduplication", () => {
    const seo = extractThreeTierSeo(mockFunnelScript);

    expect(seo).not.toBeNull();
    expect(seo?.tagSpesifik).toContain("otomasi solo founder 2026");
    expect(seo?.tagUmum).toContain("kecerdasan buatan");
    expect(seo?.tagMajemuk).toContain("cara hemat waktu bisnis dengan ai");
    expect(seo?.deskripsi).toContain("Hemat 20 jam per minggu");

    // Format tags komprehensif
    const combinedTags = buildCombinedYouTubeTags(
      seo?.tagSpesifik || "",
      seo?.tagUmum || "",
      seo?.tagMajemuk || ""
    );

    expect(combinedTags).toContain("otomasi solo founder 2026");
    expect(combinedTags).toContain("kecerdasan buatan");

    // Format hashtags
    const hashtags = formatAsHashtags(seo?.tagSpesifik || "");
    expect(hashtags).toContain("#OtomasiSoloFounder2026");
  });
});
