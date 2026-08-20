import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import PricingClient from "./PricingClient";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Pricing' });
  return { title: `${t('pageTitleTab')} - Prompt Gen` };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  const t = await getTranslations({ locale, namespace: 'Pricing' });

  const plans = await prisma.plan.findMany({
    where: { isActive: true, isPubliclyPurchasable: true },
    orderBy: { sortOrder: "asc" }
  });

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white sm:text-4xl">
          {t('pageTitle')}
        </h1>
        <p className="mt-4 text-xl text-zinc-500 dark:text-zinc-400">
          {t('pageDesc')}
        </p>
      </div>

      <PricingClient plans={plans as unknown as Parameters<typeof PricingClient>[0]["plans"]} locale={locale} />
    </div>
  );
}
