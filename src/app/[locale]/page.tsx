import { prisma } from "@/lib/db";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { getTranslations } from "next-intl/server";
import { formatWaLink } from "@/lib/csContact";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Landing' });
  
  return {
    title: `${t('heroTitle')} - SaaS Platform`,
    description: t('heroSubtitle'),
  };
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  const tNav = await getTranslations({ locale, namespace: 'Navigation' });
  const tLanding = await getTranslations({ locale, namespace: 'Landing' });

  // Fetch settings and plans concurrently
  const [settings, plans] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: "singleton" } }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
  ]);

  const heroTitle = settings?.heroTitle || tLanding("heroTitle");
  const heroSubtitle = settings?.heroSubtitle || tLanding("heroSubtitle");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-blue-200 dark:selection:bg-blue-900/50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-zinc-900 dark:text-white">Prompt Gen</span>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <Link 
                  href={`/${locale}/dashboard`} 
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {tNav("dashboard")} &rarr;
                </Link>
              ) : (
                <>
                  <Link href={`/${locale}/auth`} className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    {tNav("login")}
                  </Link>
                  <Link href={`/${locale}/auth`} className="text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
                    {tNav("register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-900/10 -skew-y-3 transform origin-top-left -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-zinc-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight">
            {heroTitle}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href={session ? `/${locale}/dashboard` : `/${locale}/auth`}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-blue-600 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 focus:ring-4 focus:ring-blue-500/30 transition-all active:scale-95"
            >
              {tLanding("cta")}
            </Link>
            <a 
              href="#pricing"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
            >
              {tLanding("viewPricing")}
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-blue-600 tracking-wide uppercase">{tLanding("featuresTitle")}</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {tLanding("featuresSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{tLanding("feature1Title")}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                {tLanding("feature1Desc")}
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 text-left">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{tLanding("feature2Title")}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                {tLanding("feature2Desc")}
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 text-left">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{tLanding("feature3Title")}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                {tLanding("feature3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-zinc-50 dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-blue-600 tracking-wide uppercase">{tLanding("pricingTitle")}</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {tLanding("pricingSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white dark:bg-zinc-950 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group">
                {plan.code === "PRO" && (
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-700"></div>
                )}
                <div className="p-8 flex-1">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                      Rp {plan.priceMonthly.toLocaleString('id-ID')}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 ml-1 font-medium">{tLanding("monthSuffix")}</span>
                  </div>
                  
                  <ul className="space-y-4 mb-8 text-sm text-zinc-600 dark:text-zinc-300">
                    <li className="flex items-start">
                      <svg className="flex-shrink-0 h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-3 font-medium">{tLanding("pricingManage", { max: plan.maxChannels })}</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="flex-shrink-0 h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-3 font-medium">{tLanding("pricingAI")}</span>
                    </li>
                    {(plan.features as any)?.imagePromptStudio && (
                      <li className="flex items-start">
                        <svg className="flex-shrink-0 h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-3 font-medium">{tLanding("pricingImage")}</span>
                      </li>
                    )}
                  </ul>
                </div>
                <div className="p-8 pt-0 mt-auto">
                  <Link
                    href={`/${locale}/auth`}
                    className={`block w-full py-3.5 px-4 font-bold text-center rounded-xl transition-all ${
                      plan.code === "PRO"
                        ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-lg shadow-zinc-900/20"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white"
                    }`}
                  >
                    {tLanding("subscribe")}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Explicit CS Contact Section on Landing Page */}
          {settings?.csWidgetEnabled !== false && (settings?.csWhatsappNumber || settings?.csEmail) && (
            <div className="mt-16 max-w-4xl mx-auto bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/20 rounded-3xl p-8 backdrop-blur-md text-center shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-2">
                {tLanding("csSectionTitle")}
              </h3>
              <p className="text-zinc-300 text-sm max-w-xl mx-auto mb-6">
                {tLanding("csSectionDesc")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {settings?.csWhatsappNumber && (
                  <a
                    href={formatWaLink(settings.csWhatsappNumber, tLanding("waDefaultMsg")) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-full shadow-lg shadow-emerald-600/30 transition-all active:scale-95 text-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                    <span>{tLanding("csButtonText")}</span>
                  </a>
                )}
                {settings?.csEmail && (
                  <a
                    href={`mailto:${settings.csEmail}`}
                    className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium px-6 py-3 rounded-full border border-zinc-700 transition-all text-sm"
                  >
                    <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{settings.csEmail}</span>
                  </a>
                )}
              </div>
              {settings?.csOperatingHours && (
                <p className="mt-4 text-xs text-zinc-400">
                  {tLanding("csOperatingHoursPrefix")} {settings.csOperatingHours}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-950 py-12 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-zinc-900 font-bold text-[10px]">PG</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white">Prompt Gen</span>
          </div>

          {settings?.csWhatsappNumber && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <span>CS WA:</span>
              <a
                href={formatWaLink(settings.csWhatsappNumber) || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                +{settings.csWhatsappNumber}
              </a>
            </div>
          )}

          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {tLanding("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
