import GeneratorForm from "@/components/generator/GeneratorForm";

export const metadata = {
  title: "Generator Prompt - Prompt Gen",
};

export default function GeneratorPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Studio Generator</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Pilih tipe konten dan masukkan parameter. AI akan menyusun Master Prompt dan instruksi sistem untuk Anda.
        </p>
      </div>

      <GeneratorForm />
    </div>
  );
}
