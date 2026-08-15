// KETERBATASAN: Rate limiter ini bersifat in-memory dan per-instance. 
// Jika aplikasi di-deploy di lingkungan multi-instance (serverless/Vercel edge), 
// rate limit tidak akan konsisten lintas instance.
// Untuk produksi skala besar, sangat disarankan menggunakan Redis (misal: Upstash) atau tabel database.

const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();

export async function applyRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
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

  if (!record || now > record.expiresAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}
