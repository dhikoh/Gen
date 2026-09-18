import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import PrintableInvoiceClient from "./PrintableInvoiceClient";

export async function generateMetadata() {
  return { title: "Kuitansi Pembayaran - Prompt Gen" };
}

export default async function InvoiceReceiptPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/auth`);
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      },
      plan: {
        select: {
          name: true,
          code: true,
          maxChannels: true,
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  // Hanya pemilik invoice atau superadmin yang boleh melihat kuitansi
  if (invoice.userId !== session.user.id && session.user.role !== "SUPERADMIN") {
    notFound();
  }

  const serializedInvoice = {
    id: invoice.id,
    amount: invoice.amount,
    currency: invoice.currency,
    status: invoice.status,
    method: invoice.method,
    periodDays: invoice.periodDays || 30,
    createdAt: invoice.createdAt.toISOString(),
    reviewedAt: invoice.reviewedAt ? invoice.reviewedAt.toISOString() : null,
    user: invoice.user,
    plan: invoice.plan,
  };

  return <PrintableInvoiceClient invoice={serializedInvoice} locale={locale} />;
}
