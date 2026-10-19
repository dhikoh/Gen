"use client";
import toast from "react-hot-toast";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditChannelClient from "./EditChannelClient";
import ImportChannelModal from "./ImportChannelModal";
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
 contentArchetypeId?: string | null;
 contentArchetype?: {
  id: string;
  name: string;
  narrationMode: string;
 } | null;
}

export default function ChannelManagerClient({ channels, maxChannels }: { channels: ProfileChannelDto[], maxChannels: number }) {
 const router = useRouter();
 const t = useTranslations("Channels");
 const [addingNew, setAddingNew] = useState(false);
 const [isImportModalOpen, setIsImportModalOpen] = useState(false);
 const [exportingId, setExportingId] = useState<string | null>(null);
 const [expandedId, setExpandedId] = useState<string | null>(channels[0]?.id || null);

 const canAddMore = channels.length < maxChannels;

 const handleExport = async (id: string, name: string) => {
   setExportingId(id);
   try {
     const res = await fetch(`/api/channels/${id}/export`);
     if (!res.ok) {
       const err = await res.json().catch(() => ({}));
       throw new Error(err.error || t("exportError"));
     }
     const blob = await res.blob();
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
     a.download = `${safeName}_channel_bundle.json`;
     document.body.appendChild(a);
     a.click();
     window.URL.revokeObjectURL(url);
     document.body.removeChild(a);
     toast.success(t("exportSuccess"));
   } catch (err) {
     const msg = err instanceof Error ? err.message : String(err);
     toast.error(msg);
   } finally {
     setExportingId(null);
   }
 };

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
 } catch {
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
 className="inline-flex items-center px-2 py-0.5 rounded text-xs pg-surface-dim pg-text-sub hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
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
 <h2 className="text-lg font-semibold pg-text-heading">{t('listTitle')} ({channels.length}/{maxChannels})</h2>
 <p className="text-sm pg-text-muted">{t('quotaInfo')}</p>
 </div>
 <div className="flex items-center gap-2">
 <button
   type="button"
   onClick={() => setIsImportModalOpen(true)}
   className="min-h-[40px] px-3.5 py-2 text-sm font-semibold rounded-lg pg-surface-dim pg-text-sub hover:pg-surface border pg-border transition-colors flex items-center gap-1.5 shadow-sm"
   title={t("importChannelJson")}
 >
   <span>📥</span>
   <span>{t("importChannelJson")}</span>
 </button>
 {!addingNew && canAddMore && (
 <button 
 onClick={() => setAddingNew(true)}
 className="pg-btn-primary min-h-[40px] px-4 py-2 text-sm font-semibold rounded-lg shadow-sm"
 >
 {t('addChannel')}
 </button>
 )}
 </div>
 </div>

 {addingNew && (
 <div className="pg-surface border pg-border p-6 rounded-2xl shadow-sm">
 <div className="flex justify-between items-center mb-4">
 <h3 className="text-base font-bold pg-text-heading">{t('createNew')}</h3>
 <button onClick={() => setAddingNew(false)} className="text-sm pg-text-muted hover:pg-text-sub">{t('cancel')}</button>
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
 <div className="absolute inset-0 z-10 pg-surface-dim/60 /60 backdrop-blur-sm rounded-xl flex items-center justify-center">
 <div className="pg-surface p-4 rounded-lg shadow-lg text-center max-w-sm">
 <span className="text-2xl mb-2 block">🔒</span>
 <h4 className="font-bold pg-text-heading">{t('channelLocked')}</h4>
 <p className="text-sm pg-text-muted mt-1">{t('lockedDesc')}</p>
 </div>
 </div>
 )}
 
 <div className={`glass-panel shadow-lg border ${channel.isLocked ? 'border-red-200 dark:border-red-900/30' : 'pg-border'} rounded-xl p-6`}>
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b pg-border">
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-lg font-bold pg-text-heading flex items-center">
 {channel.channelName}
 </h3>
 {idx === 0 && <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">{t('primary')}</span>}
 {channel.niche && (
 <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium rounded-full">
 {channel.niche}
 </span>
 )}
 {channel.contentArchetype && (
 <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-medium rounded-full">
 {channel.contentArchetype.name}
 </span>
 )}
 </div>
 <p className="text-xs pg-text-muted mt-1">
 {t('addedOn')} {new Date(channel.createdAt).toLocaleDateString('id-ID')} • {t('usageLabel')} {t('draftCount', { count: channel.usageCount || 0 })}
 </p>
 {renderSocialBadges(channel.socialLinks)}
 </div>

 <div className="flex items-center space-x-2">
 <button
   type="button"
   onClick={() => handleExport(channel.id, channel.channelName)}
   disabled={exportingId === channel.id}
   className="px-3 py-1.5 text-xs font-medium pg-surface-dim pg-text-sub rounded-lg transition-colors flex items-center gap-1 hover:pg-surface border pg-border"
   title={t("exportChannelJson")}
 >
   {exportingId === channel.id ? (
     <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
   ) : (
     <span>📤</span>
   )}
   <span>{t("exportChannelJson")}</span>
 </button>

 <button
 onClick={() => setExpandedId(isExpanded ? null : channel.id)}
 className="px-3 py-1.5 text-xs font-medium pg-surface-dim pg-text-sub rounded-lg transition-colors"
 >
 {isExpanded ? t('hideSettings') : t('editChannel')}
 </button>

 {channels.length > 1 && (
 <button 
 onClick={() => handleDelete(channel.id)}
 className="text-[var(--pg-danger)] hover:text-red-700 text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg"
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
 <div className="text-center p-8 pg-surface-dim border border-dashed pg-border rounded-xl">
 <p className="pg-text-muted mb-4">{t('noChannel')}</p>
 <button 
 onClick={() => setAddingNew(true)}
 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
 >
 {t('createFirst')}
 </button>
 </div>
 )}
 </div>

 <ImportChannelModal
   isOpen={isImportModalOpen}
   onClose={() => setIsImportModalOpen(false)}
   onSuccess={() => {
     setIsImportModalOpen(false);
     router.refresh();
   }}
   canAddMore={canAddMore}
   maxChannels={maxChannels}
   currentCount={channels.length}
 />
 </div>
 );
}
