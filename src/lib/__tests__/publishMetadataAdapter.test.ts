import { describe, it, expect } from "vitest";
import { adaptPublishMetadata } from "@/lib/publishMetadataAdapter";

describe("publishMetadataAdapter", () => {
  it("1. Menyesuaikan metadata untuk YouTube, Instagram, dan Facebook secara otomatis", () => {
    const result = adaptPublishMetadata({
      title: "5 Kesalahan Fatal Saat Membuat Konten Video Pendek",
      caption: "Banyak kreator pemula mengulang kesalahan yang sama.",
      hashtags: "#ContentTips #CreatorLife #VideoMarketing",
      aspectRatio: "9:16",
      channel: {
        channelName: "Creator Academy",
        niche: "Content Creation",
        cta1: "Cek link bio untuk template gratis",
      },
      privacyStatus: "public",
    });

    // YouTube checks
    expect(result.youtube.title).toBe("5 Kesalahan Fatal Saat Membuat Konten Video Pendek");
    expect(result.youtube.isShorts).toBe(true);
    expect(result.youtube.privacyStatus).toBe("public");
    expect(result.youtube.description).toContain("Banyak kreator pemula");
    expect(result.youtube.description).toContain("👉 Cek link bio untuk template gratis");
    expect(result.youtube.description).toContain("#ContentTips #CreatorLife #VideoMarketing");
    expect(result.youtube.tags).toContain("Content Creation");
    expect(result.youtube.tags).toContain("ContentTips");

    // Instagram checks
    expect(result.instagram.caption).toContain("🎬 5 Kesalahan Fatal Saat Membuat Konten Video Pendek");
    expect(result.instagram.caption).toContain("👉 Cek link bio untuk template gratis");
    expect(result.instagram.caption).toContain("#ContentTips");
    expect(result.instagram.mediaType).toBe("REELS");

    // Facebook checks
    expect(result.facebook.title).toBe("5 Kesalahan Fatal Saat Membuat Konten Video Pendek");
    expect(result.facebook.description).toContain("Banyak kreator pemula");
  });

  it("2. Memotong judul yang melebihi batas 100 karakter YouTube secara rapi tanpa memutus kata", () => {
    const superLongTitle =
      "Judul Sangat Panjang Sekali Yang Melebihi Batas Seratus Karakter Karena Dibuat Oleh Prompt Yang Kurang Terkontrol Dan Harus Dipotong Rapi";
    const result = adaptPublishMetadata({
      title: superLongTitle,
      aspectRatio: "16:9",
    });

    expect(result.youtube.title.length).toBeLessThanOrEqual(100);
    expect(result.youtube.title.endsWith(" ")).toBe(false);
    expect(result.youtube.isShorts).toBe(false);
  });

  it("3. Mendukung multiPlatformSeo 2026 yang spesifik per platform", () => {
    const result = adaptPublishMetadata({
      title: "Judul Umum",
      multiPlatformSeo: {
        youtube: {
          description: "Deskripsi khusus YouTube yang kaya kata kunci SEO 2026.",
          hashtags: "#YouTubeTips #Algoritma",
          tags: "youtube studio, cara viral, seo 2026",
        },
        instagram: {
          description: "Hook baris 1 Instagram Reels yang memicu rasa ingin tahu tinggi.",
          hashtags: "#ReelsViral #InstaTips",
        },
        facebook: {
          description: "Postingan Facebook ramah diskusi komunitas.",
          hashtags: "#KomunitasFB",
        },
      } as any,
    });

    expect(result.youtube.description).toContain("Deskripsi khusus YouTube");
    expect(result.youtube.tags).toContain("youtube studio");
    expect(result.instagram.caption).toContain("Hook baris 1 Instagram Reels");
    expect(result.facebook.description).toContain("Postingan Facebook");
  });
});
