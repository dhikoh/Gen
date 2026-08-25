"use client";
import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { KNOWN_PLAN_FEATURES } from "@/lib/planFeatures";
import { PlanCode } from "@prisma/client";

export interface PlanDto {
  id: string;
  code: string;
  name: string;
  priceMonthly: number;
  maxChannels: number;
  isActive: boolean;
  isPubliclyPurchasable: boolean;
  sortOrder: number;
  features: Record<string, boolean> | null;
}

const ALL_PLAN_CODES = Object.values(PlanCode);

const emptyCreate = {
  code: "" as PlanCode | "",
  name: "",
  priceMonthly: 0,
  maxChannels: 1,
  isActive: true,
  isPubliclyPurchasable: false,
  sortOrder: 99,
  features: Object.fromEntries(KNOWN_PLAN_FEATURES.map(f => [f.key, f.defaultValue])),
};

export default function AdminPlansClient({ initialPlans }: { initialPlans: PlanDto[] }) {
  const router = useRouter();
  const t = useTranslations("AdminPlans");
  const [plans, setPlans] = useState<PlanDto[]>(initialPlans);
  const [loading, setLoading] = useState<string | null>(null);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyCreate });

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── UPDATE ──────────────────────────────────────────────────
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
          name: plan.name,
          priceMonthly: Number(plan.priceMonthly),
          maxChannels: Number(plan.maxChannels),
          isActive: plan.isActive,
          isPubliclyPurchasable: plan.isPubliclyPurchasable,
          sortOrder: Number(plan.sortOrder),
          features: plan.features || {},
        }),
      });
      if (res.ok) {
        toast.success(t("updateSuccess"));
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || t("updateFail"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setLoading(null);
    }
  };

  const handleChange = (id: string, field: keyof PlanDto, value: unknown) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleFeatureToggle = (id: string, featureKey: string, enabled: boolean) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== id) return p;
      const cur = p.features && typeof p.features === "object" ? p.features : {};
      return { ...p, features: { ...cur, [featureKey]: enabled } };
    }));
  };

  // ─── CREATE ──────────────────────────────────────────────────
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.code) { toast.error(t("codeRequired")); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: createForm.code,
          name: createForm.name,
          priceMonthly: Number(createForm.priceMonthly),
          maxChannels: Number(createForm.maxChannels),
          isActive: createForm.isActive,
          isPubliclyPurchasable: createForm.isPubliclyPurchasable,
          sortOrder: Number(createForm.sortOrder),
          features: createForm.features,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("createSuccess"));
        setShowCreate(false);
        setCreateForm({ ...emptyCreate });
        router.refresh();
      } else {
        toast.error(data.error || t("createFail"));
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFeatureToggle = (key: string, val: boolean) => {
    setCreateForm(prev => ({ ...prev, features: { ...prev.features, [key]: val } }));
  };

  // ─── DELETE ──────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/plans?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("deleteSuccess"));
        setDeleteConfirmId(null);
        router.refresh();
      } else {
        toast.error(data.error || t("deleteFail"));
        setDeleteConfirmId(null);
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setDeleting(false);
    }
  };

  // ─── TOGGLE HELPER ───────────────────────────────────────────
  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? "bg-green-500" : "pg-surface-dim"}`} />
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? "transform translate-x-4" : ""}`} />
      </div>
    </label>
  );

  const inputCls = "w-full px-3 py-2 pg-bg-page border pg-border rounded outline-none focus:ring-1 focus:ring-blue-500 text-sm pg-text-heading neu-flat";

  return (
    <div className="space-y-6">
      {/* Header + Add Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm pg-text-muted">{t("description")}</p>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + {t("addPlan")}
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const planFeatures = plan.features && typeof plan.features === "object" ? plan.features : {};
          return (
            <div key={plan.id} className="pg-surface border pg-border rounded-xl p-6 shadow-sm flex flex-col justify-between glass-panel">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold pg-text-muted uppercase tracking-widest">{plan.code}</span>
                    <h3 className="text-lg font-bold pg-text-heading">{plan.name}</h3>
                  </div>
                  <Toggle
                    checked={plan.isActive}
                    onChange={v => handleChange(plan.id, "isActive", v)}
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium pg-text-muted mb-1">{t("planName")}</label>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={e => handleChange(plan.id, "name", e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-medium pg-text-muted mb-1">{t("monthlyPrice")}</label>
                  <input
                    type="number"
                    value={plan.priceMonthly}
                    onChange={e => handleChange(plan.id, "priceMonthly", e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Max Channels */}
                <div>
                  <label className="block text-xs font-medium pg-text-muted mb-1">{t("maxChannels")}</label>
                  <input
                    type="number"
                    value={plan.maxChannels}
                    onChange={e => handleChange(plan.id, "maxChannels", e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-xs font-medium pg-text-muted mb-1">{t("sortOrder")}</label>
                  <input
                    type="number"
                    value={plan.sortOrder}
                    onChange={e => handleChange(plan.id, "sortOrder", e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* isPubliclyPurchasable */}
                <div className="flex items-center justify-between">
                  <label className="text-sm pg-text-sub">{t("publiclyPurchasable")}</label>
                  <Toggle
                    checked={plan.isPubliclyPurchasable}
                    onChange={v => handleChange(plan.id, "isPubliclyPurchasable", v)}
                  />
                </div>

                {/* Feature Flags */}
                <div className="pt-3 border-t pg-border space-y-3">
                  <p className="text-xs font-semibold pg-text-muted uppercase tracking-wider">{t("featureFlags")}</p>
                  {KNOWN_PLAN_FEATURES.map((feat) => {
                    const isChecked = planFeatures[feat.key] ?? feat.defaultValue;
                    return (
                      <label key={feat.key} className="flex items-center justify-between cursor-pointer text-sm pg-text-sub">
                        <span>{t(feat.labelKey as Parameters<typeof t>[0])}</span>
                        <div className="relative ml-2">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={Boolean(isChecked)}
                            onChange={e => handleFeatureToggle(plan.id, feat.key, e.target.checked)}
                          />
                          <div className={`block w-8 h-5 rounded-full transition-colors ${isChecked ? "bg-blue-600" : "pg-surface-dim"}`} />
                          <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isChecked ? "transform translate-x-3" : ""}`} />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => handleUpdate(plan.id)}
                  disabled={loading !== null}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  {loading === plan.id ? t("saving") : t("saveChanges")}
                </button>
                <button
                  onClick={() => setDeleteConfirmId(plan.id)}
                  disabled={loading !== null}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                  title={t("deletePlan")}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="pg-surface border pg-border rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold pg-text-heading mb-2">⚠️ {t("deletePlan")}</h3>
            <p className="text-sm pg-text-sub mb-6">{t("deleteConfirmMsg")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {deleting ? t("deleting") : t("confirmDelete")}
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="flex-1 py-2 pg-surface-dim pg-text-heading text-sm font-medium rounded-lg"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Plan Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="pg-surface border pg-border rounded-xl p-6 max-w-md w-full shadow-2xl my-8">
            <h3 className="text-lg font-bold pg-text-heading mb-4">➕ {t("addPlan")}</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-medium pg-text-muted mb-1">{t("planCode")} *</label>
                <select
                  value={createForm.code}
                  onChange={e => setCreateForm(prev => ({ ...prev, code: e.target.value as PlanCode }))}
                  className={inputCls}
                  required
                >
                  <option value="">{t("selectCode")}</option>
                  {ALL_PLAN_CODES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {/* Name */}
              <div>
                <label className="block text-xs font-medium pg-text-muted mb-1">{t("planName")} *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className={inputCls}
                  required
                />
              </div>
              {/* Price */}
              <div>
                <label className="block text-xs font-medium pg-text-muted mb-1">{t("monthlyPrice")}</label>
                <input
                  type="number"
                  min={0}
                  value={createForm.priceMonthly}
                  onChange={e => setCreateForm(prev => ({ ...prev, priceMonthly: Number(e.target.value) }))}
                  className={inputCls}
                />
              </div>
              {/* Max Channels */}
              <div>
                <label className="block text-xs font-medium pg-text-muted mb-1">{t("maxChannels")}</label>
                <input
                  type="number"
                  min={1}
                  value={createForm.maxChannels}
                  onChange={e => setCreateForm(prev => ({ ...prev, maxChannels: Number(e.target.value) }))}
                  className={inputCls}
                />
              </div>
              {/* Sort Order */}
              <div>
                <label className="block text-xs font-medium pg-text-muted mb-1">{t("sortOrder")}</label>
                <input
                  type="number"
                  value={createForm.sortOrder}
                  onChange={e => setCreateForm(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                  className={inputCls}
                />
              </div>
              {/* Toggles */}
              <div className="flex items-center justify-between">
                <label className="text-sm pg-text-sub">{t("planIsActive")}</label>
                <Toggle checked={createForm.isActive} onChange={v => setCreateForm(prev => ({ ...prev, isActive: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm pg-text-sub">{t("publiclyPurchasable")}</label>
                <Toggle checked={createForm.isPubliclyPurchasable} onChange={v => setCreateForm(prev => ({ ...prev, isPubliclyPurchasable: v }))} />
              </div>
              {/* Feature Flags (required — P3-1: admin must explicitly set) */}
              <div className="pt-3 border-t pg-border space-y-3">
                <p className="text-xs font-semibold pg-text-muted uppercase tracking-wider">{t("featureFlags")}</p>
                <p className="text-xs pg-text-muted">{t("featureFlagsNewPlanNote")}</p>
                {KNOWN_PLAN_FEATURES.map(feat => (
                  <label key={feat.key} className="flex items-center justify-between cursor-pointer text-sm pg-text-sub">
                    <span>{t(feat.labelKey as Parameters<typeof t>[0])}</span>
                    <div className="relative ml-2">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={Boolean(createForm.features[feat.key])}
                        onChange={e => handleCreateFeatureToggle(feat.key, e.target.checked)}
                      />
                      <div className={`block w-8 h-5 rounded-full transition-colors ${createForm.features[feat.key] ? "bg-blue-600" : "pg-surface-dim"}`} />
                      <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${createForm.features[feat.key] ? "transform translate-x-3" : ""}`} />
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  {creating ? t("saving") : t("createPlan")}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateForm({ ...emptyCreate }); }}
                  className="flex-1 py-2 pg-surface-dim pg-text-heading text-sm font-medium rounded-lg"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
