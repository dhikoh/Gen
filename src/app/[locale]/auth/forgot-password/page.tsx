import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Lupa Password - Prompt Gen",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen pg-bg-page flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight pg-text-heading mb-2">Prompt Gen</h1>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
