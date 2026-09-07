import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ResearchClient from "./ResearchClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: `${t("research") || "Riset Tren & Keyword"} - Prompt Gen` };
}

export default async function ResearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/auth`);

  const channels = await prisma.profileChannel.findMany({
    where: { userId: session.user.id, isLocked: false },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      channelName: true,
      niche: true,
      description: true,
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ResearchClient channels={channels} locale={locale} />
    </div>
  );
}
