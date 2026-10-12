import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { processPanelImage } from "@/lib/imageProcessing";
import { detectImageKind } from "@/lib/imageKind";

describe("processPanelImage", () => {
  it("mengonversi PNG besar ke WebP + thumbnail", async () => {
    const png = await sharp({
      create: { width: 2400, height: 4200, channels: 3, background: { r: 200, g: 50, b: 50 } },
    })
      .png()
      .toBuffer();
    expect(detectImageKind(png)).toBe("png");
    const out = await processPanelImage(png);
    expect(detectImageKind(out.main)).toBe("webp");
    expect(Math.max(out.width, out.height)).toBeLessThanOrEqual(1280);
    const t = await sharp(out.thumb).metadata();
    expect(Math.max(t.width ?? 0, t.height ?? 0)).toBeLessThanOrEqual(360);
  });

  it("menolak data yang bukan gambar", async () => {
    await expect(processPanelImage(Buffer.from("bukan gambar sama sekali"))).rejects.toThrow();
  });
});
