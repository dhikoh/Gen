import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Atur Ulang Password - Prompt Gen",
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Prompt Gen</h1>
      </div>
      <Suspense fallback={<div className="text-center p-4">Memuat...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
