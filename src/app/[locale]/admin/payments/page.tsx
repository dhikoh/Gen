import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminPaymentsClient from "./AdminPaymentsClient";

export const metadata = {
  title: "Persetujuan Tagihan - Admin",
};

export default async function AdminPaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/");
  }

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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Persetujuan Tagihan</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Verifikasi dan setujui pembayaran langganan manual.</p>
      </div>

      <AdminPaymentsClient invoices={pendingInvoices} />
    </div>
  );
}
