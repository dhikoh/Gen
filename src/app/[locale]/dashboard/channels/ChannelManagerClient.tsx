"use client";
import toast from "react-hot-toast";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditChannelClient from "./EditChannelClient";
import { useTranslations } from "next-intl";

interface ProfileChannelDto {
  id: string;
  channelName: string;
  targetPlatform?: string | null;
  platform?: string | null;
  niche: string | null;
  socialLinks?: unknown;
  isLocked: boolean;
  createdAt: Date | string;
  usageCount?: number;
}

export default function ChannelManagerClient({ channels, maxChannels }: { channels: ProfileChannelDto[], maxChannels: number }) {
  const router = useRouter();
  const t = useTranslations("Channels");
  const [addingNew, setAddingNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(channels[0]?.id || null);

  const canAddMore = channels.length < maxChannels;

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteChannel'))) return;
    
    try {
      const res = await fetch(`/api/channels/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t('deleteSuccess'));
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || t('deleteFail'));
      }
    } catch (err) {
      toast.error(t('networkError'));
    }
  };

  const renderSocialBadges = (socialLinks: Record<string, string> | unknown) => {
    if (!socialLinks) return null;
    let links: Record<string, string> = {};
    if (typeof socialLinks === "object" && socialLinks !== null && !Array.isArray(socialLinks)) {
      links = socialLinks as Record<string, string>;
    } else if (Array.isArray(socialLinks)) {
      links = {
        website: socialLinks[0] || "",
        tiktok: socialLinks[1] || "",
        instagram: socialLinks[2] || "",
        facebook: socialLinks[3] || "",
        youtube: socialLinks[4] || "",
      };
    }

    const items = [
      { key: "website", icon: "🌐", url: links.website },
      { key: "tiktok", icon: "🎵", url: links.tiktok },
      { key: "instagram", icon: "📸", url: links.instagram },
      { key: "facebook", icon: "📘", url: links.facebook },
      { key: "youtube", icon: "▶️", url: links.youtube },
    ].filter((item) => Boolean(item.url && item.url.trim()));

    if (items.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((item) => (
          <a
            key={item.key}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            <span className="mr-1">{item.icon}</span>
            <span className="capitalize">{item.key}</span>
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t('listTitle')} ({channels.length}/{maxChannels})</h2>
          <p className="text-sm text-zinc-500">{t('quotaInfo')}</p>
        </div>
        {!addingNew && canAddMore && (
          <button 
            onClick={() => setAddingNew(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            {t('addChannel')}
          </button>
        )}
      </div>

      {addingNew && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-blue-900 dark:text-blue-100">{t('createNew')}</h3>
            <button onClick={() => setAddingNew(false)} className="text-sm text-zinc-500 hover:text-zinc-700">{t('cancel')}</button>
          </div>
          <EditChannelClient 
            channel={null} 
            isNew={true} 
            onSuccess={() => { setAddingNew(false); router.refresh(); }} 
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {channels.map((channel, idx) => {
          const isExpanded = expandedId === channel.id;
          return (
            <div key={channel.id} className="relative">
              {channel.isLocked && (
                <div className="absolute inset-0 z-10 bg-zinc-100/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-lg text-center max-w-sm">
                    <span className="text-2xl mb-2 block">🔒</span>
                    <h4 className="font-bold text-zinc-900 dark:text-white">{t('channelLocked')}</h4>
                    <p className="text-sm text-zinc-500 mt-1">{t('lockedDesc')}</p>
                  </div>
                </div>
              )}
              
              <div className={`glass-panel shadow-lg border ${channel.isLocked ? 'border-red-200 dark:border-red-900/30' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl p-6`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center">
                        {channel.channelName}
                      </h3>
                      {idx === 0 && <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">{t('primary')}</span>}
                      {channel.niche && (
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium rounded-full">
                          {channel.niche}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {t('addedOn')} {new Date(channel.createdAt).toLocaleDateString('id-ID')} • Penggunaan: {channel.usageCount || 0}x draft
                    </p>
                    {renderSocialBadges(channel.socialLinks)}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : channel.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
                    >
                      {isExpanded ? "Sembunyikan Pengaturan ▲" : "Edit Channel & Produk ▼"}
                    </button>

                    {channels.length > 1 && (
                      <button 
                        onClick={() => handleDelete(channel.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg"
                      >
                        {t('delete')}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-2">
                    <EditChannelClient channel={channel} isNew={false} onSuccess={() => router.refresh()} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {channels.length === 0 && !addingNew && (
          <div className="text-center p-8 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
            <p className="text-zinc-500 mb-4">{t('noChannel')}</p>
            <button 
              onClick={() => setAddingNew(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
            >
              {t('createFirst')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
