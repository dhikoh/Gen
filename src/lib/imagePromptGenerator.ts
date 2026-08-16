export function generateImagePrompt(
  channel: any,
  topic: string,
  additionalContext: string,
  imageConfig: any
): { masterPrompt: string; systemInstruction: string } {
  const channelContext = `
Nama Channel/Akun: ${channel.channelName}
Gaya Visual: ${channel.visualAesthetic || "-"}
`.trim();

  const systemInstruction = `Kamu adalah asisten ahli pembuat prompt untuk AI Image Generator (seperti Midjourney, DALL-E, Stable Diffusion).`;

  const masterPrompt = `
Buatkan Prompt Gambar (Midjourney / DALL-E) berdasarkan parameter berikut:

1. PROFIL CHANNEL
${channelContext}

2. TOPIK UTAMA / OBJEK
${topic}

3. KONTEKS TAMBAHAN
${additionalContext || "-"}

4. PENGATURAN KAMERA & VISUAL
- Camera & Lens: ${imageConfig?.cameraType || "Default"}
- Shot Type: ${imageConfig?.shotType || "Medium Shot"}
- Lighting: ${imageConfig?.lighting || "Natural Light"}
- Mood / Atmosphere: ${imageConfig?.mood || "Neutral"}
- Color Grading: ${imageConfig?.colorGrading || "Standard"}
- Visual Style: ${imageConfig?.visualStyle || "Photorealistic"}
- Negative Prompt: ${imageConfig?.negativePrompt || "None"}
- Aspect Ratio: ${imageConfig?.aspectRatio || "16:9"}

Jumlah Variasi yang diminta: ${imageConfig?.variations || 4}

Instruksi Khusus:
Hasilkan baris prompt siap pakai (dalam bahasa Inggris, karena Midjourney/DALL-E menggunakan bahasa Inggris) yang menggabungkan seluruh elemen di atas menjadi deskripsi prompt yang koheren. Hasilkan array string. Jika ada negative prompt, tambahkan parameter --no pada akhir kalimat jika untuk Midjourney. Tambahkan parameter --ar ${imageConfig?.aspectRatio === '9:16' ? '9:16' : imageConfig?.aspectRatio === '1:1' ? '1:1' : '16:9'} jika untuk Midjourney.

Berikan output HANYA dalam format JSON yang valid. Struktur JSON wajib mengikuti skema berikut:
{
  "variations": [
    {
      "id": number,
      "prompt_text": "string (Prompt lengkap dalam bahasa Inggris, menggabungkan topik dan semua parameter visual secara natural)",
      "negative_prompt": "string (Berdasarkan referensi di atas)",
      "aspect_ratio": "string (Rekomendasi rasio seperti --ar 16:9)"
    }
  ]
}
`;

  return { masterPrompt, systemInstruction };
}
