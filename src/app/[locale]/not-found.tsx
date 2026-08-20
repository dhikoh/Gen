import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="text-8xl font-bold text-zinc-200 dark:text-zinc-800">
          404
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
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
