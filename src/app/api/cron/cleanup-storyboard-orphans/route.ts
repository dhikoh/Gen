import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cronAuth";
import { storageDelete, storageList } from "@/lib/storage";

export const runtime = "nodejs";

const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000; // file yatim baru dihapus jika berumur > 24 jam
const TMP_MIN_AGE_MS = 60 * 60 * 1000; // file .tmp sisa upload gagal > 1 jam

// POST /api/cron/cleanup-storyboard-orphans[?dryRun=1]
export async function POST(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";

  const files = await storageList("storyboard");
  const rows = await prisma.storyboardPanel.findMany({ select: { storageKey: true, thumbKey: true } });
  const known = new Set<string>();
  for (const r of rows) {
    known.add(r.storageKey);
    known.add(r.thumbKey);
  }

  const now = Date.now();
  const toDelete = files.filter((f) => {
    const age = now - f.mtimeMs;
    if (f.key.endsWith(".tmp")) return age > TMP_MIN_AGE_MS;
    return !known.has(f.key) && age > ORPHAN_MIN_AGE_MS;
  });

  let deleted = 0;
  if (!dryRun) {
    for (const f of toDelete) {
      try {
        await storageDelete(f.key);
        deleted++;
      } catch (err) {
        console.error("[cron storyboard] gagal hapus", f.key, err);
      }
    }
  }

  return NextResponse.json({ success: true, dryRun, scanned: files.length, orphanCandidates: toDelete.length, deleted });
}
