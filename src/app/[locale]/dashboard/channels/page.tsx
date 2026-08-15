import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ChannelManagerClient from "./ChannelManagerClient";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  return { title: `${t('channels')} - Prompt Gen` };
}

export default async function ChannelsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const t = await getTranslations({ locale, namespace: 'Channels' });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { currentPlan: true }
  });

  const maxChannels = user?.currentPlan?.maxChannels || 1;

  const channels = await prisma.profileChannel.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {t('description')}
        </p>
      </div>

      <ChannelManagerClient channels={channels} maxChannels={maxChannels} />
    </div>
  );
}
