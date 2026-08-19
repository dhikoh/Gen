import UserSupportClient from "@/components/support/UserSupportClient";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Support' });
  return { title: `${t('title')} - Prompt Gen` };
}

export default function UserSupportPage() {
  return (
    <div className="max-w-6xl mx-auto py-2">
      <UserSupportClient />
    </div>
  );
}
