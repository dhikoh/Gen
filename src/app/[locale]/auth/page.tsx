import AuthForm from "@/components/auth/AuthForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Autentikasi - Prompt Gen",
  description: "Masuk atau daftar ke aplikasi Prompt Gen.",
};

export default async function AuthPage({ params }: { params: Promise<{ locale: string }> }) {
  const session = await getServerSession(authOptions);
  if (session) {
    const { locale } = await params;
    if (session.user.role === "SUPERADMIN") {
      redirect(`/${locale}/admin`);
    } else {
      redirect(`/${locale}/dashboard`);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Prompt Gen</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Silakan masuk atau daftar untuk melanjutkan</p>
      </div>
      <AuthForm />
    </div>
  );
}
