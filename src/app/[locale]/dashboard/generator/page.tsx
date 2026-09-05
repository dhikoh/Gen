import GeneratorForm from "@/components/generator/GeneratorForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { hasFeature } from "@/lib/planFeatures";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  return { title: `${t('studio')} - Prompt Gen` };
}

export default async function GeneratorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/auth`);

  const t = await getTranslations({ locale, namespace: 'Generator' });

  const channels = await prisma.profileChannel.findMany({
    where: { userId: session.user.id, isLocked: false },
    include: { contentArchetype: true },
    orderBy: { createdAt: "asc" }
  });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { currentPlan: true }
  });

  const isSuperadmin = session.user.role === "SUPERADMIN";
  const rawFeatures = (dbUser?.currentPlan?.features as Record<string, boolean> | null) || {};
  
  // Fix audit 5.1: gunakan hasFeature() dari planFeatures.ts, hapus duplikat closure lokal
  const planFeatures = {
    imagePromptStudio: hasFeature(rawFeatures, "imagePromptStudio", isSuperadmin),
    htmlBlogExport: hasFeature(rawFeatures, "htmlBlogExport", isSuperadmin),
    cameraMovementPro: hasFeature(rawFeatures, "cameraMovementPro", isSuperadmin), // PRO tier camera movement
  };

  const promptSettings = await prisma.promptSettings.findFirst();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold pg-text-heading">{t('pageTitle')}</h1>
        <p className="text-sm pg-text-muted mt-1">
          {t('pageDesc')}
        </p>
      </div>

      <GeneratorForm channels={channels} promptSettings={promptSettings} planFeatures={planFeatures} />
    </div>
  );
}
