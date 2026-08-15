import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { DraftType } from "@prisma/client";

export const metadata = {
  title: "Riwayat Prompt - Prompt Gen",
};

export default async function DraftsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  // Fetch drafts history for the current user
  const drafts = await prisma.draft.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      channel: true,
    }
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Riwayat Prompt</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Lihat semua prompt yang pernah Anda hasilkan menggunakan AI.
          </p>
        </div>
        <Link 
          href={`/${locale}/dashboard/generator`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
        >
          + Buat Baru
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Belum ada riwayat prompt</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mb-6">
            Anda belum pernah membuat prompt apapun. Coba mulai hasilkan satu melalui Studio Generator.
          </p>
          <Link 
            href={`/${locale}/dashboard/generator`}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
          >
            Mulai Generate Sekarang
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {drafts.map((draft) => (
            <div key={draft.id} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    draft.type === DraftType.VIDEO
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}>
                    {draft.type}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(draft.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-2 mb-2 leading-snug">
                  {draft.title || "Tanpa Judul"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Channel: <span className="font-medium text-zinc-700 dark:text-zinc-300">{draft.channel?.channelName || "-"}</span>
                </p>
              </div>
              <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center text-xs text-zinc-500">
                <div className="flex space-x-3">
                  {draft.estimatedDurationSec && (
                    <span>⏳ {draft.estimatedDurationSec} dtk</span>
                  )}
                  {draft.wordCount && (
                    <span>📝 {draft.wordCount} kata</span>
                  )}
                </div>
                <Link 
                  href={`/${locale}/dashboard/drafts/${draft.id}`}
                  className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Buka &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
