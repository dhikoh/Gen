import { describe, it, expect } from "vitest";
import { extractBlogPublishingPack, extractHtmlBlog } from "@/lib/parsers";

const SAMPLE_BLOG_OUTPUT = `
JUDUL TERPILIH: Rahasia Sukses Berkebun Organik di Lahan Sempit

CAPTION: Panduan lengkap menanam sayur organik di balkon apartemen.
HASHTAGS: #UrbanFarming #BerkebunOrganik

## SCENE 1
KONTEKS SCENE: Intro balkon hijau
NARASI: Apakah Anda ingin memetik sayuran segar setiap pagi dari balkon sendiri?
DURASI: 5s

## HTML BLOG & PUBLISHING PACK
[METADATA & PROMPT PENDUKUNG BLOG]
META DESCRIPTION: Panduan lengkap cara menanam sayuran organik di balkon apartemen sempit dengan metode living soil dan nutrisi alami tanpa pupuk kimia sintetis.
KATEGORI/TAGS: Urban Farming, Berkebun Organik, Balkon Apartemen, Living Soil
PROMPT THUMBNAIL 16:9: Vibrant organic tomato plant thriving in terracotta pot on modern high-rise balcony at golden hour, typography overlay "URBAN LIVING SOIL", high contrast cinematic photography --ar 16:9
PROMPT GAMBAR PENDUKUNG:
1. Close-up of rich dark living soil crawling with beneficial mycorrhizal fungi threads and compost worms.
2. Step-by-step wooden potting box setup showing drainage holes, gravel layer, and active organic compost.
REKOMENDASI PRODUK AFILIASI:
1. Paket Vermicompost Aktif 5kg (Lengkap dengan cacing tanah hidup)
2. Gunting Pruning Stainless Steel Ergonomis

[KODE ARTIKEL HTML UTUH]
\`\`\`html
<article class="blog-post">
  <h1>Rahasia Sukses Berkebun Organik di Balkon Apartemen</h1>
  <p>Memiliki lahan sempit bukan lagi halangan untuk menikmati sayuran segar bebas pestisida.</p>
  
  <h2>1. Mengapa Living Soil Mengubah Segalanya?</h2>
  <p>Media tanam konvensional sering kali mati secara biologis setelah sterilisasi suhu tinggi.</p>
  
  <table class="data-table">
    <caption class="source-caption">Tabel Perbandingan Media Tanam</caption>
    <thead>
      <tr>
        <th>Karakteristik</th>
        <th>Tanah Biasa</th>
        <th>Living Soil</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Mikrobioma Aktif</td>
        <td>Rendah</td>
        <td>Sangat Tinggi</td>
      </tr>
    </tbody>
  </table>

  <h2>2. Alur Sirkulasi Nutrisi</h2>
  <svg viewBox="0 0 400 100" class="cycle-chart">
    <rect width="100" height="40" fill="#10b981"/>
    <text x="10" y="25" fill="#fff">Fotosintesis</text>
  </svg>

  <div class="interactive-calculator">
    <h3>Kalkulator Campuran Media Tanam</h3>
    <input type="number" id="potSize" placeholder="Ukuran pot (Liter)" />
    <button type="button" onclick="calculateMix()">Hitung Campuran</button>
    <div id="result">Hasil: 0 Liter Kompos</div>
  </div>
</article>
\`\`\`
`;

describe("extractBlogPublishingPack & extractHtmlBlog", () => {
  it("mengekstrak metadata, tag, prompt thumbnail, dan gambar pendukung secara akurat", () => {
    const pack = extractBlogPublishingPack(SAMPLE_BLOG_OUTPUT);

    expect(pack.metaDescription).toContain("Panduan lengkap cara menanam sayuran organik");
    expect(pack.tags).toEqual(["Urban Farming", "Berkebun Organik", "Balkon Apartemen", "Living Soil"]);
    expect(pack.thumbnailPrompt).toContain("Vibrant organic tomato plant");
    expect(pack.supportingImagePrompts).toHaveLength(2);
    expect(pack.supportingImagePrompts[0]).toContain("Close-up of rich dark living soil");
    expect(pack.affiliateCallouts).toHaveLength(2);
    expect(pack.affiliateCallouts[0]).toContain("Paket Vermicompost");
  });

  it("mengekstrak kode HTML bersih tanpa code fence", () => {
    const html = extractHtmlBlog(SAMPLE_BLOG_OUTPUT);

    expect(html).toContain("<article class=\"blog-post\">");
    expect(html).toContain("<h1>Rahasia Sukses Berkebun Organik di Balkon Apartemen</h1>");
    expect(html).toContain("</article>");
    expect(html.startsWith("```")).toBe(false);
    expect(html.endsWith("```")).toBe(false);
  });

  it("mendeteksi elemen dinamis: Table, SVG Chart, dan Interactive Calculator", () => {
    const pack = extractBlogPublishingPack(SAMPLE_BLOG_OUTPUT);

    expect(pack.hasTable).toBe(true);
    expect(pack.hasSvgChart).toBe(true);
    expect(pack.hasInteractiveCalculator).toBe(true);
  });

  it("mengembalikan objek kosong jika bagian HTML BLOG tidak ada di naskah", () => {
    const noBlogText = `JUDUL: Testing\n## SCENE 1\nNARASI: Halo dunia`;
    const pack = extractBlogPublishingPack(noBlogText);

    expect(pack.html).toBe("");
    expect(pack.metaDescription).toBe("");
    expect(pack.tags).toHaveLength(0);
    expect(pack.hasTable).toBe(false);
    expect(pack.hasSvgChart).toBe(false);
    expect(pack.hasInteractiveCalculator).toBe(false);
    expect(extractHtmlBlog(noBlogText)).toBe("");
  });

  it("mampu mengekstrak HTML mentah tanpa code fence jika diawali langsung tag HTML", () => {
    const rawHtmlBlock = `## HTML BLOG\nMETA DESCRIPTION: Deskripsi artikel singkat\n\n<h1>Judul Artikel Langsung</h1>\n<p>Paragraf isi tanpa backticks.</p>`;
    const pack = extractBlogPublishingPack(rawHtmlBlock);

    expect(pack.html).toContain("<h1>Judul Artikel Langsung</h1>");
    expect(pack.html).toContain("<p>Paragraf isi tanpa backticks.</p>");
    expect(pack.metaDescription).toBe("Deskripsi artikel singkat");
  });
});
