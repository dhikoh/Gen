import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="min-h-screen flex items-center justify-center pg-bg-page px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="text-8xl font-bold pg-text-muted">
          404
        </div>
        <h1 className="text-2xl font-bold pg-text-heading">
          {t("title")}
        </h1>
        <p className="pg-text-sub">
          {t("description")}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
