"use client";
import toast from "react-hot-toast";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function UploadProofClient({ invoiceId, currentProof }: { invoiceId: string, currentProof?: string | null }) {
 const router = useRouter();
 const [loading, setLoading] = useState(false);
 const [preview, setPreview] = useState<string | null>(currentProof || null);
 const [error, setError] = useState<string | null>(null);
 const t = useTranslations("Billing");

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setError(null);
 const file = e.target.files?.[0];
 if (!file) return;

 if (!file.type.startsWith("image/")) {
 setError(t('uploadImageError'));
 return;
 }

 if (file.size > 5 * 1024 * 1024) {
 setError(t('uploadSizeError'));
 return;
 }

 const reader = new FileReader();
 reader.onload = (event) => {
 setPreview(event.target?.result as string);
 };
 reader.readAsDataURL(file);
 };

 const handleUpload = async () => {
 if (!preview || preview === currentProof) return;
 
 setLoading(true);
 setError(null);

 try {
 const res = await fetch("/api/invoice/upload", {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ invoiceId, proofBase64: preview })
 });
 
 const data = await res.json();
 if (res.ok) {
 toast.success(t('uploadSuccess'));
 router.refresh();
 } else {
 setError(data.error || t('uploadFail'));
 }
 } catch (err) {
 setError(t('networkError'));
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="mt-4 border-t pg-border pt-4">
 <h3 className="text-sm font-semibold mb-2 pg-text-heading">{t('uploadProof')}</h3>
 
 {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
 
 <div className="flex flex-col space-y-3">
 {preview && (
 <img src={preview} alt="Bukti Transfer" className="w-32 h-32 object-cover rounded border pg-border" />
 )}
 
 <input 
 type="file" 
 accept="image/*"
 onChange={handleFileChange}
 className="text-xs pg-text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:pg-surface-dim dark:file:pg-text-muted"
 />
 
 <button 
 onClick={handleUpload}
 disabled={loading || !preview || preview === currentProof}
 className="px-4 py-2 pg-surface hover:pg-surface-dim dark:pg-surface-dim dark:hover:bg-white text-white text-xs font-medium rounded shadow-sm disabled:opacity-50"
 >
 {loading ? t('uploading') : currentProof ? t('changeProof') : t('sendProof')}
 </button>
 </div>
 </div>
 );
}
