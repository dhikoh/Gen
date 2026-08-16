"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function DraftFilter({ channels, defaultChannelId, defaultType }: { channels: any[], defaultChannelId?: string, defaultType?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <label className="block text-xs font-medium text-zinc-500 mb-1">Filter Type</label>
        <select 
          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={defaultType || ""}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          <option value="">Semua Tipe</option>
          <option value="VIDEO">Video Script</option>
          <option value="IMAGE">Image Prompt</option>
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-zinc-500 mb-1">Filter Channel</label>
        <select 
          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={defaultChannelId || ""}
          onChange={(e) => handleFilterChange('channelId', e.target.value)}
        >
          <option value="">Semua Channel</option>
          {channels.map(c => (
            <option key={c.id} value={c.id}>{c.channelName}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
