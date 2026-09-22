import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ScenePromptStudioClient from "./ScenePromptStudioClient";
import { getTranslations } from "next-intl/server";
import { hasFeature } from "@/lib/planFeatures";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps) {
  const t = await getTranslations({ locale: params.locale, namespace: "ScenePromptStudio" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ScenePromptPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${params.locale}/login`);

  const [channels, dbUser] = await Promise.all([
    prisma.profileChannel.findMany({
      where: { userId: session.user.id, isLocked: false },
      orderBy: { lastUsedAt: "desc" },
      select: { id: true, channelName: true, niche: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        currentPlan: { select: { features: true } },
      },
    }),
  ]);

  const isSuperadmin = dbUser?.role === "SUPERADMIN";
  const rawFeatures = (dbUser?.currentPlan?.features as Record<string, boolean>) ?? {};
  const planFeatures = {
    textToSpeechStudio: hasFeature(rawFeatures, "textToSpeechStudio", isSuperadmin),
  };

  return (
    <ScenePromptStudioClient
      channels={channels}
      locale={params.locale}
      planFeatures={planFeatures}
    />
  );
}
