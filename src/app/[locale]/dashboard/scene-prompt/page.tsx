import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ScenePromptStudioClient, { SerializedParsedOutput } from "./ScenePromptStudioClient";
import { getTranslations } from "next-intl/server";
import { hasFeature } from "@/lib/planFeatures";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ScenePromptStudio" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ScenePromptPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { draftId } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/login`);

  const [channels, dbUser, initialDraft, rawParsedOutputs] = await Promise.all([
    prisma.profileChannel.findMany({
      where: { userId: session.user.id, isLocked: false },
      orderBy: { lastUsedAt: "desc" },
      select: { id: true, channelName: true, niche: true, speechRate: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        currentPlan: { select: { features: true } },
      },
    }),
    draftId && typeof draftId === "string"
      ? prisma.draft.findUnique({
          where: { id: draftId, userId: session.user.id },
          select: { id: true, title: true, channelId: true, rawJson: true, parsedData: true, estimatedDurationSec: true, wordCount: true },
        })
      : Promise.resolve(null),
    prisma.parsedOutput.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, rawInput: true, parsedResult: true, createdAt: true },
    }),
  ]);

  const initialParsedOutputs: SerializedParsedOutput[] = rawParsedOutputs.map((item) => ({
    id: item.id,
    rawInput: item.rawInput,
    parsedResult: item.parsedResult,
    createdAt: item.createdAt.toISOString(),
  }));

  const isSuperadmin = dbUser?.role === "SUPERADMIN";
  const rawFeatures = (dbUser?.currentPlan?.features as Record<string, boolean>) ?? {};
  const planFeatures = {
    textToSpeechStudio: hasFeature(rawFeatures, "textToSpeechStudio", isSuperadmin),
  };

  return (
    <ScenePromptStudioClient
      channels={channels}
      locale={locale}
      planFeatures={planFeatures}
      initialDraft={initialDraft || undefined}
      initialParsedOutputs={initialParsedOutputs}
    />
  );
}
