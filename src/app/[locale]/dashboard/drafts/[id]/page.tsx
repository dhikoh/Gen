import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata = {
  title: "Detail Prompt - Prompt Gen",
};

export default async function DraftDetailPage({ 
  params 
}: { 
  params: Promise<{ locale: string; id: string }> 
}) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const draft = await prisma.draft.findUnique({
    where: { id },
    include: {
      channel: true,
    }
  });

  if (!draft || draft.userId !== session.user.id) {
    notFound();
  }

  const parsedData = draft.parsedData as any;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/${locale}/dashboard/drafts`} className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block">
          &larr; Kembali ke Riwayat
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{draft.title}</h1>
            <div className="flex items-center space-x-3 text-sm text-zinc-500 dark:text-zinc-400">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                draft.type === "VIDEO"
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              }`}>
                {draft.type}
              </span>
              <span>•</span>
              <span>{new Date(draft.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span>Channel: {draft.channel?.channelName || "-"}</span>
            </div>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 shadow-sm transition-colors">
            Salin Raw JSON
          </button>
        </div>
      </div>

      {/* Output Visualisasi */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">Master Prompt</h2>
          <p className="text-zinc-900 dark:text-zinc-200 text-lg leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
            {parsedData?.master_prompt || "Tidak ada Master Prompt"}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">System Instruction</h2>
          <div className="bg-zinc-900 dark:bg-black text-green-400 font-mono text-sm p-4 rounded-lg overflow-x-auto">
            {parsedData?.system_instruction || "Tidak ada System Instruction"}
          </div>
        </div>

        {parsedData?.segments && parsedData.segments.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Segments (Scenes)</h2>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {parsedData.segments.map((segment: any, idx: number) => (
                <div key={idx} className="p-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-bold">
                      {segment.order || idx + 1}
                    </span>
                    {segment.duration_estimation && (
                      <span className="text-xs text-zinc-500 font-medium">
                        Durasi: {segment.duration_estimation} detik
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {segment.visual && (
                      <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded border border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs font-bold text-zinc-500 mb-1">Visual</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200">{segment.visual}</p>
                      </div>
                    )}
                    {segment.audio && (
                      <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded border border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs font-bold text-zinc-500 mb-1">Audio</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200">{segment.audio}</p>
                      </div>
                    )}
                  </div>
                  {segment.caption && (
                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded border border-yellow-100 dark:border-yellow-900/30">
                      <p className="text-xs font-bold text-yellow-800 dark:text-yellow-600 mb-1">Caption / Teks</p>
                      <p className="text-sm text-yellow-900 dark:text-yellow-500 italic">"{segment.caption}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
