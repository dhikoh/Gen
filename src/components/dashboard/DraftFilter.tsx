"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface ChannelOption {
  id: string;
  channelName: string;
}

export default function DraftFilter({
  channels,
  defaultChannelId = "",
  defaultType = "",
}: {
  channels: ChannelOption[];
  defaultChannelId?: string;
  defaultType?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('Drafts');

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const selectCls = "w-full px-3 py-2 rounded-lg text-sm outline-none neu-input";

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pg-text-sub)' }}>{t('filterType')}</label>
        <select
          className={selectCls}
          value={defaultType || ""}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          <option value="">{t('allTypes')}</option>
          <option value="VIDEO">{t('videoScript')}</option>
          <option value="IMAGE">{t('imagePrompt')}</option>
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pg-text-sub)' }}>{t('filterChannel')}</label>
        <select
          className={selectCls}
          value={defaultChannelId || ""}
          onChange={(e) => handleFilterChange('channelId', e.target.value)}
        >
          <option value="">{t('allChannels')}</option>
          {channels.map(c => (
            <option key={c.id} value={c.id}>{c.channelName}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
