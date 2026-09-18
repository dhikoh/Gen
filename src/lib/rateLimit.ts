/**
 * Rate Limiter — In-Memory Sliding Window (per-process)
 * =======================================================
 * Usage:
 *   const allowed = await applyRateLimit(key, limit, windowSec);
 *   if (!allowed) return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
 *
 * Parameters:
 *   @param key       - Unique identifier for the rate limit bucket.
 *                      Convention: `<action>_<userId>_<ip>` e.g. `generate_clxxx_127.0.0.1`
 *   @param limit     - Maximum number of requests allowed in the window (fallback if global limit is stricter).
 *   @param windowSec - Sliding window duration in seconds (fallback if global window is larger).
 *
 * Implementasi:
 *   - State disimpan di in-memory `Map` per Node.js process.
 *   - Global limit config dibaca dari `AppSettings` via Prisma (bukan state — hanya konfigurasi).
 *   - Limit aktual = Math.min(globalLimit, fallbackLimit) → selalu ambil yang lebih ketat.
 *   - Fails open (returns true) jika AppSettings throw, agar tidak memblokir user.
 *   - Probabilistic cleanup (1% chance) mencegah memory leak dari key yang expired.
 *
 * KETERBATASAN (lihat komentar baris 22-25):
 *   - Tidak persistent antar restart process.
 *   - Tidak konsisten di lingkungan multi-instance / serverless / Vercel edge.
 *   - Untuk produksi skala besar, gunakan Redis (Upstash) atau tabel DB dengan TTL.
 */
import { prisma } from "@/lib/db";

// KETERBATASAN: Rate limiter ini bersifat in-memory dan per-instance. 
// Jika aplikasi di-deploy di lingkungan multi-instance (serverless/Vercel edge), 
// rate limit tidak akan konsisten lintas instance.
// Untuk produksi skala besar, sangat disarankan menggunakan Redis (misal: Upstash) atau tabel database.

const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();

let cachedLimit = 30;
let cachedWindowMs = 60000;
let lastCacheUpdate = 0;

async function getGlobalLimits() {
  const now = Date.now();
  if (now - lastCacheUpdate > 5 * 60 * 1000) { // Update cache every 5 minutes
    try {
      const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
      if (settings) {
        cachedLimit = settings.rateLimitRequests;
        cachedWindowMs = settings.rateLimitWindowMs;
      }
      lastCacheUpdate = now;
    } catch (e) {
      console.error("Failed to fetch rate limits from DB", e);
    }
  }
  return { limit: cachedLimit, windowMs: cachedWindowMs };
}

/**
 * Helper terstandarisasi untuk mengekstrak IP client secara aman.
 * Hanya mempercayai X-Forwarded-For jika TRUSTED_PROXY === "true" di environment.
 */
interface HeaderGetter {
  get(name: string): string | null;
}

function hasGetMethod(h: unknown): h is HeaderGetter {
  return typeof h === "object" && h !== null && typeof (h as Record<string, unknown>).get === "function";
}

export function getClientIp(req: unknown): string {
  let headerValue: string | null = null;

  if (req && typeof req === "object") {
    const r = req as Record<string, unknown>;
    if (r.headers && typeof r.headers === "object") {
      if (hasGetMethod(r.headers)) {
        headerValue = r.headers.get("x-forwarded-for");
      } else {
        const h = r.headers as Record<string, unknown>;
        const forwarded = h["x-forwarded-for"];
        const realIp = h["x-real-ip"];
        headerValue = typeof forwarded === "string"
          ? forwarded
          : typeof realIp === "string"
            ? realIp
            : null;
      }
    }
  }

  if (process.env.TRUSTED_PROXY === "true" && headerValue) {
    const firstIp = headerValue.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  if (req && typeof req === "object") {
    const r = req as Record<string, unknown>;
    if (r.socket && typeof r.socket === "object") {
      const s = r.socket as Record<string, unknown>;
      if (typeof s.remoteAddress === "string") {
        return s.remoteAddress;
      }
    }
  }

  return "127.0.0.1";
}

export async function applyRateLimit(
  identifier: string,
  fallbackLimit: number = 30,
  fallbackWindowSeconds: number = 60
): Promise<boolean> {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Pembersihan probabilistik (1% chance) untuk mencegah memory leak
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.expiresAt) {
        rateLimitStore.delete(key);
      }
    }
  }

  // Ambil limit dinamis dari database (singleton AppSettings)
  const { limit: globalLimit, windowMs: globalWindowMs } = await getGlobalLimits();

  // Evaluasi limit efektif: terapkan batas terketat antara konfigurasi global dan spesifik endpoint
  const actualLimit = Math.min(globalLimit, fallbackLimit);
  const actualWindowMs = Math.max(globalWindowMs, fallbackWindowSeconds * 1000);

  if (!record || now > record.expiresAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      expiresAt: now + actualWindowMs,
    });
    return true;
  }

  if (record.count >= actualLimit) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Terapkan dua bucket paralel (P0-5):
 * 1. Bucket per-IP (mencegah penyerang merotasi username/identifier)
 * 2. Bucket per-identifier (mencegah penyerang merotasi IP terhadap target yang sama)
 * Tolak request jika salah satu bucket melampaui limit.
 */
export async function applyDualRateLimit(
  action: string,
  ip: string,
  identifierKey?: string | null,
  limit: number = 5,
  windowSec: number = 60
): Promise<boolean> {
  // 1. Cek bucket per-IP
  const ipAllowed = await applyRateLimit(`${action}_ip_${ip}`, limit, windowSec);
  if (!ipAllowed) {
    return false;
  }

  // 2. Cek bucket per-identifier (bila ada)
  if (identifierKey && identifierKey.trim()) {
    const idAllowed = await applyRateLimit(
      `${action}_id_${identifierKey.trim().toLowerCase()}`,
      limit,
      windowSec
    );
    if (!idAllowed) {
      return false;
    }
  }

  return true;
}
