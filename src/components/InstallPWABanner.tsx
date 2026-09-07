"use client";
import { useTranslations } from "next-intl";

import { useState, useEffect } from "react";

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallPWABanner() {
  const t = useTranslations("InstallPWA");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user already dismissed it
    const hasDismissed = localStorage.getItem("pwa_install_dismissed");
    if (hasDismissed) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If app is installed successfully
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem("pwa_install_dismissed", "true");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
    } else {
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_install_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 pg-surface dark:pg-surface-dim border pg-border dark:pg-border shadow-2xl rounded-2xl p-4 flex items-start gap-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="p-2.5 rounded-xl shrink-0 text-white" style={{ background: "var(--pg-brand)", boxShadow: "0 2px 8px var(--pg-brand-glow)" }}>
        <DownloadIcon />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm pg-text-heading">
          Install Aplikasi Prompt Gen
        </h3>
        <p className="text-xs pg-text-sub mt-1 leading-relaxed">
          Install Prompt Gen ke layar utama HP / perangkat Anda untuk akses instan tanpa browser bar.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstallClick}
            className="text-xs font-semibold text-white px-3.5 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm"
            style={{ background: "var(--pg-brand)" }}
          >
            Install Sekarang
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs font-medium pg-text-sub hover:pg-text-heading px-3 py-1.5 rounded-lg transition-colors border pg-border"
          >
            Lain kali
          </button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="pg-text-sub hover:pg-text-sub dark:hover:pg-text-sub absolute top-3 right-3"
        aria-label={t("closeLabel")}
      >
        <XIcon />
      </button>
    </div>
  );
}
