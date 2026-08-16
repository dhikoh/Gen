"use client";
import toast from "react-hot-toast";

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
    cta1: channel?.cta1 || "",
    cta2: channel?.cta2 || "",
    visualAesthetic: channel?.visualAesthetic || "",
    audioBGM: channel?.audioBGM ?? true,
    audioSFX: channel?.audioSFX ?? true,
    audioVO: channel?.audioVO ?? true,
    socialLinks: channel?.socialLinks?.url || "", // Store as string for easy editing
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isNew ? "/api/channels" : `/api/channels/${channel.id}`;
      const method = isNew ? "POST" : "PUT";
      
      let parsedSocial = {};
      if (formData.socialLinks) {
        parsedSocial = { url: formData.socialLinks };
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          socialLinks: parsedSocial
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(isNew ? t('saveSuccessNew') : t('saveSuccessUpdate'));
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        toast.error(data.error || t('saveFail'));
      }
    } catch (err) {
      toast.error(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 glass-panel">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('channelName')}</label>
          <input 
            type="text"
            name="channelName"
            required
            value={formData.channelName}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white neu-flat"
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
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white neu-flat"
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
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white neu-flat"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Call to Action 1</label>
            <input 
              type="text"
              name="cta1"
              value={formData.cta1}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white neu-flat"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Call to Action 2</label>
            <input 
              type="text"
              name="cta2"
              value={formData.cta2}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white neu-flat"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('visualLabel')}</label>
          <input 
            type="text"
            name="visualAesthetic"
            placeholder={t('visualPlaceholder')}
            value={formData.visualAesthetic}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white neu-flat"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Pengaturan Audio (Bawaan)</label>
          <div className="flex space-x-6 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="audioBGM" checked={formData.audioBGM} onChange={handleCheckboxChange} className="rounded text-blue-600" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Background Music (BGM)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="audioSFX" checked={formData.audioSFX} onChange={handleCheckboxChange} className="rounded text-blue-600" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sound Effects (SFX)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="audioVO" checked={formData.audioVO} onChange={handleCheckboxChange} className="rounded text-blue-600" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Voice Over (VO)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Social Media Links</label>
          <input 
            type="text"
            name="socialLinks"
            placeholder="Tiktok: @akun, Instagram: @akun"
            value={formData.socialLinks}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white neu-flat"
          />
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 neu-flat"
          >
            {loading ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </form>

      {!isNew && channel?.id && (
        <div className="mt-8">
          <ProductsClient channelId={channel.id} />
        </div>
      )}
    </div>
  );
}
