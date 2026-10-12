import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { storageDelete, storageGet, storageList, storagePut } from "@/lib/storage";

let dir = "";

beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "pg-storage-"));
  vi.stubEnv("STORAGE_DIR", dir);
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await fs.rm(dir, { recursive: true, force: true });
});

describe("storage", () => {
  it("menulis, membaca, dan menghapus file", async () => {
    await storagePut("storyboard/u1/d1/a.webp", Buffer.from("halo"));
    const got = await storageGet("storyboard/u1/d1/a.webp");
    expect(got?.toString()).toBe("halo");
    await storageDelete("storyboard/u1/d1/a.webp");
    expect(await storageGet("storyboard/u1/d1/a.webp")).toBeNull();
  });

  it("menolak key berbahaya", async () => {
    await expect(storagePut("../evil.txt", Buffer.from("x"))).rejects.toThrow();
    await expect(storagePut("/etc/passwd", Buffer.from("x"))).rejects.toThrow();
    await expect(storagePut("a/../../b.txt", Buffer.from("x"))).rejects.toThrow();
    await expect(storagePut("UPPER/case.txt", Buffer.from("x"))).rejects.toThrow();
  });

  it("menghapus file yang tidak ada tidak error", async () => {
    await expect(storageDelete("storyboard/none/none/x.webp")).resolves.toBeUndefined();
  });

  it("storageList mengembalikan key relatif", async () => {
    await storagePut("storyboard/u2/d2/b.webp", Buffer.from("1"));
    const list = await storageList("storyboard");
    expect(list.map((f) => f.key)).toContain("storyboard/u2/d2/b.webp");
  });
});
