import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import AdminNotificationsClient from "./AdminNotificationsClient";

export default async function AdminNotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const session = await getServerSession(authOptions);
  const { locale } = await params;
  
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  return <AdminNotificationsClient />;
}
