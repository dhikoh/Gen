"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import CompositionSliderGroup from "./CompositionSliderGroup";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  link?: string | null;
}

interface PlatformOptionItem {
  id: string;
  label: string;
}

interface PersonaPresetItem {
  id: string;
  label: string;
  description?: string | null;
}

interface VisualAestheticItem {
  id: string;
  label: string;
}

export default function GeneratorForm({
  channels,
  promptSettings,
  planFeatures = { imagePromptStudio: true, htmlBlogExport: true }
}: {
  channels: any[];
  promptSettings?: any;
  planFeatures?: { imagePromptStudio?: boolean; htmlBlogExport?: boolean };
}) {
  const router = useRouter();
  const t = useTranslations("Generator");

  const [type, setType] = useState<"VIDEO" | "IMAGE">("VIDEO");
  const [channelId, setChannelId] = useState(channels.length > 0 ? channels[0].id : "");
  const [topic, setTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");

  const [step, setStep] = useState<1 | 2>(1);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [aiResultJson, setAiResultJson] = useState<string>("");
  const [manualTitle, setManualTitle] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Dynamic presets state
  const [platformOptions, setPlatformOptions] = useState<PlatformOptionItem[]>([]);
  const [personaPresets, setPersonaPresets] = useState<PersonaPresetItem[]>([]);
  const [visualAesthetics, setVisualAesthetics] = useState<VisualAestheticItem[]>([]);
  const [channelProducts, setChannelProducts] = useState<ProductItem[]>([]);

  // Quick Add Product Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("0");
  const [newProductLink, setNewProductLink] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);

  // Default speech rate
  let initialSpeechRate = "Sedang";
  if (promptSettings?.defaultSpeechRate === "slow") initialSpeechRate = "Lambat";
  if (promptSettings?.defaultSpeechRate === "fast") initialSpeechRate = "Cepat";

  // Video specific fields
  const [videoConfig, setVideoConfig] = useState({
    pov: "Ahli SEO & Digital Marketing",
    targetPlatform: "TikTok",
    aspectRatio: "9:16",
    targetDurationSec: 60,
    targetSceneCount: 6,
    speechRate: initialSpeechRate,
    hookStyle: "Pertanyaan Provokatif",
    endingStyle: "Pertanyaan Terbuka",
    narrativeLoopStyle: "Tanpa Loop",
    visualLoopStyle: "Tanpa Loop",
    selectedProductId: "",
    includeHook: true,
    includeCTA: true,
    includeCaption: true,
    includeThumbnail: true,
    includeHtmlBlog: false,
    composition: {
      education: 40,
      entertainment: 40,
      marketing: 20
    }
  });

  // Image specific fields
  const [imageConfig, setImageConfig] = useState({
    cameraType: "DSLR",
    shotType: "Medium Shot",
    lighting: "Natural Light",
    mood: "Cinematic",
    colorGrading: "Teal and Orange",
    visualStyle: "Photorealistic",
    negativePrompt: promptSettings?.defaultNegativePrompt || "ugly, blurry, deformed, watermark",
    variations: 4,
    aspectRatio: "16:9"
  });

  // Fetch presets on mount
  useEffect(() => {
    fetch("/api/platform-options")
      .then((res) => res.json())
      .then((d) => d.success && setPlatformOptions(d.options || []))
      .catch(() => {});

    fetch("/api/persona-presets")
      .then((res) => res.json())
      .then((d) => d.success && setPersonaPresets(d.presets || []))
      .catch(() => {});

    fetch("/api/visual-aesthetic-presets")
      .then((res) => res.json())
      .then((d) => d.success && setVisualAesthetics(d.presets || []))
      .catch(() => {});
  }, []);

  // Fetch channel products when channelId changes
  useEffect(() => {
    if (!channelId) {
      setChannelProducts([]);
      return;
    }
    fetch(`/api/channels/${channelId}/products`)
      .then((res) => res.json())
      .then((d) => setChannelProducts(d.products || []))
      .catch(() => setChannelProducts([]));
  }, [channelId]);

  const handleVideoConfigChange = (name: string, value: any) => {
    setVideoConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageConfigChange = (e: any) => {
    const { name, value, type } = e.target;
    setImageConfig((prev) => ({ ...prev, [name]: type === "number" ? parseInt(value) || 0 : value }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      toast.error("Nama produk wajib diisi.");
      return;
    }
    if (!channelId) {
      toast.error("Pilih channel terlebih dahulu.");
      return;
    }

    setAddingProduct(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductName.trim(),
          description: newProductDesc.trim() || undefined,
          price: parseFloat(newProductPrice) || 0,
          link: newProductLink.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah produk");

      toast.success("Produk berhasil ditambahkan!");
      setChannelProducts((prev) => [data.product, ...prev]);
      setVideoConfig((prev) => ({ ...prev, selectedProductId: data.product.id }));
      setShowProductModal(false);
      setNewProductName("");
      setNewProductDesc("");
      setNewProductPrice("0");
      setNewProductLink("");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setAddingProduct(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId) {
      setError(t("channelError"));
      return;
    }

    setLoading(true);
    setError(null);
    setResult("");

    const selectedChannel = channels.find((c) => c.id === channelId);
    const effectiveTopic = topic.trim() ? topic.trim() : (selectedChannel?.niche || "Topik Umum");

    try {
      const payload = {
        type,
        channelId,
        topic: effectiveTopic,
        additionalContext,
        videoConfig: type === "VIDEO" ? videoConfig : undefined,
        imageConfig: type === "IMAGE" ? imageConfig : undefined,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("generateError"));
      } else {
        if (type === "IMAGE" && data.data.finalJson) {
          setGeneratedPrompt(data.data.master_prompt);
          setAiResultJson(data.data.finalJson);
          setStep(2);
        } else {
          const fullText = `${data.data.system_instruction}\n\n${data.data.master_prompt}`;
          setGeneratedPrompt(fullText);
          setStep(2);
        }
      }
    } catch (err) {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!aiResultJson.trim()) {
      setError(t("pasteJsonFirst"));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let rateValue = 130;
      if (videoConfig.speechRate === "Lambat") rateValue = 110;
      if (videoConfig.speechRate === "Cepat") rateValue = 160;

      const selectedChannel = channels.find((c) => c.id === channelId);
      const effectiveTopic = topic.trim() ? topic.trim() : (selectedChannel?.niche || "Topik Umum");

      const payload: any = {
        channelId,
        type,
        topic: effectiveTopic,
        rawJson: aiResultJson,
        speechRate: rateValue,
        targetDurationSec: type === "VIDEO" ? Number(videoConfig.targetDurationSec) : undefined,
        targetSceneCount: type === "VIDEO" ? Number(videoConfig.targetSceneCount) : undefined,
        narrativeLoopStyle: type === "VIDEO" ? videoConfig.narrativeLoopStyle : undefined,
        visualLoopStyle: type === "VIDEO" ? videoConfig.visualLoopStyle : undefined,
      };
      if (manualTitle.trim()) {
        payload.title = manualTitle;
      }

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("saveDraftError"));
      } else {
        setResult(t("savedInDraftsSuccess"));
        router.refresh();
      }
    } catch (err) {
      setError(t("serverError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Kolom Form Input */}
      <div className="glass-panel shadow-lg rounded-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 sticky top-0 bg-white dark:bg-zinc-900 z-10 py-2 border-b border-zinc-100 dark:border-zinc-800">
          {t("paramTitle")}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form autoComplete="off" onSubmit={handleGenerate}>
          <fieldset disabled={loading || step === 2} className="space-y-6">
            {/* General Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {t("selectChannel")}
                </label>
                <select
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  required
                >
                  <option value="" disabled>
                    {t("selectChannelPlaceholder")}
                  </option>
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.channelName} - {c.niche || "Tanpa Niche"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {t("promptType")}
                </label>
                <div className="flex space-x-4">
                  <label
                    className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      type === "VIDEO"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="VIDEO"
                      checked={type === "VIDEO"}
                      onChange={() => setType("VIDEO")}
                      className="sr-only"
                    />
                    <span>{t("videoScript")}</span>
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center p-3 border rounded-lg transition-colors ${
                      !planFeatures.imagePromptStudio
                        ? "opacity-50 cursor-not-allowed border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50"
                        : type === "IMAGE"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 cursor-pointer"
                        : "border-zinc-200 dark:border-zinc-700 cursor-pointer"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value="IMAGE"
                      checked={type === "IMAGE"}
                      disabled={!planFeatures.imagePromptStudio}
                      onChange={() => {
                        if (planFeatures.imagePromptStudio) setType("IMAGE");
                      }}
                      className="sr-only"
                    />
                    <div className="flex flex-col items-center">
                      <span>{t("imagePrompt")}</span>
                      {!planFeatures.imagePromptStudio && (
                        <span className="text-[10px] text-amber-500 font-semibold mt-0.5">
                          🔒 Upgrade Required
                        </span>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {t("mainTopic")}{" "}
                  <span className="text-xs text-zinc-400 font-normal">
                    (Opsional, otomatis menggunakan Niche Channel jika dikosongkan)
                  </span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t("mainTopicPlaceholder")}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {t("additionalContext")}
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder={t("additionalContextPlaceholder")}
                  rows={2}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
                />
              </div>
            </div>

            {/* Video Specific Settings */}
            {type === "VIDEO" && (
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-5">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                  {t("videoSettings")} & Presisi Presets
                </h3>

                {/* Platform & Persona Comboboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("targetPlatform")} (Pilih / Kustom)
                    </label>
                    <input
                      type="text"
                      list="platform-list"
                      value={videoConfig.targetPlatform}
                      onChange={(e) => handleVideoConfigChange("targetPlatform", e.target.value)}
                      placeholder="TikTok, Instagram Reels, dst."
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    />
                    <datalist id="platform-list">
                      {platformOptions.map((p) => (
                        <option key={p.id} value={p.label} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Persona & POV Kreator (Pilih / Kustom)
                    </label>
                    <input
                      type="text"
                      list="persona-list"
                      value={videoConfig.pov}
                      onChange={(e) => handleVideoConfigChange("pov", e.target.value)}
                      placeholder="Ahli SEO, Storyteller, Mentor Bisnis..."
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    />
                    <datalist id="persona-list">
                      {personaPresets.map((p) => (
                        <option key={p.id} value={p.label} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Product Selection Section */}
                <div className="bg-zinc-50 dark:bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-zinc-900 dark:text-white">
                      Fokus Produk Promosi (Channel Products)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowProductModal(true)}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      + Tambah Produk Cepat
                    </button>
                  </div>
                  <select
                    value={videoConfig.selectedProductId}
                    onChange={(e) => handleVideoConfigChange("selectedProductId", e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none dark:text-white"
                  >
                    <option value="">-- Semua Produk / Tanpa Produk Spesifik --</option>
                    {channelProducts.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({prod.price > 0 ? `Rp ${prod.price.toLocaleString("id-ID")}` : "Gratis"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration Control: Preset Chips + Custom Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Target Durasi Video (Detik)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[15, 30, 45, 60, 90, 120, 180].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => handleVideoConfigChange("targetDurationSec", sec)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                          videoConfig.targetDurationSec === sec
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="5"
                        max="600"
                        value={videoConfig.targetDurationSec}
                        onChange={(e) =>
                          handleVideoConfigChange("targetDurationSec", parseInt(e.target.value, 10) || 0)
                        }
                        className="w-20 px-2 py-1 text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none dark:text-white"
                      />
                      <span className="text-xs text-zinc-500">detik</span>
                    </div>
                  </div>
                </div>

                {/* Precision Controls: Scene Count, Aspect Ratio, Speech Rate */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Target Jumlah Scene
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={videoConfig.targetSceneCount}
                      onChange={(e) =>
                        handleVideoConfigChange("targetSceneCount", parseInt(e.target.value, 10) || 1)
                      }
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Aspect Ratio Video
                    </label>
                    <select
                      value={videoConfig.aspectRatio}
                      onChange={(e) => handleVideoConfigChange("aspectRatio", e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    >
                      <option value="9:16">9:16 (Vertikal / Shorts / Reels)</option>
                      <option value="16:9">16:9 (Horizontal / YouTube)</option>
                      <option value="1:1">1:1 (Persegi / Feed)</option>
                      <option value="4:5">4:5 (Potret Post)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("speechRate")}
                    </label>
                    <select
                      value={videoConfig.speechRate}
                      onChange={(e) => handleVideoConfigChange("speechRate", e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    >
                      <option value="Lambat">Lambat (~110 kata/menit)</option>
                      <option value="Sedang">Sedang (~130 kata/menit)</option>
                      <option value="Cepat">Cepat (~160 kata/menit)</option>
                    </select>
                  </div>
                </div>

                {/* Hook Style & Ending Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("hookStyle")}
                    </label>
                    <select
                      value={videoConfig.hookStyle}
                      onChange={(e) => handleVideoConfigChange("hookStyle", e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    >
                      <option value="Pertanyaan Provokatif">{t("hookProvocative")}</option>
                      <option value="Fakta Mengejutkan">{t("hookSurprising")}</option>
                      <option value="Tantangan">{t("hookChallenge")}</option>
                      <option value="Negative Hook">{t("hookNegative")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("endingStyle")}
                    </label>
                    <select
                      value={videoConfig.endingStyle}
                      onChange={(e) => handleVideoConfigChange("endingStyle", e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    >
                      <option value="Pertanyaan Terbuka">{t("endingOpen")}</option>
                      <option value="Hard Sell CTA">{t("endingHardSell")}</option>
                      <option value="Ajakan Simpan/Share">{t("endingShare")}</option>
                    </select>
                  </div>
                </div>

                {/* Loop Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Gaya Narrative Loop
                    </label>
                    <select
                      value={videoConfig.narrativeLoopStyle}
                      onChange={(e) => handleVideoConfigChange("narrativeLoopStyle", e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    >
                      <option value="Tanpa Loop">Tanpa Loop (Standar)</option>
                      <option value="Seamless Loop">Seamless Loop (Ending menyambung ke Hook)</option>
                      <option value="Cliffhanger Loop">Cliffhanger Loop</option>
                      <option value="Call-to-Action Loop">Call-to-Action Loop</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Gaya Visual Loop
                    </label>
                    <select
                      value={videoConfig.visualLoopStyle}
                      onChange={(e) => handleVideoConfigChange("visualLoopStyle", e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    >
                      <option value="Tanpa Loop">Tanpa Loop (Standar)</option>
                      <option value="Match Cut Transition">Match Cut Transition</option>
                      <option value="Color Gradient Loop">Color Gradient Loop</option>
                      <option value="Zoom Transition">Zoom In/Out Transition</option>
                      <option value="Seamless Video Loop">Seamless Video Loop</option>
                    </select>
                  </div>
                </div>

                {/* Composition Sliders */}
                <CompositionSliderGroup
                  value={videoConfig.composition}
                  onChange={(val) => handleVideoConfigChange("composition", val)}
                />

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {t("additionalComponents")}
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={videoConfig.includeHook}
                        onChange={(e) => handleVideoConfigChange("includeHook", e.target.checked)}
                        className="rounded"
                      />
                      <span>{t("includeHook")}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={videoConfig.includeCTA}
                        onChange={(e) => handleVideoConfigChange("includeCTA", e.target.checked)}
                        className="rounded"
                      />
                      <span>{t("includeCTA")}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={videoConfig.includeCaption}
                        onChange={(e) => handleVideoConfigChange("includeCaption", e.target.checked)}
                        className="rounded"
                      />
                      <span>{t("socialCaption")}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={videoConfig.includeThumbnail}
                        onChange={(e) => handleVideoConfigChange("includeThumbnail", e.target.checked)}
                        className="rounded"
                      />
                      <span>{t("thumbnailIdea")}</span>
                    </label>
                    <label
                      className={`flex items-center space-x-2 col-span-2 ${
                        !planFeatures.htmlBlogExport ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={videoConfig.includeHtmlBlog}
                        disabled={!planFeatures.htmlBlogExport}
                        onChange={(e) => handleVideoConfigChange("includeHtmlBlog", e.target.checked)}
                        className="rounded"
                      />
                      <span>{t("htmlBlog")}</span>
                      {!planFeatures.htmlBlogExport && (
                        <span className="text-[10px] text-amber-500 font-semibold ml-1">🔒 Upgrade</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Image Specific Settings */}
            {type === "IMAGE" && (
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                  {t("imageSettings")}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("cameraType")}
                    </label>
                    <select
                      name="cameraType"
                      value={imageConfig.cameraType}
                      onChange={handleImageConfigChange}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    >
                      <option value="DSLR">DSLR</option>
                      <option value="Mirrorless">Mirrorless</option>
                      <option value="Drone">Drone</option>
                      <option value="Action Camera">Action Camera</option>
                      <option value="Smartphone">Smartphone</option>
                      <option value="Film Camera">Film Camera</option>
                      <option value="Polaroid">Polaroid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("shotType")}
                    </label>
                    <select
                      name="shotType"
                      value={imageConfig.shotType}
                      onChange={handleImageConfigChange}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    >
                      <option value="Close Up">Close Up</option>
                      <option value="Medium Shot">Medium Shot</option>
                      <option value="Wide Angle">Wide Angle</option>
                      <option value="Macro">Macro</option>
                      <option value="Bird Eye View">Bird Eye View</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("lighting")}
                    </label>
                    <select
                      name="lighting"
                      value={imageConfig.lighting}
                      onChange={handleImageConfigChange}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    >
                      <option value="Natural Light">Natural Light</option>
                      <option value="Studio Lighting">Studio Lighting</option>
                      <option value="Cinematic Lighting">Cinematic Lighting</option>
                      <option value="Neon/Cyberpunk">Neon/Cyberpunk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("mood")}
                    </label>
                    <input
                      type="text"
                      name="mood"
                      value={imageConfig.mood}
                      onChange={handleImageConfigChange}
                      placeholder="E.g., Dark, Cheerful, Eerie"
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("colorGrading")}
                    </label>
                    <input
                      type="text"
                      name="colorGrading"
                      value={imageConfig.colorGrading}
                      onChange={handleImageConfigChange}
                      placeholder="E.g., Teal & Orange, Pastel"
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("visualStyle")} (Pilih / Kustom)
                    </label>
                    <input
                      type="text"
                      list="visual-aesthetic-list"
                      name="visualStyle"
                      value={imageConfig.visualStyle}
                      onChange={handleImageConfigChange}
                      placeholder="Photorealistic, Anime..."
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    />
                    <datalist id="visual-aesthetic-list">
                      {visualAesthetics.map((v) => (
                        <option key={v.id} value={v.label} />
                      ))}
                    </datalist>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("negativePrompt")}
                    </label>
                    <input
                      type="text"
                      name="negativePrompt"
                      value={imageConfig.negativePrompt}
                      onChange={handleImageConfigChange}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Aspect Ratio
                    </label>
                    <select
                      name="aspectRatio"
                      value={imageConfig.aspectRatio}
                      onChange={handleImageConfigChange}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white mb-2"
                    >
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="9:16">9:16 (Portrait / Story)</option>
                      <option value="1:1">1:1 (Square)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("variations")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      name="variations"
                      value={imageConfig.variations}
                      onChange={handleImageConfigChange}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center mt-6"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin mr-2 border-2 border-white/20 border-t-white rounded-full w-5 h-5" />
                    {t("processing")}
                  </>
                ) : (
                  t("generateBtn")
                )}
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setGeneratedPrompt("");
                  setAiResultJson("");
                }}
                className="w-full py-3 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 font-medium rounded-lg shadow-sm transition-all mt-6"
              >
                {t("backToEdit")}
              </button>
            )}
          </fieldset>
        </form>
      </div>

      {/* Kolom Hasil */}
      <div className="glass-panel shadow-lg rounded-xl p-6 flex flex-col h-[85vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {step === 1 ? t("resultTitle") : t("resultAndSave")}
          </h2>
          {result && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              {result}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col space-y-4">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950">
              <div className="w-10 h-10 border-4 border-zinc-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="animate-pulse">{t("loadingMsg")}</p>
            </div>
          ) : step === 1 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm p-8 text-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950">
              {t("emptyResult")}
            </div>
          ) : (
            <>
              {/* Step 2: Show Prompt, ask for JSON */}
              <div className="flex flex-col h-1/2 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    {t("copyPromptStep")}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                    className="px-3 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-600 dark:hover:bg-zinc-600 transition-colors"
                  >
                    {t("copy")}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={generatedPrompt}
                  className="w-full h-full p-4 bg-transparent text-sm font-mono text-zinc-800 dark:text-zinc-200 outline-none resize-none custom-scrollbar"
                />
              </div>

              <div className="flex flex-col h-1/2 border border-blue-200 dark:border-blue-900 rounded-lg overflow-hidden bg-blue-50/30 dark:bg-blue-900/10">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-800">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                    {t("pasteJsonStep")}
                  </span>
                </div>
                <div className="px-4 py-2 border-b border-blue-200/50 dark:border-blue-800/50">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    {t("optionalTitle")}
                  </label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder={t("optionalTitlePlaceholder")}
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none dark:text-white"
                  />
                </div>
                <textarea
                  value={aiResultJson}
                  onChange={(e) => setAiResultJson(e.target.value)}
                  placeholder={t("jsonPlaceholder")}
                  className="w-full h-full p-4 bg-transparent text-sm font-mono text-zinc-800 dark:text-zinc-200 outline-none resize-none custom-scrollbar"
                />
              </div>
            </>
          )}
        </div>

        {step === 2 && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end space-x-3">
            <button
              onClick={() => router.push(`/${document.documentElement.lang || "id"}/dashboard/drafts`)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 transition-colors"
            >
              {t("viewDraftsBtn")}
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors flex items-center"
            >
              {saving ? (
                <span className="inline-block animate-spin mr-2 border-2 border-white/20 border-t-white rounded-full w-4 h-4" />
              ) : null}
              {t("saveDraftBtn")}
            </button>
          </div>
        )}
      </div>

      {/* Modal Quick Add Product */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">+ Tambah Produk Cepat</h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Contoh: E-Book Panduan Prompt AI"
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Harga Produk (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  placeholder="Penjelasan keunggulan produk..."
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Link Pembelian / Landing Page
                </label>
                <input
                  type="url"
                  value={newProductLink}
                  onChange={(e) => setNewProductLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingProduct}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md"
                >
                  {addingProduct ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
