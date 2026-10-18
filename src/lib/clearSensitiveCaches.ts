/** Hapus semua Cache Storage (kecuali precache aset statis Workbox). Dipanggil saat logout. */
export async function clearSensitiveCaches(): Promise<void> {
  try {
    if (typeof caches === "undefined") return;
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => !n.startsWith("workbox-precache")).map((n) => caches.delete(n))
    );
  } catch {
    // abaikan
  }
}
