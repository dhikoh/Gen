import sharp from "sharp";

export interface ProcessedPanel {
  main: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
}

/**
 * Konversi ke WebP: gambar utama maks 1280px (sisi terpanjang), thumbnail maks 360px.
 * Metadata (EXIF/GPS) dibuang secara bawaan oleh sharp. Orientasi EXIF diterapkan lebih dulu.
 * Melempar error jika gambar rusak / terlalu besar (piksel).
 */
export async function processPanelImage(input: Buffer): Promise<ProcessedPanel> {
  const base = sharp(input, { failOn: "error", limitInputPixels: 50_000_000 }).rotate();
  const main = await base
    .clone()
    .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await base
    .clone()
    .resize({ width: 360, height: 360, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();
  return { main: main.data, thumb, width: main.info.width, height: main.info.height };
}
