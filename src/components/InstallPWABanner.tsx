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

export default function InstallPWABanner() {
  const t = useTranslations("InstallPWA");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
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
      setDeferredPrompt(e);
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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 pg-surface dark:pg-surface-dim border pg-border dark:pg-border shadow-xl rounded-xl p-4 flex items-start gap-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg shrink-0">
        <DownloadIcon />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold pg-text-sub dark:text-white text-sm">
          Install Aplikasi
        </h3>
        <p className="text-xs pg-text-sub dark:pg-text-sub mt-1">
          Install Prompt Gen ke perangkat Anda untuk akses lebih cepat dan pengalaman terbaik.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstallClick}
            className="text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs font-medium pg-text-sub dark:pg-text-sub pg-surface-dim hover:pg-surface-dim dark:pg-surface-dim dark:hover:pg-surface-dim px-3 py-1.5 rounded-md transition-colors"
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
