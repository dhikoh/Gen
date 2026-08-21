import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminPaymentsClient from "./AdminPaymentsClient";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AdminPayments' });
  return { title: t('pageTitleTab') };
}

export default async function AdminPaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/");
  }

  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AdminPayments' });

  const pendingInvoices = await prisma.invoice.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { name: true, email: true } },
      plan: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold pg-text-heading">{t('title')}</h1>
        <p className="pg-text-muted">{t('description')}</p>
      </div>

      <AdminPaymentsClient invoices={pendingInvoices} />
    </div>
  );
}
