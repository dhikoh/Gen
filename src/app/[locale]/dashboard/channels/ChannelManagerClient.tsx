"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditChannelClient from "./EditChannelClient";
import { useTranslations } from "next-intl";

export default function ChannelManagerClient({ channels, maxChannels }: { channels: any[], maxChannels: number }) {
  const router = useRouter();
  const t = useTranslations("Channels");
  const [addingNew, setAddingNew] = useState(false);

  const canAddMore = channels.length < maxChannels;

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteChannel'))) return;
    
    try {
      const res = await fetch(`/api/channels/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert(t('deleteSuccess'));
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || t('deleteFail'));
      }
    } catch (err) {
      alert(t('networkError'));
    }
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

      <div className="space-y-6">
        {channels.map((channel, idx) => (
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
            
            <div className={`bg-white dark:bg-zinc-900 shadow-sm border ${channel.isLocked ? 'border-red-200 dark:border-red-900/30' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl p-6`}>
              <div className="flex justify-between items-start mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center">
                    {channel.channelName}
                    {idx === 0 && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">{t('primary')}</span>}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">{t('addedOn')} {new Date(channel.createdAt).toLocaleDateString('id-ID')}</p>
                </div>
                {channels.length > 1 && (
                  <button 
                    onClick={() => handleDelete(channel.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded"
                  >
                    {t('delete')}
                  </button>
                )}
              </div>
              
              <EditChannelClient channel={channel} isNew={false} onSuccess={() => router.refresh()} />
            </div>
          </div>
        ))}
        
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
