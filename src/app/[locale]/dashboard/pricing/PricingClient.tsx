"use client";
import toast from "react-hot-toast";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface PricingPlanDto {
 id: string;
 code: string;
 name: string;
 priceMonthly: number;
 maxChannels: number;
 features?: Record<string, boolean> | null;
}

export default function PricingClient({ plans, locale }: { plans: PricingPlanDto[], locale: string }) {
 const router = useRouter();
 const t = useTranslations("Pricing");
 const [loading, setLoading] = useState<string | null>(null);

 const handleSubscribe = async (planId: string) => {
 setLoading(planId);
 try {
 const res = await fetch("/api/invoice", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ planId })
 });

 const data = await res.json();
 
 if (res.ok) {
 // Arahkan ke halaman riwayat tagihan untuk instruksi pembayaran manual
 router.push(`/${locale}/dashboard/billing`);
 router.refresh();
 } else {
 toast.error(data.error || t('systemError'));
 setLoading(null);
 }
 } catch (error) {
 toast.error(t('networkError'));
 setLoading(null);
 }
 };

 return (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
 {plans.map((plan) => (
 <div key={plan.id} className="pg-surface rounded-2xl shadow-sm border pg-border overflow-hidden flex flex-col relative">
 {plan.code === "PRO" && (
 <div className="absolute top-0 inset-x-0 h-1 bg-blue-600"></div>
 )}
 <div className="p-8 flex-1">
 <h3 className="text-xl font-bold pg-text-heading mb-2">{plan.name}</h3>
 <div className="flex items-baseline mb-6">
 <span className="text-3xl font-extrabold pg-text-heading">Rp {plan.priceMonthly.toLocaleString('id-ID')}</span>
 <span className="pg-text-muted ml-1">{t('perMonth')}</span>
 </div>
 
 <ul className="space-y-4 mb-8 text-sm pg-text-sub dark:pg-text-muted">
 <li className="flex items-start">
 <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
 </svg>
 <span className="ml-3">{t('max')} {plan.maxChannels} {t('channels')}</span>
 </li>
 <li className="flex items-start">
 <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
 </svg>
 <span className="ml-3">{t('aiPriority')}</span>
 </li>
 {plan.features?.imagePromptStudio && (
 <li className="flex items-start">
 <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
 </svg>
 <span className="ml-3">{t('imagePrompt')}</span>
 </li>
 )}
 </ul>
 </div>
 <div className="p-8 pt-0 mt-auto">
 <button
 onClick={() => handleSubscribe(plan.id)}
 disabled={loading !== null}
 className={`w-full py-3 px-4 font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex justify-center items-center ${
 plan.code === "PRO"
 ? "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
 : "pg-surface-dim pg-text-heading"
 }`}
 >
 {loading === plan.id ? (
 <span className="inline-block animate-spin mr-2 border-2 border-current border-t-transparent rounded-full w-4 h-4" />
 ) : (
 t('choosePlan')
 )}
 </button>
 </div>
 </div>
 ))}
 </div>
 );
}
