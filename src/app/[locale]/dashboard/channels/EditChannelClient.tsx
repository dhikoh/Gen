"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ProductsClient from "./ProductsClient";
import UsedTitlesDirectory from "@/components/dashboard/UsedTitlesDirectory";
import { PresetSelect, PresetOption } from "@/components/ui/PresetSelect";

export default function EditChannelClient({
  channel,
  isNew = false,
  onSuccess,
}: {
  channel: any;
  isNew?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("Channels");
  const [loading, setLoading] = useState(false);

  // Preset Options States
  const [platformOptions, setPlatformOptions] = useState<PresetOption[]>([]);
  const [personaOptions, setPersonaOptions] = useState<PresetOption[]>([]);
  const [aestheticOptions, setAestheticOptions] = useState<PresetOption[]>([]);
  const [nicheOptions, setNicheOptions] = useState<PresetOption[]>([]);

  const speechRateOptions: PresetOption[] = [
    { value: 0.25, label: "0.25 s/kata (Super Fast)" },
    { value: 0.30, label: "0.30 s/kata (Cepat)" },
    { value: 0.35, label: "0.35 s/kata (Normal / Standard)" },
    { value: 0.40, label: "0.40 s/kata (Santai)" },
    { value: 0.50, label: "0.50 s/kata (Lambat)" },
  ];

  useEffect(() => {
    fetch("/api/platform-options")
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.options) {
          setPlatformOptions(
            d.options.map((opt: any) => ({ value: opt.label, label: opt.label }))
          );
        }
      })
      .catch(() => {});

    fetch("/api/persona-presets")
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.presets) {
          setPersonaOptions(
            d.presets.map((p: any) => ({ value: p.label, label: p.label }))
          );
        }
      })
      .catch(() => {});

    fetch("/api/visual-aesthetic-presets")
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.presets) {
          setAestheticOptions(
            d.presets.map((a: any) => ({ value: a.label, label: a.label }))
          );
        }
      })
      .catch(() => {});

    fetch("/api/niche-category-presets")
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.presets) {
          setNicheOptions(
            d.presets.map((n: any) => ({ value: n.label, label: n.label }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Parse initial social links
  const initSocial = () => {
    const raw = channel?.socialLinks;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return {
        website: raw.website || "",
        tiktok: raw.tiktok || "",
        instagram: raw.instagram || "",
        facebook: raw.facebook || "",
        youtube: raw.youtube || "",
      };
    }
    const arr = Array.isArray(raw)
      ? raw
      : typeof raw === "string"
      ? raw.split(",")
      : [];
    return {
      website: arr[0]?.trim() || "",
      tiktok: arr[1]?.trim() || "",
      instagram: arr[2]?.trim() || "",
      facebook: arr[3]?.trim() || "",
      youtube: arr[4]?.trim() || "",
    };
  };

  const [formData, setFormData] = useState({
    channelName: channel?.channelName || "",
    niche: channel?.niche || "Teknologi & Gadget",
    targetPlatform: channel?.targetPlatform || "TikTok",
    personaPov: channel?.personaPov || "Expert Storyteller (Edukasi & Inspirasi)",
    speechRate: channel?.speechRate ?? 0.35,
    description: channel?.description || "",
    cta1: channel?.cta1 || "",
    cta2: channel?.cta2 || "",
    visualAesthetic: channel?.visualAesthetic || "Cinematic Dark Mode (Sleek & Professional)",
    audioBGM: channel?.audioBGM ?? true,
    audioSFX: channel?.audioSFX ?? true,
    audioVO: channel?.audioVO ?? true,
  });

  const [socialLinks, setSocialLinks] = useState(initSocial());

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSocialLinks((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isNew ? "/api/channels" : `/api/channels/${channel.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          speechRate: Number(formData.speechRate) || 0.35,
          socialLinks: socialLinks,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(isNew ? t("saveSuccessNew") : t("saveSuccessUpdate"));
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        toast.error(data.error || t("saveFail"));
      }
    } catch (err) {
      toast.error(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <form
        autoComplete="off"
        onSubmit={handleSubmit}
        className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 glass-panel"
      >
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-3">
          {isNew ? "Buat Channel Profile Baru" : `Pengaturan: ${channel?.channelName}`}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("channelName")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="channelName"
              value={formData.channelName}
              onChange={handleChange}
              placeholder="e.g. TeknoPedia, FinansialSmart"
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
              required
            />
          </div>

          <PresetSelect
            label="Kategori / Niche Channel"
            value={formData.niche}
            onChange={(val) => setFormData((prev) => ({ ...prev, niche: val }))}
            options={nicheOptions.length > 0 ? nicheOptions : [
              { value: "Teknologi & Gadget", label: "Teknologi & Gadget" },
              { value: "Bisnis & Finance", label: "Bisnis & Finance" },
              { value: "Edukasi & Karir", label: "Edukasi & Karir" },
            ]}
            placeholder="Ketik Niche Kustom..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PresetSelect
            label="Target Platform"
            value={formData.targetPlatform}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, targetPlatform: val }))
            }
            options={platformOptions.length > 0 ? platformOptions : [
              { value: "TikTok", label: "TikTok" },
              { value: "Instagram Reels", label: "Instagram Reels" },
              { value: "YouTube Shorts", label: "YouTube Shorts" },
              { value: "YouTube Long", label: "YouTube Long" },
            ]}
            placeholder="Platform kustom..."
          />

          <PresetSelect
            label="Persona & POV Kreator"
            value={formData.personaPov}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, personaPov: val }))
            }
            options={personaOptions.length > 0 ? personaOptions : [
              { value: "Expert Storyteller (Edukasi & Inspirasi)", label: "Expert Storyteller (Edukasi & Inspirasi)" },
              { value: "Energetic Reviewer (Review Produk)", label: "Energetic Reviewer (Review Produk)" },
              { value: "Casual Friend (Santai & Relatable)", label: "Casual Friend (Santai & Relatable)" },
            ]}
            placeholder="Ketik Persona Kustom..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PresetSelect
            label="Speech Rate (Kecepatan Suara)"
            value={formData.speechRate}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, speechRate: val }))
            }
            options={speechRateOptions}
            type="number"
            step="0.01"
            min={0.1}
            max={1.0}
            placeholder="Durasi detik per kata (e.g. 0.35)"
            helpText="Mengukur berapa detik waktu yang dibutuhkan untuk mengucapkan 1 kata (Standar: 0.35 s/kata)"
          />

          <PresetSelect
            label="Visual Aesthetic & Style"
            value={formData.visualAesthetic}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, visualAesthetic: val }))
            }
            options={aestheticOptions.length > 0 ? aestheticOptions : [
              { value: "Cinematic Dark Mode (Sleek & Professional)", label: "Cinematic Dark Mode" },
              { value: "Neon Cyberpunk (Futuristis & High-Contrast)", label: "Neon Cyberpunk" },
              { value: "Minimalist Clean (Soft Colors & Modern)", label: "Minimalist Clean" },
            ]}
            placeholder="Gaya visual kustom..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t("description")}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            placeholder="Deskripsi singkat mengenai fokus konten channel ini..."
            className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              CTA 1 (Call-to-Action Utama)
            </label>
            <input
              type="text"
              name="cta1"
              value={formData.cta1}
              onChange={handleChange}
              placeholder="e.g. Klik link di bio untuk info selengkapnya!"
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              CTA 2 (Call-to-Action Sekunder)
            </label>
            <input
              type="text"
              name="cta2"
              value={formData.cta2}
              onChange={handleChange}
              placeholder="e.g. Follow & Simpan video ini agar tidak lupa!"
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Pengaturan Audio Bawaan
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                name="audioBGM"
                checked={formData.audioBGM}
                onChange={handleCheckboxChange}
                className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Sertakan Musik Latar (BGM)</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                name="audioSFX"
                checked={formData.audioSFX}
                onChange={handleCheckboxChange}
                className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Sertakan Efek Suara (SFX)</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                name="audioVO"
                checked={formData.audioVO}
                onChange={handleCheckboxChange}
                className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Sertakan Voice Over (VO) Prompt</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Tautan Media Sosial
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              name="website"
              value={socialLinks.website}
              onChange={handleSocialChange}
              placeholder="🌐 Website URL"
              className="p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs outline-none text-zinc-900 dark:text-white"
            />
            <input
              type="text"
              name="tiktok"
              value={socialLinks.tiktok}
              onChange={handleSocialChange}
              placeholder="🎵 TikTok URL"
              className="p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs outline-none text-zinc-900 dark:text-white"
            />
            <input
              type="text"
              name="instagram"
              value={socialLinks.instagram}
              onChange={handleSocialChange}
              placeholder="📸 Instagram URL"
              className="p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs outline-none text-zinc-900 dark:text-white"
            />
            <input
              type="text"
              name="facebook"
              value={socialLinks.facebook}
              onChange={handleSocialChange}
              placeholder="📘 Facebook URL"
              className="p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs outline-none text-zinc-900 dark:text-white"
            />
            <input
              type="text"
              name="youtube"
              value={socialLinks.youtube}
              onChange={handleSocialChange}
              placeholder="▶️ YouTube URL"
              className="p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs outline-none text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? t("saving") : isNew ? "Buat Channel" : t("saveChanges")}
          </button>
        </div>
      </form>

      {!isNew && channel?.id && (
        <>
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <ProductsClient channelId={channel.id} />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <UsedTitlesDirectory channelId={channel.id} channelName={channel.channelName} />
          </div>
        </>
      )}
    </div>
  );
}
