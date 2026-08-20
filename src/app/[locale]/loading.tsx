export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
