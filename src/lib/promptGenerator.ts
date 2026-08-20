export interface ProfileChannelData {
  channelName: string;
  niche?: string | null;
  description?: string | null;
  visualAesthetic?: string | null;
  cta1?: string | null;
  cta2?: string | null;
  audioBGM?: boolean | null;
  audioSFX?: boolean | null;
  audioVO?: boolean | null;
  products?: Array<{
    name: string;
    price: number;
    description?: string | null;
  }>;
}

export interface VideoConfigData {
  targetPlatform?: string | null;
  targetDurationSec?: number | null;
  targetSceneCount?: number | null;
  aspectRatio?: string | null;
  narrativeLoopStyle?: string | null;
  visualLoopStyle?: string | null;
  pov?: string | null;
  speechRate?: string | null;
  hookStyle?: string | null;
  endingStyle?: string | null;
  selectedProductId?: string | null;
  selectedProduct?: {
    name: string;
    price: number;
    description?: string | null;
  };
  composition?: {
    education?: number | null;
    entertainment?: number | null;
    marketing?: number | null;
  } | null;
  includeHook?: boolean | null;
  includeCTA?: boolean | null;
  socialCaption?: boolean | null;
  thumbnailIdea?: boolean | null;
  htmlBlog?: boolean | null;
}

export interface PromptSettingsData {
  videoSystemInstruction?: string | null;
  imageSystemInstruction?: string | null;
}

export function generateMasterPrompt(
  channel: ProfileChannelData,
  topic: string,
  additionalContext: string,
  videoConfig: VideoConfigData,
  promptSettings?: PromptSettingsData | null,
  excludeTitles?: string[]
): { masterPrompt: string; systemInstruction: string } {
  const channelContext = `
Nama Channel/Akun: ${channel.channelName}
Niche: ${channel.niche || "-"}
Deskripsi/Ciri Khas: ${channel.description || "-"}
Gaya Visual: ${channel.visualAesthetic || "-"}
Call to Action 1: ${channel.cta1 || "-"}
Call to Action 2: ${channel.cta2 || "-"}
Gunakan Audio BGM: ${channel.audioBGM ? "Ya" : "Tidak"}
Gunakan Audio SFX: ${channel.audioSFX ? "Ya" : "Tidak"}
Gunakan Audio VO: ${channel.audioVO ? "Ya" : "Tidak"}
`.trim();

  let productContext = "Tidak ada produk khusus untuk disisipkan.";
  if (videoConfig?.selectedProduct) {
    productContext = `Produk Utama yang Dipromosikan (Soft-selling/Hard-selling):\n- ${videoConfig.selectedProduct.name} (Rp ${videoConfig.selectedProduct.price}): ${videoConfig.selectedProduct.description || "-"}`;
  } else if (channel.products && channel.products.length > 0) {
    productContext = `Produk untuk Soft-selling:\n${channel.products.map((p) => `- ${p.name} (Rp ${p.price}): ${p.description || "-"}`).join('\n')}`;
  }

  let systemInstruction = `Kamu adalah asisten ahli kreator konten dan scriptwriter profesional. Bertindaklah sebagai ${videoConfig?.pov || "Ahli di bidang ini"}.`;
  if (promptSettings?.videoSystemInstruction?.trim()) {
    systemInstruction += `\n${promptSettings.videoSystemInstruction.trim()}`;
  }

  let excludeSection = "";
  if (excludeTitles && excludeTitles.length > 0) {
    excludeSection = `
8. DILARANG MENGGUNAKAN JUDUL BERIKUT (SUDAH TERPAKAI / TERPILIH)
PENTING: JANGAN SEKALI-KALI merekomendasikan, membuat, atau memilih judul yang sama persis maupun yang mirip dengan daftar judul terpakai di bawah ini:
${excludeTitles.map((t) => `- "${t}"`).join("\n")}
`;
  }

  const jsonFields = [
    `"judul_konten": "string (Judul menarik untuk video)"`
  ];
  if (videoConfig?.socialCaption) jsonFields.push(`"caption_medsos": "string (Caption lengkap dengan hashtag)"`);
  if (videoConfig?.thumbnailIdea) jsonFields.push(`"ide_thumbnail": "string (Ide visual thumbnail yang clickbait namun relevan)"`);
  if (videoConfig?.htmlBlog) jsonFields.push(`"html_blog": "string (Artikel blog format HTML SEO-friendly berdasarkan skrip video)"`);
  
  jsonFields.push(`"segments": [\n    {\n      "order": number,\n      "type": "string (Tipe scene: A-roll, B-roll, Text, dsb)",\n      "visual": "string (Instruksi visual/kamera/B-roll)",\n      "audio": "string (Musik/Sound Effect)",\n      "caption": "string (Teks yang diucapkan/Voice Over)",\n      "duration_estimation": number (Estimasi detik)\n    }\n  ]`);

  const masterPrompt = `
Buatkan struktur konten video (Video Script) berdasarkan parameter berikut:

1. PROFIL CHANNEL
${channelContext}

2. PRODUK (SOFT-SELLING / PROMOSI)
${productContext}

3. TOPIK UTAMA
${topic}

4. KONTEKS TAMBAHAN
${additionalContext || "-"}

5. PENGATURAN VIDEO
- Platform Target: ${videoConfig?.targetPlatform || "TikTok / Reels"}
- Target Durasi: ${videoConfig?.targetDurationSec ? `${videoConfig.targetDurationSec} detik` : "Opsional"}
- Target Jumlah Scene: ${videoConfig?.targetSceneCount ? `${videoConfig.targetSceneCount} scene` : "Opsional"}
- Aspect Ratio Video: ${videoConfig?.aspectRatio || "9:16"}
- POV / Persona: ${videoConfig?.pov || "Kreator Ahli"}
- Laju Bicara: ${videoConfig?.speechRate || "Sedang"}
- Hook Style: ${videoConfig?.hookStyle || "Pertanyaan Provokatif"}
- Ending Style: ${videoConfig?.endingStyle || "Pertanyaan Terbuka"}
- Gaya Loop Narasi: ${videoConfig?.narrativeLoopStyle || "Tanpa Loop"}
- Gaya Loop Visual: ${videoConfig?.visualLoopStyle || "Tanpa Loop"}

6. KOMPOSISI KONTEN
- Edukasi: ${videoConfig?.composition?.education || 0}%
- Hiburan: ${videoConfig?.composition?.entertainment || 0}%
- Marketing: ${videoConfig?.composition?.marketing || 0}%

7. KOMPONEN TAMBAHAN
- Sertakan Hook: ${videoConfig?.includeHook ? "Ya" : "Tidak"}
- Sertakan CTA: ${videoConfig?.includeCTA ? "Ya" : "Tidak"}
- Buat Caption Medsos: ${videoConfig?.socialCaption ? "Ya" : "Tidak"}
- Ide Thumbnail: ${videoConfig?.thumbnailIdea ? "Ya" : "Tidak"}
- Generate Artikel HTML Blog: ${videoConfig?.htmlBlog ? "Ya" : "Tidak"}
${excludeSection}
8. INSTRUKSI KHUSUS & KETENTUAN KONTEN:
${videoConfig?.targetDurationSec ? `- PENTING: Pastikan teks narasi dan adegan yang dihasilkan kira-kira dapat diselesaikan dalam waktu persis atau mendekati ${videoConfig.targetDurationSec} detik.` : ""}
${videoConfig?.targetSceneCount ? `- PENTING: Buatlah segmen video (array segments) persis berjumlah ${videoConfig.targetSceneCount} scene.` : ""}
- Wajib mematuhi profil channel di atas. Jika BGM/SFX diatur ke "Tidak", pastikan tabel/field audio tidak mengisinya atau kosong.
${excludeTitles && excludeTitles.length > 0 ? "- WAJIB MEMATUHI ATURAN: Dilarang menggunakan judul yang sudah terpakai di daftar poin 8 di atas." : ""}

PANDUAN INTERAKSI ALUR (2-TAHAP):
PENTING:
- TAHAP 1 (Penawaran 10 Judul Viral):
  1. Tampilkan 10 rekomendasi judul konten berpotensi viral berdasarkan topik dan profil channel di atas, lengkap dengan perkiraan persentase potensi viralitasnya (contoh: "1. [Judul Konten] (Potensi Viral: 95%)").
  2. BERHENTI sementara dan berikan pesan kepada pengguna: "Silakan balas dengan memilih nomor judul (1-10) atau ketik judul Anda sendiri untuk melanjutkan pembuatan naskah video lengkap."

- TAHAP 2 (Eksekusi Output JSON Skrip Video):
  Setelah pengguna memberikan nomor pilihan atau judul yang diinginkan:
  Buatkan struktur naskah video lengkap dan berikan output HANYA dalam format JSON yang valid tanpa teks tambahan dan tanpa markdown block (\`\`\`).
  Struktur JSON wajib mengikuti skema berikut:
  {
    "opsi_judul": ["string", "string", "... (10 opsi judul rekomendasi dari Tahap 1)"],
    ${jsonFields.join(",\n    ")}
  }
`;

  return { masterPrompt, systemInstruction };
}
