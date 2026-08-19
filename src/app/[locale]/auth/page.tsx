import AuthForm from "@/components/auth/AuthForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return {
    title: t('authPageTitle'),
    description: t('authPageDesc'),
  };
}

export default async function AuthPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (session) {
    if (session.user.role === "SUPERADMIN") {
      redirect(`/${locale}/admin`);
    } else {
      redirect(`/${locale}/dashboard`);
    }
  }

  const t = await getTranslations({ locale, namespace: 'Auth' });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Prompt Gen</h1>
        <p className="text-zinc-500 dark:text-zinc-400">{t('authSubtitle')}</p>
      </div>
      <Suspense fallback={<div className="text-zinc-500">{t('loading')}</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
