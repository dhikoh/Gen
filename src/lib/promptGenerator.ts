export function generateMasterPrompt(
  channel: any,
  topic: string,
  additionalContext: string,
  videoConfig: any,
  promptSettings?: any
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

  const activeProducts = channel.products || [];
  const productContext = activeProducts.length > 0 
    ? `Produk untuk Soft-selling:\n${activeProducts.map((p: any) => `- ${p.name} (Rp ${p.price}): ${p.description}`).join('\n')}`
    : "Tidak ada produk khusus untuk disisipkan.";

  let systemInstruction = `Kamu adalah asisten ahli kreator konten dan scriptwriter profesional. Bertindaklah sebagai ${videoConfig?.pov || "Ahli di bidang ini"}.`;
  if (promptSettings?.videoSystemInstruction?.trim()) {
    systemInstruction += `\n${promptSettings.videoSystemInstruction.trim()}`;
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

2. PRODUK (SOFT-SELLING)
${productContext}

3. TOPIK UTAMA
${topic}

4. KONTEKS TAMBAHAN
${additionalContext || "-"}

5. PENGATURAN VIDEO
- Platform Target: ${videoConfig?.targetPlatform || "Tiktok / Reels"}
- Target Durasi: ${videoConfig?.targetDurationSec ? `${videoConfig.targetDurationSec} detik` : "Opsional"}
- POV / Persona: ${videoConfig?.pov || "Kreator Ahli"}
- Laju Bicara: ${videoConfig?.speechRate || "Sedang"}
- Hook Style: ${videoConfig?.hookStyle || "Pertanyaan Provokatif"}
- Ending Style: ${videoConfig?.endingStyle || "Pertanyaan Terbuka"}

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

Instruksi Khusus:
${videoConfig?.targetDurationSec ? `PENTING: Pastikan teks narasi dan adegan yang dihasilkan kira-kira dapat diselesaikan dalam waktu persis atau mendekati ${videoConfig.targetDurationSec} detik.` : ""}
Pastikan Anda mematuhi profil channel di atas. Jika BGM/SFX diatur ke "Tidak", pastikan tabel output Anda tidak mengisinya atau kosong.

Berikan 10 opsi judul menarik, lalu pilih satu sebagai judul_konten utama.
Berikan output HANYA dalam format JSON yang valid tanpa markdown block (\`\`\`). Struktur JSON wajib mengikuti skema berikut:
{
  "opsi_judul": ["string", "string", "..."],
  ${jsonFields.join(",\n  ")}
}
`;

  return { masterPrompt, systemInstruction };
}
