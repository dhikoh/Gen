import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./AdminSettingsClient";

export const metadata = {
  title: "Pengaturan Sistem - Admin",
};

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/");
  }

  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" }
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Pengaturan Sistem</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Atur konten Landing Page dan parameter global lainnya.</p>
      </div>

      <AdminSettingsClient settings={settings} />
    </div>
  );
}
