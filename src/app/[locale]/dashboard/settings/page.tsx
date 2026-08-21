import { getTranslations } from "next-intl/server";
import SettingsClient from "./SettingsClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  return { title: "Pengaturan" };
}

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold pg-text-heading">Pengaturan Akun</h1>
        <p className="pg-text-muted">Kelola profil dan keamanan akun Anda.</p>
      </div>
      <SettingsClient />
    </div>
  );
}
