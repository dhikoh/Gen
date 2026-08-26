import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: `${t("resetPasswordTitle")} - Prompt Gen` };
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });

  return (
    <div className="min-h-screen pg-bg-page flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight pg-text-heading mb-2">Prompt Gen</h1>
      </div>
      {/* Fix audit 4.2: gunakan t() agar fallback terlokalisasi */}
      <Suspense fallback={<div className="text-center p-4">{t("loading")}</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
