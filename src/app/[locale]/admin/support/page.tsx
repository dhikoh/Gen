import AdminSupportClient from "@/components/support/AdminSupportClient";
import { requireRole } from "@/lib/authHelpers";

export const metadata = {
  title: "Tiket Support - Admin Prompt Gen",
};

export default async function AdminSupportPage() {
  await requireRole(["SUPERADMIN"]);

  return (
    <div className="max-w-6xl mx-auto py-2">
      <AdminSupportClient />
    </div>
  );
}
