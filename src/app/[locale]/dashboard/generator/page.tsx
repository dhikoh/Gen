import GeneratorForm from "@/components/generator/GeneratorForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { KNOWN_PLAN_FEATURES } from "@/lib/planFeatures";
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
    orderBy: { createdAt: "asc" }
  });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { currentPlan: true }
  });

  const isSuperadmin = session.user.role === "SUPERADMIN";
  const rawFeatures = (dbUser?.currentPlan?.features as Record<string, boolean> | null) || {};
  
  const getFeatureValue = (key: string) => {
    if (isSuperadmin) return true;
    if (typeof rawFeatures[key] === "boolean") return rawFeatures[key];
    const def = KNOWN_PLAN_FEATURES.find(f => f.key === key)?.defaultValue;
    return def === true;
  };

  const planFeatures = {
    imagePromptStudio: getFeatureValue("imagePromptStudio"),
    htmlBlogExport: getFeatureValue("htmlBlogExport"),
    cameraMovementPro: getFeatureValue("cameraMovementPro"), // PRO tier camera movement
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
