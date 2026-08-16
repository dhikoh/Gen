"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return <Toaster position="top-right" toastOptions={{
    className: 'dark:bg-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-700',
    style: {
      borderRadius: '8px',
      background: 'var(--toast-bg, #fff)',
      color: 'var(--toast-color, #333)',
    }
  }} />;
}
