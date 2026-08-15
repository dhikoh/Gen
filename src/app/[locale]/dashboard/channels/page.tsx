import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import EditChannelClient from "./EditChannelClient";

export const metadata = {
  title: "Pengaturan Channel - Prompt Gen",
};

export default async function ChannelsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/");
  }

  const channel = await prisma.profileChannel.findFirst({
    where: { userId: session.user.id }
  });

  if (!channel) {
    return (
      <div className="p-8">
        Anda belum memiliki channel. Silakan hubungi dukungan pelanggan.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Pengaturan Channel</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Sesuaikan profil saluran Anda. Konteks ini akan digunakan AI untuk membuat prompt yang relevan dengan ciri khas Anda.
        </p>
      </div>

      <EditChannelClient channel={channel} />
    </div>
  );
}
