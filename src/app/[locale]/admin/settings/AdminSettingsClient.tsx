"use client";
import toast from "react-hot-toast";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface AppSettings {
  heroTitle: string | null;
  heroSubtitle: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankAccountName?: string | null;
}

export default function AdminSettingsClient({ settings }: { settings: AppSettings | null }) {
  const router = useRouter();
  const t = useTranslations("AdminSettings");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    heroTitle: settings?.heroTitle || "",
    heroSubtitle: settings?.heroSubtitle || "",
    bankName: settings?.bankName || "",
    bankAccountNo: settings?.bankAccountNo || "",
    bankAccountName: settings?.bankAccountName || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(t('updateSuccess'));
        router.refresh();
      } else {
        toast.error(data.error || t('updateFail'));
      }
    } catch (err) {
      toast.error(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 space-y-6 max-w-2xl border border-zinc-200 dark:border-zinc-800">
      
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t('landingContent')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('heroTitle')}</label>
            <input 
              type="text"
              name="heroTitle"
              required
              value={formData.heroTitle}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('heroSubtitle')}</label>
            <textarea 
              name="heroSubtitle"
              rows={3}
              required
              value={formData.heroSubtitle}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">{t('bankAccountTitle')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('bankName')}</label>
            <input 
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('bankAccountNo')}</label>
            <input 
              type="text"
              name="bankAccountNo"
              value={formData.bankAccountNo}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('bankAccountName')}</label>
            <input 
              type="text"
              name="bankAccountName"
              value={formData.bankAccountName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-zinc-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
        >
          {loading ? t('saving') : t('saveSettings')}
        </button>
      </div>
    </form>
  );
}
