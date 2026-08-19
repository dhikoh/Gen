import { requireRole } from "@/lib/authHelpers";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import NotificationBell from "@/components/notifications/NotificationBell";

export default async function AdminLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole("SUPERADMIN", locale);

  const t = await getTranslations({ locale, namespace: 'Admin' });

  const pendingRegistrationsCount = await prisma.user.count({
    where: { registrationStatus: "PENDING_APPROVAL" }
  });

  const openTicketsCount = await prisma.supportTicket.count({
    where: { status: "OPEN" }
  });

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col text-white">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Link href={`/${locale}/admin`} className="font-bold text-lg text-purple-400">
            Admin Gen
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="pt-2 pb-2">
            <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {t('systemManagement')}
            </p>
          </div>
          <Link 
            href={`/${locale}/admin`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            {t('overview')}
          </Link>
          <Link 
            href={`/${locale}/admin/users`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            {t('users')}
          </Link>
          <Link 
            href={`/${locale}/admin/registrations`}
            className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <span>{t('registrations')}</span>
            {pendingRegistrationsCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-zinc-950 rounded-full">
                {pendingRegistrationsCount}
              </span>
            )}
          </Link>
          <Link 
            href={`/${locale}/admin/payments`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            {t('paymentApproval')}
          </Link>
          <Link 
            href={`/${locale}/admin/support`}
            className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <span>{t('support')}</span>
            {openTicketsCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-500 text-white rounded-full">
                {openTicketsCount}
              </span>
            )}
          </Link>
          <Link 
            href={`/${locale}/admin/plans`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            {t('subscriptionPlans')}
          </Link>
          <Link 
            href={`/${locale}/admin/announcements`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-purple-300 hover:bg-zinc-800 hover:text-white"
          >
            Broadcast Pengumuman
          </Link>
          <Link 
            href={`/${locale}/admin/notifications`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Notifikasi System
          </Link>

          <Link 
            href={`/${locale}/admin/settings`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            {t('systemSettings')}
          </Link>
          <Link 
            href={`/${locale}/admin/panduan`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            {t('guide')}
          </Link>
        </nav>
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-900 flex items-center justify-center text-purple-300 font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-purple-400 truncate">
                {session.user.role}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto focus:outline-none flex flex-col">
        <header className="h-16 px-8 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur sticky top-0 z-40">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Prompt Gen Admin Portal
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>
        <div className="py-6 px-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
