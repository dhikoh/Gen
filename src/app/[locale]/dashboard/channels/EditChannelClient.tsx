"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ProductsClient from "./ProductsClient";

export default function EditChannelClient({ channel, isNew = false, onSuccess }: { channel: any, isNew?: boolean, onSuccess?: () => void }) {
  const router = useRouter();
  const t = useTranslations("Channels");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    channelName: channel?.channelName || "",
    niche: channel?.niche || "",
    description: channel?.description || "",
    visualAesthetic: channel?.visualAesthetic || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isNew ? "/api/channels" : `/api/channels/${channel.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert(isNew ? t('saveSuccessNew') : t('saveSuccessUpdate'));
        if (onSuccess) onSuccess();
      } else {
        alert(data.error || t('saveFail'));
      }
    } catch (err) {
      alert(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('channelName')}</label>
          <input 
            type="text"
            name="channelName"
            required
            value={formData.channelName}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('niche')}</label>
          <input 
            type="text"
            name="niche"
            placeholder={t('nichePlaceholder')}
            value={formData.niche}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('descLabel')}</label>
          <textarea 
            name="description"
            rows={3}
            placeholder={t('descPlaceholder')}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('visualLabel')}</label>
          <input 
            type="text"
            name="visualAesthetic"
            placeholder={t('visualPlaceholder')}
            value={formData.visualAesthetic}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
          >
            {loading ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </form>

      {!isNew && channel?.id && (
        <ProductsClient channelId={channel.id} />
      )}
    </div>
  );
}
