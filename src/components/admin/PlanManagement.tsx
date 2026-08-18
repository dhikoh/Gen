"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export interface PlanFeature {
  imagePromptStudio?: boolean;
  [key: string]: any; // Allow other features dynamically
}

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  maxChannels: number;
  isActive: boolean;
  features?: PlanFeature | null;
}

export default function PlanManagement({ initialPlans }: { initialPlans: Plan[] }) {
  const t = useTranslations("AdminPlans");
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [priceMonthly, setPriceMonthly] = useState(0);
  const [maxChannels, setMaxChannels] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [imagePromptStudio, setImagePromptStudio] = useState(false);

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setPriceMonthly(plan.priceMonthly);
    setMaxChannels(plan.maxChannels);
    setIsActive(plan.isActive);
    setImagePromptStudio(plan.features?.imagePromptStudio || false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!editingPlan) return;
      const payload = {
        id: editingPlan.id,
        priceMonthly,
        maxChannels,
        isActive,
        features: {
          ...(editingPlan.features || {}),
          imagePromptStudio,
        }
      };

      const res = await fetch(`/api/admin/plans`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const { plan: updatedPlan } = await res.json();
        setPlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p));
        toast.success(t("updateSuccess"));
        setEditingPlan(null);
      } else {
        const data = await res.json();
        toast.error(data.error || t("updateFail"));
      }
    } catch (e) {
      toast.error(t("networkError"));
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel shadow-lg rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("title")}</h2>
      </div>

      <div className="overflow-x-auto min-h-[200px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium">{t("name")}</th>
              <th className="px-6 py-3 font-medium">{t("monthlyPrice")}</th>
              <th className="px-6 py-3 font-medium">{t("maxChannels")}</th>
              <th className="px-6 py-3 font-medium">{t("features")}</th>
              <th className="px-6 py-3 font-medium">{t("active")}</th>
              <th className="px-6 py-3 font-medium text-right">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {plans.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">{p.name}</td>
                <td className="px-6 py-4">Rp {p.priceMonthly.toLocaleString('id-ID')}</td>
                <td className="px-6 py-4">{p.maxChannels}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.features?.imagePromptStudio ? 'bg-purple-100 text-purple-800' : 'bg-zinc-100 text-zinc-500'}`}>
                    {t("imageStudio")}: {p.features?.imagePromptStudio ? t("yes") : t("no")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {p.isActive ? t("active") : t("inactive")}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => startEdit(p)} className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800">{t("editPlan")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleSave} className="glass-panel rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-semibold text-zinc-900 dark:text-white">{t("editPlan")}: {editingPlan.name}</h3>
              <button type="button" onClick={() => setEditingPlan(null)} className="text-zinc-400 hover:text-zinc-600">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("monthlyPrice")} (Rp)</label>
                <input type="number" value={priceMonthly} onChange={e => setPriceMonthly(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 rounded-md" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("maxChannels")}</label>
                <input type="number" value={maxChannels} onChange={e => setMaxChannels(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 rounded-md" />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={imagePromptStudio} onChange={e => setImagePromptStudio(e.target.checked)} id="ips" className="rounded" />
                <label htmlFor="ips" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("enableImageStudio")}</label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} id="act" className="rounded" />
                <label htmlFor="act" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("planIsActive")}</label>
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingPlan(null)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-200 rounded-md">{t("cancel")}</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
                {loading ? t("saving") : t("saveChanges")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
