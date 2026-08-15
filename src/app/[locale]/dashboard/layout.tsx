import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import { getTranslations } from "next-intl/server";

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/id/auth");
  }

  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Dashboard' });

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href={`/${locale}/dashboard`} className="font-bold text-lg text-zinc-900 dark:text-white">
            Prompt Gen
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Link 
            href={`/${locale}/dashboard`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t('overview')}
          </Link>
          <Link 
            href={`/${locale}/dashboard/generator`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
          >
            {t('generator')}
          </Link>
          <Link 
            href={`/${locale}/dashboard/drafts`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t('drafts')}
          </Link>
          <Link 
            href={`/${locale}/dashboard/channels`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t('channels')}
          </Link>
          <Link 
            href={`/${locale}/dashboard/billing`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t('billing')}
          </Link>
          <Link 
            href={`/${locale}/dashboard/affiliate`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t('affiliate')}
          </Link>
          {session.user.role === "SUPERADMIN" && (
            <Link 
              href={`/${locale}/admin`}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t('admin')}
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold">
              {session.user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {session.user.role}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto focus:outline-none">
        <div className="py-6 px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
