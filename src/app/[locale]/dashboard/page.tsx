import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata = {
  title: "Dashboard - Prompt Gen",
};

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  // Fetch user data with their subscription and profile channel
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      currentPlan: true,
      channels: true,
    }
  });

  if (!user) return null;

  const currentChannel = user.channels[0];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
        Selamat Datang, {user.name}!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Status Langganan */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Status Langganan</h2>
          <div className="flex items-center space-x-2 mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.subscriptionStatus === "ACTIVE" 
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
            }`}>
              {user.subscriptionStatus}
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">
              {user.currentPlan?.name || "Belum Berlangganan"}
            </span>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
            Tingkatkan Paket &rarr;
          </button>
        </div>

        {/* Profil Channel Utama */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Channel Utama</h2>
          {currentChannel ? (
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                {currentChannel.channelName}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4">
                {currentChannel.description || "Belum ada deskripsi"}
              </p>
              <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Atur Channel &rarr;
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Belum ada channel.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Mulai Membuat Prompt</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Platform Prompt Gen siap membantu Anda menyusun prompt untuk berbagai kebutuhan pembuatan konten.
        </p>
        <Link href={`/${locale}/dashboard/generator`} className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">
          Buka Generator
        </Link>
      </div>
    </div>
  );
}
