import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import PricingClient from "./PricingClient";

export const metadata = {
  title: "Pilih Paket - Prompt Gen",
};

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" }
  });

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white sm:text-4xl">
          Tingkatkan Produktivitas Anda
        </h1>
        <p className="mt-4 text-xl text-zinc-500 dark:text-zinc-400">
          Pilih paket langganan yang sesuai dengan kebutuhan konten kreator Anda.
        </p>
      </div>

      <PricingClient plans={plans} locale={locale} />
    </div>
  );
}
