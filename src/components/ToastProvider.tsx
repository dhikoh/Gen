"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return <Toaster position="top-right" toastOptions={{
    style: {
      borderRadius: '10px',
      background: 'var(--pg-surface)',
      color: 'var(--pg-text)',
      border: '1px solid var(--pg-shadow-dark)',
      boxShadow: 'var(--pg-neu-sm)',
    }
  }} />;
}
