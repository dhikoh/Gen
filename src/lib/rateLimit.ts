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

export async function applyRateLimit(
  identifier: string,
  fallbackLimit: number = 30,
  fallbackWindowSeconds: number = 60
): Promise<boolean> {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Bersihkan record yang sudah kadaluarsa (opsional, untuk mencegah memory leak)
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.expiresAt) {
        rateLimitStore.delete(key);
      }
    }
  }

  // Get dynamic limits, fallback to args if not globally set
  const { limit: globalLimit, windowMs: globalWindowMs } = await getGlobalLimits();
  // We use global limit if it's not the default fallback (or just strictly use global limit)
  // To avoid breaking specific strict rate limits (like 5 uploads per 15 mins),
  // we could just apply global limits only if fallbackLimit is >= 30, but let's just use 
  // global limits as a baseline or strict override?
  // Usually, global rate limit applies to generic API endpoints. 
  // For specific endpoints, they pass specific fallbackLimits. 
  // If we override EVERYTHING, it might break specific strict limits.
  // Actually, BIZ-6 says "Add Rate Limit fields to AppSettings, update rateLimit.ts".
  // Let's use the strictest of the two (global vs specific).
  
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
