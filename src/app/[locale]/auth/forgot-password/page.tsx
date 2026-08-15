import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Lupa Password - Prompt Gen",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Prompt Gen</h1>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
