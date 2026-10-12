import { describe, expect, it } from "vitest";
import { detectImageKind } from "@/lib/imageKind";

function pad(bytes: number[], total = 16): Buffer {
  const b = Buffer.alloc(total);
  bytes.forEach((v, i) => { b[i] = v; });
  return b;
}

describe("detectImageKind", () => {
  it("mengenali JPEG", () => expect(detectImageKind(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg"));
  it("mengenali PNG", () =>
    expect(detectImageKind(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png"));
  it("mengenali WebP", () => {
    const b = Buffer.alloc(16);
    b.write("RIFF", 0, "ascii");
    b.write("WEBP", 8, "ascii");
    expect(detectImageKind(b)).toBe("webp");
  });
  it("menolak SVG, GIF, dan teks", () => {
    expect(detectImageKind(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(detectImageKind(Buffer.from("GIF89a000000000000"))).toBeNull();
    expect(detectImageKind(Buffer.from("halo dunia"))).toBeNull();
  });
});
