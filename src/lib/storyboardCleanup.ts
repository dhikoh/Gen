import { prisma } from "@/lib/db";
import { storageDelete } from "@/lib/storage";

/** Hapus semua file gambar milik sebuah draft (dipanggil SEBELUM draft dihapus dari DB). */
export async function deleteDraftStoryboardFiles(draftId: string): Promise<void> {
  const panels = await prisma.storyboardPanel.findMany({
    where: { draftId },
    select: { storageKey: true, thumbKey: true },
  });
  await Promise.all(panels.flatMap((p) => [storageDelete(p.storageKey), storageDelete(p.thumbKey)]));
}
