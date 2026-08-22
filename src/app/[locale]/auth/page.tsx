import AuthForm from "@/components/auth/AuthForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import InstallPWABanner from "@/components/InstallPWABanner";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return {
    title: t("authPageTitle"),
    description: t("authPageDesc"),
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

  const t = await getTranslations({ locale, namespace: "Auth" });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "var(--pg-bg)" }}
    >
      {/* ── Brand Hero ────────────────────────── */}
      <div className="mb-8 text-center pg-fade-in">
        {/* Icon shield / AI wand */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white mx-auto mb-4"
          style={{
            background: "linear-gradient(135deg, var(--pg-brand) 0%, #c94d00 100%)",
            boxShadow: "0 8px 24px var(--pg-brand-glow), 4px 4px 12px var(--pg-shadow-dark), -4px -4px 12px var(--pg-shadow-light)",
          }}
        >
          ✨
        </div>
        <h1
          className="text-3xl font-bold tracking-tight mb-1"
          style={{ color: "var(--pg-text)" }}
        >
          Prompt Gen
        </h1>
        <p className="text-sm" style={{ color: "var(--pg-text-sub)" }}>
          {t("authSubtitle")}
        </p>
      </div>

      {/* ── Auth Card ─────────────────────────── */}
      <div
        className="w-full max-w-md pg-slide-up"
        style={{
          background: "var(--pg-card)",
          borderRadius: "var(--pg-radius-lg)",
          boxShadow: "var(--pg-neu-out)",
          padding: "2rem",
        }}
      >
        <Suspense
          fallback={
            <div
              className="flex items-center justify-center py-12 gap-3"
              style={{ color: "var(--pg-text-sub)" }}
            >
              <span className="pg-spin text-2xl">✨</span>
              <span className="text-sm font-medium">{t("loading")}</span>
            </div>
          }
        >
          <AuthForm />
        </Suspense>
      </div>

      {/* ── Footer ────────────────────────────── */}
      <p className="mt-8 text-xs text-center" style={{ color: "var(--pg-text-muted)" }}>
        © {new Date().getFullYear()} Prompt Gen. All rights reserved.
      </p>
      
      <InstallPWABanner />
    </div>
  );
}
