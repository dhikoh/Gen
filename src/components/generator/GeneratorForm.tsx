"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function GeneratorForm({ channels }: { channels: any[] }) {
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

  // Video specific fields
  const [videoConfig, setVideoConfig] = useState({
    pov: "",
    targetPlatform: "TikTok",
    aspectRatio: "9:16",
    duration: "Short (< 30s)",
    speechRate: "Sedang",
    hookStyle: "Pertanyaan Provokatif",
    endingStyle: "Pertanyaan Terbuka",
    includeHook: true,
    includeCTA: true,
    includeCaption: true,
    includeThumbnail: true,
    includeHtmlBlog: false,
    compEdukasi: 40,
    compHiburan: 40,
    compMarketing: 20
  });

  // Image specific fields
  const [imageConfig, setImageConfig] = useState({
    cameraType: "DSLR",
    shotType: "Medium Shot",
    lighting: "Natural Light",
    mood: "Cinematic",
    colorGrading: "Teal and Orange",
    visualStyle: "Photorealistic",
    negativePrompt: "ugly, blurry, deformed, watermark",
    variations: 4
  });

  const handleVideoConfigChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setVideoConfig(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageConfigChange = (e: any) => {
    const { name, value, type } = e.target;
    setImageConfig(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
  };

  const validateComposition = () => {
    const total = Number(videoConfig.compEdukasi) + Number(videoConfig.compHiburan) + Number(videoConfig.compMarketing);
    return total === 100;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === "VIDEO" && !validateComposition()) {
      setError(t('compError'));
      return;
    }
    
    if (!channelId) {
      setError(t('channelError'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult("");

    try {
      const payload = {
        type,
        channelId,
        topic,
        additionalContext,
        videoConfig: type === "VIDEO" ? videoConfig : undefined,
        imageConfig: type === "IMAGE" ? imageConfig : undefined
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('generateError'));
      } else {
        const fullText = `${data.data.system_instruction}\n\n${data.data.master_prompt}`;
        setGeneratedPrompt(fullText);
        setStep(2);
      }
    } catch (err) {
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!aiResultJson.trim()) {
      setError("Silakan tempelkan hasil JSON dari AI terlebih dahulu.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let rateValue = 130;
      if (videoConfig.speechRate === "Lambat") rateValue = 110;
      if (videoConfig.speechRate === "Cepat") rateValue = 160;

      const payload: any = {
        channelId,
        type,
        topic,
        rawJson: aiResultJson,
        speechRate: rateValue
      };
      if (manualTitle.trim()) {
        payload.title = manualTitle;
      }

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menyimpan draft.");
      } else {
        setResult("Tersimpan di Drafts!");
        router.refresh();
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Kolom Form Input */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 sticky top-0 bg-white dark:bg-zinc-900 z-10 py-2 border-b border-zinc-100 dark:border-zinc-800">
          {t('paramTitle')}
        </h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate}>
          <fieldset disabled={loading || step === 2} className="space-y-6">
            
            {/* General Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('selectChannel')}</label>
                <select
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  required
                >
                  <option value="" disabled>{t('selectChannelPlaceholder')}</option>
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>{c.channelName} - {c.niche}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('promptType')}</label>
                <div className="flex space-x-4">
                  <label className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${type === 'VIDEO' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-zinc-200 dark:border-zinc-700'}`}>
                    <input type="radio" name="type" value="VIDEO" checked={type === 'VIDEO'} onChange={() => setType('VIDEO')} className="sr-only" />
                    <span>{t('videoScript')}</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${type === 'IMAGE' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-zinc-200 dark:border-zinc-700'}`}>
                    <input type="radio" name="type" value="IMAGE" checked={type === 'IMAGE'} onChange={() => setType('IMAGE')} className="sr-only" />
                    <span>{t('imagePrompt')}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('mainTopic')}</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  placeholder={t('mainTopicPlaceholder')}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('additionalContext')}</label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder={t('additionalContextPlaceholder')}
                  rows={2}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
                />
              </div>
            </div>

            {/* Video Specific Settings */}
            {type === "VIDEO" && (
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-5">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{t('videoSettings')}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('pov')}</label>
                    <input type="text" name="pov" value={videoConfig.pov} onChange={handleVideoConfigChange} placeholder="E.g., Ahli SEO, Mentor" className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('targetPlatform')}</label>
                    <select name="targetPlatform" value={videoConfig.targetPlatform} onChange={handleVideoConfigChange} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white">
                      <option value="TikTok">TikTok</option>
                      <option value="Instagram Reels">Instagram Reels</option>
                      <option value="YouTube Shorts">YouTube Shorts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('duration')}</label>
                    <select name="duration" value={videoConfig.duration} onChange={handleVideoConfigChange} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white">
                      <option value="Short (< 30s)">Pendek ({"<"} 30s)</option>
                      <option value="Medium (30s - 60s)">Sedang (30s - 60s)</option>
                      <option value="Long (> 60s)">Panjang ({">"} 60s)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('speechRate')}</label>
                    <select name="speechRate" value={videoConfig.speechRate} onChange={handleVideoConfigChange} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white">
                      <option value="Lambat">Lambat (Jelas & Tenang)</option>
                      <option value="Sedang">Sedang (Natural)</option>
                      <option value="Cepat">Cepat (Energik)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hookStyle')}</label>
                    <select name="hookStyle" value={videoConfig.hookStyle} onChange={handleVideoConfigChange} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white">
                      <option value="Pertanyaan Provokatif">Pertanyaan Provokatif</option>
                      <option value="Fakta Mengejutkan">Fakta Mengejutkan</option>
                      <option value="Tantangan">Tantangan</option>
                      <option value="Negative Hook">Negative Hook</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('endingStyle')}</label>
                    <select name="endingStyle" value={videoConfig.endingStyle} onChange={handleVideoConfigChange} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white">
                      <option value="Pertanyaan Terbuka">Pertanyaan Terbuka</option>
                      <option value="Hard Sell CTA">Hard Sell CTA</option>
                      <option value="Ajakan Simpan/Share">Ajakan Simpan/Share</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('composition')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500">{t('education')}</span>
                      <input type="number" name="compEdukasi" value={videoConfig.compEdukasi} onChange={handleVideoConfigChange} className="w-full px-2 py-1 text-sm border rounded" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">{t('entertainment')}</span>
                      <input type="number" name="compHiburan" value={videoConfig.compHiburan} onChange={handleVideoConfigChange} className="w-full px-2 py-1 text-sm border rounded" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">{t('marketing')}</span>
                      <input type="number" name="compMarketing" value={videoConfig.compMarketing} onChange={handleVideoConfigChange} className="w-full px-2 py-1 text-sm border rounded" />
                    </div>
                  </div>
                  {!validateComposition() && <p className="text-xs text-red-500 mt-1">{t('compError')} ({Number(videoConfig.compEdukasi) + Number(videoConfig.compHiburan) + Number(videoConfig.compMarketing)}%)</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('additionalComponents')}</label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="includeHook" checked={videoConfig.includeHook} onChange={handleVideoConfigChange} className="rounded" />
                      <span>{t('includeHook')}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="includeCTA" checked={videoConfig.includeCTA} onChange={handleVideoConfigChange} className="rounded" />
                      <span>{t('includeCTA')}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="includeCaption" checked={videoConfig.includeCaption} onChange={handleVideoConfigChange} className="rounded" />
                      <span>{t('socialCaption')}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="includeThumbnail" checked={videoConfig.includeThumbnail} onChange={handleVideoConfigChange} className="rounded" />
                      <span>{t('thumbnailIdea')}</span>
                    </label>
                    <label className="flex items-center space-x-2 col-span-2">
                      <input type="checkbox" name="includeHtmlBlog" checked={videoConfig.includeHtmlBlog} onChange={handleVideoConfigChange} className="rounded" />
                      <span>{t('htmlBlog')}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Image Specific Settings */}
            {type === "IMAGE" && (
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{t('imageSettings')}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('cameraType')}</label>
                    <input type="text" name="cameraType" value={imageConfig.cameraType} onChange={handleImageConfigChange} placeholder="E.g., DSLR 50mm, Drone" className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('shotType')}</label>
                    <select name="shotType" value={imageConfig.shotType} onChange={handleImageConfigChange} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white">
                      <option value="Close Up">Close Up</option>
                      <option value="Medium Shot">Medium Shot</option>
                      <option value="Wide Angle">Wide Angle</option>
                      <option value="Macro">Macro</option>
                      <option value="Bird Eye View">Bird Eye View</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('lighting')}</label>
                    <select name="lighting" value={imageConfig.lighting} onChange={handleImageConfigChange} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white">
                      <option value="Natural Light">Natural Light</option>
                      <option value="Studio Lighting">Studio Lighting</option>
                      <option value="Cinematic Lighting">Cinematic Lighting</option>
                      <option value="Neon/Cyberpunk">Neon/Cyberpunk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('mood')}</label>
                    <input type="text" name="mood" value={imageConfig.mood} onChange={handleImageConfigChange} placeholder="E.g., Dark, Cheerful, Eerie" className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('colorGrading')}</label>
                    <input type="text" name="colorGrading" value={imageConfig.colorGrading} onChange={handleImageConfigChange} placeholder="E.g., Teal & Orange, Pastel" className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('visualStyle')}</label>
                    <select name="visualStyle" value={imageConfig.visualStyle} onChange={handleImageConfigChange} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white">
                      <option value="Photorealistic">Photorealistic</option>
                      <option value="Anime/Manga">Anime/Manga</option>
                      <option value="3D Render/Unreal Engine">3D Render/Unreal Engine</option>
                      <option value="Oil Painting">Oil Painting</option>
                      <option value="Cyberpunk Art">Cyberpunk Art</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('negativePrompt')}</label>
                    <input type="text" name="negativePrompt" value={imageConfig.negativePrompt} onChange={handleImageConfigChange} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('variations')}</label>
                    <input type="number" min="1" max="5" name="variations" value={imageConfig.variations} onChange={handleImageConfigChange} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white" />
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
                    {t('processing')}
                  </>
                ) : (
                  t('generateBtn')
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
                Kembali Edit Konfigurasi
              </button>
            )}
          </fieldset>
        </form>
      </div>

      {/* Kolom Hasil */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col h-[85vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{step === 1 ? t('resultTitle') : "Hasil & Simpan Draft"}</h2>
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
              <p className="animate-pulse">{t('loadingMsg')}</p>
            </div>
          ) : step === 1 ? (
             <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm p-8 text-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950">
               {t('emptyResult')}
             </div>
          ) : (
            <>
              {/* Step 2: Show Prompt, ask for JSON */}
              <div className="flex flex-col h-1/2 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">1. Copy Prompt Ini</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                    className="px-3 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-600 dark:hover:bg-zinc-600 transition-colors"
                  >
                    Copy
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
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">2. Paste Output JSON di Sini</span>
                </div>
                <div className="px-4 py-2 border-b border-blue-200/50 dark:border-blue-800/50">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Judul Spesifik (Opsional)</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Judul draft akan diambil dari JSON jika ini dikosongkan"
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none dark:text-white"
                  />
                </div>
                <textarea
                  value={aiResultJson}
                  onChange={(e) => setAiResultJson(e.target.value)}
                  placeholder={`Tempel hasil balasan dari ChatGPT/Claude di sini...\nPastikan Anda menyalin SELURUH balasan JSON-nya.`}
                  className="w-full h-full p-4 bg-transparent text-sm font-mono text-zinc-800 dark:text-zinc-200 outline-none resize-none custom-scrollbar"
                />
              </div>
            </>
          )}
        </div>

        {step === 2 && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end space-x-3">
            <button 
              onClick={() => router.push(`/${document.documentElement.lang || 'id'}/dashboard/drafts`)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 transition-colors"
            >
              Lihat Drafts
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors flex items-center"
            >
              {saving ? <span className="inline-block animate-spin mr-2 border-2 border-white/20 border-t-white rounded-full w-4 h-4" /> : null}
              Simpan Draft (Hitung Durasi)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
