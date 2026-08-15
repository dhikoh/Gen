"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function AdminPlansClient({ initialPlans }: { initialPlans: any[] }) {
  const router = useRouter();
  const t = useTranslations("AdminPlans");
  const [plans, setPlans] = useState(initialPlans);
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpdate = async (id: string) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;

    setLoading(id);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan.id,
          priceMonthly: parseInt(plan.priceMonthly, 10),
          maxChannels: parseInt(plan.maxChannels, 10),
          isActive: plan.isActive
        })
      });

      if (res.ok) {
        alert(t('updateSuccess'));
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || t('updateFail'));
      }
    } catch (err) {
      alert(t('networkError'));
    } finally {
      setLoading(null);
    }
  };

  const handleChange = (id: string, field: string, value: any) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <div key={plan.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white uppercase">{plan.code}</h3>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={plan.isActive}
                  onChange={(e) => handleChange(plan.id, "isActive", e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${plan.isActive ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${plan.isActive ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{t('monthlyPrice')}</label>
              <input 
                type="number" 
                value={plan.priceMonthly}
                onChange={(e) => handleChange(plan.id, "priceMonthly", e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded outline-none focus:ring-1 focus:ring-blue-500 text-sm text-zinc-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{t('maxChannels')}</label>
              <input 
                type="number" 
                value={plan.maxChannels}
                onChange={(e) => handleChange(plan.id, "maxChannels", e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded outline-none focus:ring-1 focus:ring-blue-500 text-sm text-zinc-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              onClick={() => handleUpdate(plan.id)}
              disabled={loading !== null}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              {loading === plan.id ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
