import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import RemotionStudioStandaloneClient from "@/components/remotion/RemotionStudioStandaloneClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "StandaloneRemotion" });
  return {
    title: `${t("title")} - Prompt Gen`,
    description: t("subtitle"),
  };
}

export default async function RemotionStudioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/${locale}/auth`);

  return (
    <div className="max-w-7xl mx-auto py-2">
      <RemotionStudioStandaloneClient />
    </div>
  );
}
