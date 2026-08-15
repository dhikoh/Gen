"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function ProductsClient({ channelId }: { channelId: string }) {
  const t = useTranslations("Channels");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", price: 0, link: "" });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/channels/${channelId}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [channelId]);

  const handleStartEdit = (p: any) => {
    setEditingId(p.id);
    setFormData({ name: p.name, description: p.description || "", price: p.price, link: p.link || "" });
    setAddingNew(false);
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", price: 0, link: "" });
    setAddingNew(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setAddingNew(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "price" ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const isNew = addingNew;
      const url = isNew ? `/api/channels/${channelId}/products` : `/api/products/${editingId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        handleCancel();
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error || t('saveProductFail'));
      }
    } catch (err) {
      alert(t('networkError'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteProduct'))) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      alert(t('networkError'));
    }
  };

  if (loading) return <div className="text-sm text-zinc-500 py-4">{t('loadingProducts')}</div>;

  return (
    <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t('productsTitle')}</h3>
        {!addingNew && !editingId && (
          <button 
            onClick={handleStartAdd}
            type="button"
            className="px-3 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 rounded font-medium"
          >
            {t('addProduct')}
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-500 mb-4">{t('productsDesc')}</p>

      {(addingNew || editingId) && (
        <form onSubmit={handleSubmit} className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('productName')}</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('price')}</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('buyLink')}</label>
              <input type="url" name="link" value={formData.link} onChange={handleChange} placeholder={t('linkPlaceholder')} className="w-full px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('shortDesc')}</label>
              <textarea name="description" rows={2} value={formData.description} onChange={handleChange} className="w-full px-3 py-1.5 text-sm rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white"></textarea>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={handleCancel} className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">{t('cancel')}</button>
            <button type="submit" disabled={submitLoading} className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50">
              {submitLoading ? t('saving') : t('saveProduct')}
            </button>
          </div>
        </form>
      )}

      {!addingNew && !editingId && products.length === 0 && (
        <div className="text-center p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg text-xs text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800">
          {t('noProducts')}
        </div>
      )}

      {!addingNew && !editingId && products.length > 0 && (
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
              <div>
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">{p.name} <span className="ml-2 font-normal text-green-600 dark:text-green-400">Rp {p.price.toLocaleString('id-ID')}</span></h4>
                {p.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{p.description}</p>}
              </div>
              <div className="flex space-x-2">
                <button type="button" onClick={() => handleStartEdit(p)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded">{t('edit')}</button>
                <button type="button" onClick={() => handleDelete(p.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 rounded">{t('delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
