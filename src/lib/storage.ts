import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Hanya huruf kecil, angka, "_", "-", ".", "/" — tanpa ".." dan tanpa "//".
const KEY_PATTERN = /^[a-z0-9][a-z0-9_\-./]{0,250}$/;

export function getStorageRoot(): string {
  const configured = process.env.STORAGE_DIR;
  if (configured && configured.trim()) return path.resolve(configured.trim());
  if (process.env.NODE_ENV === "production") {
    throw new Error("STORAGE_DIR belum diatur di environment production.");
  }
  return path.resolve(process.cwd(), "storage");
}

function isNotFound(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "ENOENT";
}

function resolveKey(key: string): string {
  if (!KEY_PATTERN.test(key) || key.includes("..") || key.includes("//")) {
    throw new Error("Storage key tidak valid.");
  }
  const root = getStorageRoot();
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) {
    throw new Error("Storage key keluar dari folder penyimpanan.");
  }
  return full;
}

/** Tulis atomik: tulis ke file sementara lalu rename. */
export async function storagePut(key: string, data: Buffer): Promise<void> {
  const full = resolveKey(key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  const tmp = `${full}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, full);
}

export async function storageGet(key: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(resolveKey(key));
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function storageDelete(key: string): Promise<void> {
  try {
    await fs.unlink(resolveKey(key));
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }
}

export interface StoredFileInfo {
  key: string;
  mtimeMs: number;
}

/** Daftar semua file di bawah sebuah prefix (untuk pembersih file yatim). */
export async function storageList(prefix: string): Promise<StoredFileInfo[]> {
  const root = getStorageRoot();
  const base = path.resolve(root, prefix);
  if (base !== root && !base.startsWith(root + path.sep)) throw new Error("Prefix tidak valid.");
  const out: StoredFileInfo[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      if (isNotFound(err)) return;
      throw err;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const stat = await fs.stat(full);
        out.push({ key: path.relative(root, full).split(path.sep).join("/"), mtimeMs: stat.mtimeMs });
      }
    }
  }

  await walk(base);
  return out;
}
