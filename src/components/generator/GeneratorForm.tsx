"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import CompositionSliderGroup from "./CompositionSliderGroup";
import { PresetSelect, PresetOption } from "@/components/ui/PresetSelect";
import { getVisualStyleOptions } from "@/lib/visualStyleMap";

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

interface GeneratorFormChannel {
 id: string;
 channelName: string;
 niche?: string | null;
 targetPlatform?: string | null;
 personaPov?: string | null;
 speechRate?: number | null;
 visualAesthetic?: string | null;
 audioBGM?: boolean | null;
 audioSFX?: boolean | null;
 audioVO?: boolean | null;
}

interface PromptSettingsDto {
 defaultNegativePrompt?: string | null;
}

interface GeneratorFormProps {
 channels: GeneratorFormChannel[];
 promptSettings?: PromptSettingsDto | null;
 planFeatures?: {
 imagePromptStudio?: boolean;
 htmlBlogExport?: boolean;
 cameraMovementPro?: boolean; // PRO tier camera movement
 };
}

export default function GeneratorForm({
 channels,
 promptSettings,
 planFeatures = { imagePromptStudio: true, htmlBlogExport: true, cameraMovementPro: false }
}: GeneratorFormProps) {
 const router = useRouter();
 const t = useTranslations("Generator");

 const [type, setType] = useState<"VIDEO" | "IMAGE">("VIDEO");
 const [channelId, setChannelId] = useState(channels.length > 0 ? channels[0].id : "");
 const [topic, setTopic] = useState("");
 const [outputLanguage, setOutputLanguage] = useState("Indonesian");
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
 const [platformOptions, setPlatformOptions] = useState<PresetOption[]>([]);
 const [personaPresets, setPersonaPresets] = useState<PresetOption[]>([]);
 const [visualAesthetics, setVisualAesthetics] = useState<PresetOption[]>([]);
 const [channelProducts, setChannelProducts] = useState<ProductItem[]>([]);

 // Push-ported enrichment state
 const [rolePOV, setRolePOV] = useState<string>("default");
 const [toneOfVoice, setToneOfVoice] = useState<string>("");
 const [visualStyleKey, setVisualStyleKey] = useState<string>("");
 const [hookStyleType, setHookStyleType] = useState<string>("auto");
 const [customHookText, setCustomHookText] = useState<string>("");
 const [musicPreference, setMusicPreference] = useState<boolean>(true);
 const [sfxPreference, setSfxPreference] = useState<boolean>(true);
 const [voPreference, setVoPreference] = useState<boolean>(true);

 // Camera Movement state
 const [cameraMovementEnabled, setCameraMovementEnabled] = useState<boolean>(true);
 const [cameraMovementPresets, setCameraMovementPresets] = useState<string[]>([]);
 const [cameraMovementCustom, setCameraMovementCustom] = useState<string>("");
 const [cameraMovementProMode, setCameraMovementProMode] = useState<boolean>(false); // Opsi B: PRO auto toggle

 // Visual style options (from visualStyleMap)
 const visualStyleOptions: PresetOption[] = [
 { value: "", label: "Auto (Ikuti Estetika Channel)" },
 ...getVisualStyleOptions().map(o => ({ value: o.value, label: o.label }))
 ];

 const toneOptions = [
 "Kasual & Santai", "Profesional & Formal", "Energik & Antusias",
 "Empatik & Hangat", "Tegas & Otoritatif", "Humoris & Playful",
 "Inspiratif & Motivasional", "Dramatis & Sinematik", "Minimalis & To-The-Point"
 ];

 // Camera movement preset options grouped by category
 const CAMERA_MOVEMENT_CATEGORIES = [
 {
 category: "📹 Pergerakan Dasar",
 items: [
 { value: "static shot", label: "Static Shot" },
 { value: "slow push-in", label: "Slow Push-In" },
 { value: "slow pull-out", label: "Slow Pull-Out" },
 { value: "pan left", label: "Pan Left" },
 { value: "pan right", label: "Pan Right" },
 { value: "tilt up", label: "Tilt Up" },
 { value: "tilt down", label: "Tilt Down" },
 ],
 },
 {
 category: "🎬 Gerakan Sinematik",
 items: [
 { value: "slow zoom in", label: "Slow Zoom In" },
 { value: "slow zoom out", label: "Slow Zoom Out" },
 { value: "dolly zoom (Vertigo effect)", label: "Dolly Zoom (Vertigo)" },
 { value: "crane up and wide reveal", label: "Crane Up & Wide Reveal" },
 { value: "crane down and tilt up", label: "Crane Down & Tilt Up" },
 { value: "Dutch angle (tilted camera)", label: "Dutch Angle (Tilted)" },
 { value: "handheld shaky motion", label: "Handheld / Shaky" },
 ],
 },
 {
 category: "🌀 Gerakan Dinamis",
 items: [
 { value: "sweeping orbital shot", label: "Sweeping Orbital" },
 { value: "360-degree spin", label: "360° Spin" },
 { value: "tracking shot following subject", label: "Tracking Shot" },
 { value: "whip pan transition", label: "Whip Pan" },
 { value: "roll rotation", label: "Roll Rotation" },
 { value: "arc shot circling subject", label: "Arc Shot" },
 ],
 },
 {
 category: "🚁 Aerial & Drone",
 items: [
 { value: "aerial drone high-altitude bird's eye view", label: "Bird's Eye View" },
 { value: "drone reveal from low to high", label: "Drone Low-to-High Reveal" },
 { value: "overhead top-down flat lay shot", label: "Top-Down Flat Lay" },
 { value: "drone follow chase shot", label: "Drone Follow / Chase" },
 ],
 },
 {
 category: "🔬 Khusus & Sinematif",
 items: [
 { value: "extreme slow motion", label: "Extreme Slow Motion" },
 { value: "time-lapse fast-forward", label: "Time-Lapse" },
 { value: "macro close-up with shallow depth of field", label: "Macro Close-Up" },
 { value: "split-screen parallel movement", label: "Split-Screen" },
 { value: "first-person POV moving through scene", label: "First-Person POV" },
 { value: "underwater flowing camera glide", label: "Underwater Glide" },
 { value: "smooth gliding gimbal shot", label: "Smooth Gimbal Glide" },
 ],
 },
 ];
 const ALL_CAMERA_PRESETS = CAMERA_MOVEMENT_CATEGORIES.flatMap(c => c.items);

 // Quick Add Product Modal state
 const [showProductModal, setShowProductModal] = useState(false);
 const [newProductName, setNewProductName] = useState("");
 const [newProductDesc, setNewProductDesc] = useState("");
 const [newProductPrice, setNewProductPrice] = useState("0");
 const [newProductLink, setNewProductLink] = useState("");
 const [addingProduct, setAddingProduct] = useState(false);

 const speechRateOptions: PresetOption[] = [
 { value: 0.25, label: "0.25 s/kata (Super Fast)" },
 { value: 0.30, label: "0.30 s/kata (Cepat)" },
 { value: 0.35, label: "0.35 s/kata (Normal / Standard)" },
 { value: 0.40, label: "0.40 s/kata (Santai)" },
 { value: 0.50, label: "0.50 s/kata (Lambat)" },
 ];

 // Video specific fields
 const [videoConfig, setVideoConfig] = useState({
 pov: "Expert Storyteller (Edukasi & Inspirasi)",
 targetPlatform: "TikTok",
 aspectRatio: "9:16",
 targetDurationSec: 60,
 targetSceneCount: 6,
 speechRate: 0.35,
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
 visualStyle: "Cinematic Dark Mode (Sleek & Professional)",
 negativePrompt: promptSettings?.defaultNegativePrompt || "ugly, blurry, deformed, watermark",
 variations: 4,
 aspectRatio: "16:9"
 });

 // Server-Side Sync & LocalStorage Persistence
 useEffect(() => {
 // 1. Local Storage load
 const saved = localStorage.getItem("generatorFormState");
 if (saved) {
 try {
 const p = JSON.parse(saved);
 if (p.type) setType(p.type);
 if (p.channelId) setChannelId(p.channelId);
 if (p.outputLanguage) setOutputLanguage(p.outputLanguage);
 if (p.topic) setTopic(p.topic);
 if (p.additionalContext) setAdditionalContext(p.additionalContext);
 if (p.rolePOV) setRolePOV(p.rolePOV);
 if (p.toneOfVoice !== undefined) setToneOfVoice(p.toneOfVoice);
 if (p.visualStyleKey !== undefined) setVisualStyleKey(p.visualStyleKey);
 if (p.hookStyleType) setHookStyleType(p.hookStyleType);
 if (p.customHookText !== undefined) setCustomHookText(p.customHookText);
 if (p.musicPreference !== undefined) setMusicPreference(p.musicPreference);
 if (p.sfxPreference !== undefined) setSfxPreference(p.sfxPreference);
 if (p.voPreference !== undefined) setVoPreference(p.voPreference);
 if (p.cameraMovementEnabled !== undefined) setCameraMovementEnabled(p.cameraMovementEnabled);
 if (p.cameraMovementPresets !== undefined) setCameraMovementPresets(p.cameraMovementPresets);
 if (p.cameraMovementCustom !== undefined) setCameraMovementCustom(p.cameraMovementCustom);
 if (p.cameraMovementProMode !== undefined) setCameraMovementProMode(p.cameraMovementProMode);
 if (p.videoConfig) setVideoConfig(prev => ({ ...prev, ...p.videoConfig }));
 if (p.imageConfig) setImageConfig(prev => ({ ...prev, ...p.imageConfig }));
 } catch (e) {}
 }

 // 2. Server load (overrides local)
 fetch("/api/user/preferences")
 .then(res => res.json())
 .then(data => {
 if (data.success && data.generatorPreferences?.generatorFormState) {
 const p = data.generatorPreferences.generatorFormState;
 if (p.type) setType(p.type);
 if (p.channelId) setChannelId(p.channelId);
 if (p.outputLanguage) setOutputLanguage(p.outputLanguage);
 if (p.topic) setTopic(p.topic);
 if (p.additionalContext) setAdditionalContext(p.additionalContext);
 if (p.rolePOV) setRolePOV(p.rolePOV);
 if (p.toneOfVoice !== undefined) setToneOfVoice(p.toneOfVoice);
 if (p.visualStyleKey !== undefined) setVisualStyleKey(p.visualStyleKey);
 if (p.hookStyleType) setHookStyleType(p.hookStyleType);
 if (p.customHookText !== undefined) setCustomHookText(p.customHookText);
 if (p.musicPreference !== undefined) setMusicPreference(p.musicPreference);
 if (p.sfxPreference !== undefined) setSfxPreference(p.sfxPreference);
 if (p.voPreference !== undefined) setVoPreference(p.voPreference);
 if (p.cameraMovementEnabled !== undefined) setCameraMovementEnabled(p.cameraMovementEnabled);
 if (p.cameraMovementPresets !== undefined) setCameraMovementPresets(p.cameraMovementPresets);
 if (p.cameraMovementCustom !== undefined) setCameraMovementCustom(p.cameraMovementCustom);
 if (p.cameraMovementProMode !== undefined) setCameraMovementProMode(p.cameraMovementProMode);
 if (p.videoConfig) setVideoConfig(prev => ({ ...prev, ...p.videoConfig }));
 if (p.imageConfig) setImageConfig(prev => ({ ...prev, ...p.imageConfig }));
 }
 })
 .catch(() => {});

 // 3. Also restore result state from local cache
 const savedResult = localStorage.getItem("generatorFormState");
 if (savedResult) {
 try {
 const p = JSON.parse(savedResult);
 if (p.step) setStep(p.step as 1 | 2);
 if (p.generatedPrompt) setGeneratedPrompt(p.generatedPrompt);
 if (p.aiResultJson) setAiResultJson(p.aiResultJson);
 if (p.manualTitle !== undefined) setManualTitle(p.manualTitle);
 } catch (e) {}
 }
 }, []);

 useEffect(() => {
 const stateObj = { type, channelId, outputLanguage, topic, additionalContext, rolePOV, toneOfVoice, visualStyleKey, hookStyleType, customHookText, musicPreference, sfxPreference, voPreference, cameraMovementEnabled, cameraMovementPresets, cameraMovementCustom, cameraMovementProMode, videoConfig, imageConfig, step, generatedPrompt, aiResultJson, manualTitle };
 localStorage.setItem("generatorFormState", JSON.stringify(stateObj));

 const timeoutId = setTimeout(() => {
 fetch("/api/user/preferences", {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ generatorFormState: stateObj }),
 }).catch(() => {});
 }, 3000); // 3 seconds debounce

 return () => clearTimeout(timeoutId);
 }, [type, channelId, outputLanguage, topic, additionalContext, rolePOV, toneOfVoice, visualStyleKey, hookStyleType, customHookText, musicPreference, sfxPreference, voPreference, cameraMovementEnabled, cameraMovementPresets, cameraMovementCustom, cameraMovementProMode, videoConfig, imageConfig, step, generatedPrompt, aiResultJson, manualTitle]);

 // Fetch presets on mount
 useEffect(() => {
 fetch("/api/platform-options")
 .then((res) => res.json())
 .then((d) => {
 if (d.success && d.options) {
 setPlatformOptions(
 d.options.map((opt: { label: string }) => ({ value: opt.label, label: opt.label }))
 );
 }
 })
 .catch(() => {});

 fetch("/api/persona-presets")
 .then((res) => res.json())
 .then((d) => {
 if (d.success && d.presets) {
 setPersonaPresets(
 d.presets.map((p: { label: string }) => ({ value: p.label, label: p.label }))
 );
 }
 })
 .catch(() => {});

 fetch("/api/visual-aesthetic-presets")
 .then((res) => res.json())
 .then((d) => {
 if (d.success && d.presets) {
 setVisualAesthetics(
 d.presets.map((v: { label: string }) => ({ value: v.label, label: v.label }))
 );
 }
 })
 .catch(() => {});
 }, []);

 // Synchronize channel settings into form configs when channel selection changes
 useEffect(() => {
 if (!channelId) return;
 const selectedChannel = channels.find((c: GeneratorFormChannel) => c.id === channelId);
 if (selectedChannel) {
 setVideoConfig((prev) => ({
 ...prev,
 targetPlatform: selectedChannel.targetPlatform || prev.targetPlatform || "TikTok",
 pov: selectedChannel.personaPov || prev.pov || "Expert Storyteller (Edukasi & Inspirasi)",
 speechRate: selectedChannel.speechRate ?? prev.speechRate ?? 0.35,
 }));
 setImageConfig((prev) => ({
 ...prev,
 visualStyle: selectedChannel.visualAesthetic || prev.visualStyle || "Cinematic Dark Mode (Sleek & Professional)",
 }));
 }
 }, [channelId, channels]);

 // Sync audio prefs from channel defaults when channel changes
 useEffect(() => {
 if (!channelId) return;
 const ch = channels.find((c: GeneratorFormChannel) => c.id === channelId);
 if (ch) {
 setMusicPreference(ch.audioBGM !== false);
 setSfxPreference(ch.audioSFX !== false);
 setVoPreference(ch.audioVO !== false);
 }
 }, [channelId, channels]);

 // Fetch channel products when channelId changes
 useEffect(() => {
 if (!channelId) {
 setChannelProducts([]);
 return;
 }
 fetch(`/api/channels/${channelId}/products`)
 .then((res) => res.json())
 .then((d) => {
 if (d.products) {
 setChannelProducts(d.products);
 }
 })
 .catch(() => {});
 }, [channelId]);

 const handleVideoConfigChange = (key: string, value: unknown) => {
 setVideoConfig((prev) => ({ ...prev, [key]: value }));
 };

 const handleImageConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 const { name, value } = e.target;
 setImageConfig((prev) => ({ ...prev, [name]: value }));
 };

 const handleAddProduct = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!channelId) {
 toast.error(t("selectChannelFirst"));
 return;
 }
 if (!newProductName.trim()) {
 toast.error(t("productNameRequired"));
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
 if (!res.ok) throw new Error(data.error || t("productAddFail"));

 toast.success(t("productAddSuccess"));
 setChannelProducts((prev) => [data.product, ...prev]);
 setVideoConfig((prev) => ({ ...prev, selectedProductId: data.product.id }));
 setShowProductModal(false);
 setNewProductName("");
 setNewProductDesc("");
 setNewProductPrice("0");
 setNewProductLink("");
 } catch (err: unknown) {
 const error = err as Error;
 toast.error(error.message || t("systemError"));

 } finally {
 setAddingProduct(false);
 }
 };

 const handleGenerate = async (e?: React.FormEvent) => {
 if (e) e.preventDefault();
 if (!channelId) {
 setError(t("channelError"));
 return;
 }

 setLoading(true);
 setError(null);
 setResult("");
 setManualTitle("");

 const selectedChannel = channels.find((c) => c.id === channelId);
 const effectiveTopic = topic.trim() ? topic.trim() : (selectedChannel?.niche || "Topik Umum");

 try {
 const payload = {
 type,
 channelId,
 outputLanguage,
 topic: effectiveTopic,
 additionalContext,
 videoConfig: type === "VIDEO" ? {
 ...videoConfig,
 socialCaption: videoConfig.includeCaption,
 thumbnailIdea: videoConfig.includeThumbnail,
 htmlBlog: videoConfig.includeHtmlBlog,
 // Push enrichment params
 rolePOV,
 toneOfVoice: toneOfVoice || undefined,
 visualStyle: visualStyleKey || undefined,
 hookStyleType,
 customHookText: hookStyleType === "custom" ? customHookText : undefined,
 isLoopable: videoConfig.narrativeLoopStyle === "Seamless Loop",
 isVideoLoop: videoConfig.visualLoopStyle === "Seamless Video Loop",
 musicPreference,
 sfxPreference,
 voPreference,
 cameraMovementEnabled,
 cameraMovementPresets: (cameraMovementEnabled && !cameraMovementProMode) ? cameraMovementPresets : [],
 cameraMovementCustom: (cameraMovementEnabled && !cameraMovementProMode) ? cameraMovementCustom : undefined,
 cameraMovementProMode: cameraMovementEnabled ? cameraMovementProMode : false,
 isVideoPlatform: selectedChannel?.targetPlatform ? !/blog|podcast|article|web/i.test(selectedChannel.targetPlatform) : true,
 } : undefined,
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
 const rateValue = Number(videoConfig.speechRate) || 0.35;
 const selectedChannel = channels.find((c) => c.id === channelId);
 const effectiveTopic = topic.trim() ? topic.trim() : (selectedChannel?.niche || "Topik Umum");

 const payload: Record<string, unknown> = {
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

 if (res.ok) {
 setResult(t("draftSavedSuccess"));
 toast.success(t("draftSavedSuccess"));
 router.push(`/${document.documentElement.lang || "id"}/dashboard/drafts`);
 } else {
 setError(data.error || t("saveDraftFail"));
 }
 } catch (err) {
 setError(t("serverError"));
 } finally {
 setSaving(false);
 }
 };

 const downloadJsonPrompt = () => {
 let jsonString = aiResultJson;

 if (!jsonString || !jsonString.trim()) {
 try {
 jsonString = JSON.stringify(
 {
 topic: topic || "Prompt Result",
 type: type,
 prompt: generatedPrompt,
 createdAt: new Date().toISOString(),
 },
 null,
 2
 );
 } catch (e) {
 jsonString = generatedPrompt;
 }
 } else {
 // Validate JSON formatting
 try {
 const parsed = JSON.parse(jsonString);
 jsonString = JSON.stringify(parsed, null, 2);
 } catch (e) {
 // Keep raw text
 }
 }

 const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 const safeTopic = (topic || "prompt").replace(/[^a-z0-9]/gi, "_").toLowerCase();
 link.href = url;
 link.download = `prompt_${safeTopic}_${Date.now()}.json`;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(url);
 toast.success(t("downloadPromptSuccess"));
 };

 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Kolom Form Input */}
 <div className="glass-panel shadow-lg rounded-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
 <h2 className="text-xl font-bold pg-text-heading mb-6 sticky top-0 pg-surface z-10 py-2 border-b pg-border">
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
 <label className="block text-sm font-medium pg-text-sub mb-2">
 {t("selectChannel")}
 </label>
 <select
 value={channelId}
 onChange={(e) => setChannelId(e.target.value)}
 className="w-full px-4 py-2 bg-white border pg-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
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
 <label className="block text-sm font-medium pg-text-sub mb-2">
 {t("promptType")}
 </label>
 <div className="flex space-x-4">
 <label
 className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
 type === "VIDEO"
 ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
 : "pg-border"
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
 ? "opacity-50 cursor-not-allowed pg-border pg-surface-dim /50"
 : type === "IMAGE"
 ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 cursor-pointer"
 : "pg-border cursor-pointer"
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
 <label className="block text-sm font-medium pg-text-sub mb-2">
 {t("mainTopic")}{" "}
 <span className="text-xs pg-text-muted font-normal">
 {t("optionalNicheChannel")}
 </span>
 </label>
 <input
 type="text"
 value={topic}
 onChange={(e) => setTopic(e.target.value)}
 placeholder={t("mainTopicPlaceholder")}
 className="w-full px-4 py-2 bg-white border pg-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
 />
 </div>

 <div className="w-full">
 <PresetSelect
 label={t("outputLanguage")}
 value={outputLanguage}
 onChange={(val) => setOutputLanguage(String(val))}
 options={[
 { value: "Indonesian", label: "Indonesian" },
 { value: "English", label: "English" },
 ]}
 placeholder={t("outputLanguagePlaceholder")}
 />
 </div>

 <div>
 <label className="block text-sm font-medium pg-text-sub mb-2">
 {t("additionalContext")}
 </label>
 <textarea
 value={additionalContext}
 onChange={(e) => setAdditionalContext(e.target.value)}
 placeholder={t("additionalContextPlaceholder")}
 rows={2}
 className="w-full px-4 py-2 bg-white border pg-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
 />
 </div>
 </div>

 {/* Video Specific Settings */}
 {type === "VIDEO" && (
 <div className="pt-4 border-t pg-border space-y-5">
 <h3 className="font-semibold pg-text-heading mb-2">
 {t("videoSettings")} & Presisi Presets
 </h3>

 {/* Platform & Persona PresetSelect */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <PresetSelect
 label="Target Platform"
 value={videoConfig.targetPlatform}
 onChange={(val) => handleVideoConfigChange("targetPlatform", val)}
 options={platformOptions.length > 0 ? platformOptions : [
 { value: "TikTok", label: "TikTok" },
 { value: "Instagram Reels", label: "Instagram Reels" },
 { value: "YouTube Shorts", label: "YouTube Shorts" },
 { value: "YouTube Long", label: "YouTube Long" },
 ]}
 placeholder={t("customPlatformPlaceholder")}
 />

 <PresetSelect
 label="Persona & POV Kreator"
 value={videoConfig.pov}
 onChange={(val) => handleVideoConfigChange("pov", val)}
 options={personaPresets.length > 0 ? personaPresets : [
 { value: "Expert Storyteller (Edukasi & Inspirasi)", label: "Expert Storyteller (Edukasi & Inspirasi)" },
 { value: "Energetic Reviewer (Review Produk)", label: "Energetic Reviewer (Review Produk)" },
 { value: "Casual Friend (Santai & Relatable)", label: "Casual Friend (Santai & Relatable)" },
 ]}
 placeholder={t("customPersonaPlaceholder")}
 />
 </div>

 {/* Product Selection Section */}
 <div className="pg-surface-dim /40 p-3.5 rounded-xl border pg-border space-y-2">
 <div className="flex items-center justify-between">
 <label className="block text-xs font-semibold pg-text-heading">
 Fokus Produk Promosi (Channel Products)
 </label>
 <button
 type="button"
 onClick={() => setShowProductModal(true)}
 className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
 >
 {t("quickAddProductTitle")}
 </button>
 </div>
 <select
 value={videoConfig.selectedProductId}
 onChange={(e) => handleVideoConfigChange("selectedProductId", e.target.value)}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md outline-none dark:text-white"
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
 <label className="block text-xs font-medium pg-text-sub">
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
 : "pg-surface pg-text-sub pg-border hover:neu-flat"
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
 className="w-20 px-2 py-1 text-xs bg-white border pg-border rounded-md outline-none dark:text-white"
 />
 <span className="text-xs pg-text-muted">detik</span>
 </div>
 </div>
 </div>

 {/* Precision Controls: Scene Count, Aspect Ratio, Speech Rate */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
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
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 />
 </div>

 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 Aspect Ratio Video
 </label>
 <select
 value={videoConfig.aspectRatio}
 onChange={(e) => handleVideoConfigChange("aspectRatio", e.target.value)}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 >
 <option value="9:16">9:16 (Vertikal / Shorts / Reels)</option>
 <option value="16:9">16:9 (Horizontal / YouTube)</option>
 <option value="1:1">1:1 (Persegi / Feed)</option>
 <option value="4:5">4:5 (Potret Post)</option>
 </select>
 </div>

 <PresetSelect
 label="Speech Rate"
 value={videoConfig.speechRate}
 onChange={(val) => handleVideoConfigChange("speechRate", val)}
 options={speechRateOptions}
 type="number"
 step="0.01"
 min={0.1}
 max={1.0}
 placeholder="Detik/kata (e.g. 0.35)"
 helpText="Kecepatan kata (s/kata)"
 />
 </div>

 {/* Hook Style & Ending Style */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("hookStyle")}
 </label>
 <select
 value={videoConfig.hookStyle}
 onChange={(e) => handleVideoConfigChange("hookStyle", e.target.value)}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 >
 <option value="Pertanyaan Provokatif">{t("hookProvocative")}</option>
 <option value="Fakta Mengejutkan">{t("hookSurprising")}</option>
 <option value="Tantangan">{t("hookChallenge")}</option>
 <option value="Negative Hook">{t("hookNegative")}</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("endingStyle")}
 </label>
 <select
 value={videoConfig.endingStyle}
 onChange={(e) => handleVideoConfigChange("endingStyle", e.target.value)}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 <label className="block text-xs font-medium pg-text-sub mb-1">
 Gaya Narrative Loop
 </label>
 <select
 value={videoConfig.narrativeLoopStyle}
 onChange={(e) => handleVideoConfigChange("narrativeLoopStyle", e.target.value)}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 >
 <option value="Tanpa Loop">Tanpa Loop (Standar)</option>
 <option value="Seamless Loop">Seamless Loop (Ending menyambung ke Hook)</option>
 <option value="Cliffhanger Loop">Cliffhanger Loop</option>
 <option value="Call-to-Action Loop">Call-to-Action Loop</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 Gaya Visual Loop
 </label>
 <select
 value={videoConfig.visualLoopStyle}
 onChange={(e) => handleVideoConfigChange("visualLoopStyle", e.target.value)}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 >
 <option value="Tanpa Loop">Tanpa Loop (Standar)</option>
 <option value="Match Cut Transition">Match Cut Transition</option>
 <option value="Color Gradient Loop">Color Gradient Loop</option>
 <option value="Zoom Transition">Zoom In/Out Transition</option>
 <option value="Seamless Video Loop">Seamless Video Loop</option>
 </select>
 </div>
 </div>

 {/* ── Push Enrichment: Role/POV AI ── */}
 <div className="space-y-2 pt-2 border-t pg-border">
 <label className="block text-xs font-semibold pg-text-sub">
 🎭 Role & POV AI
 </label>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
 {[
 { value: "default", label: "Auto", desc: "Ikuti channel profile" },
 { value: "KONTEN_KREATOR", label: "Kreator", desc: "Influencer personal brand" },
 { value: "MARKETING", label: "Marketing", desc: "Copywriter persuasif" },
 { value: "PEBISNIS", label: "Pebisnis", desc: "Founder/brand story" },
 { value: "PENDIDIK", label: "Pendidik", desc: "Guru/ahli teknis" },
 { value: "STORYTELLER", label: "Storyteller", desc: "Sinematik & naratif" },
 ].map((role) => (
 <button
 key={role.value}
 type="button"
 onClick={() => setRolePOV(role.value)}
 className={`flex flex-col items-start px-3 py-2 text-left border rounded-lg transition-colors text-xs ${
 rolePOV === role.value
 ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
 : "pg-border hover:pg-surface-dim"
 }`}
 >
 <span className="font-semibold">{role.label}</span>
 <span className="text-[10px] pg-text-muted mt-0.5">{role.desc}</span>
 </button>
 ))}
 </div>
 </div>

 {/* ── Push Enrichment: Visual Style Preset ── */}
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 🎨 Visual Style Preset
 </label>
 <select
 value={visualStyleKey}
 onChange={(e) => setVisualStyleKey(e.target.value)}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 >
 {visualStyleOptions.map((opt) => (
 <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
 ))}
 </select>
 </div>

 {/* ── Push Enrichment: Tone of Voice ── */}
 <div className="space-y-2">
 <label className="block text-xs font-medium pg-text-sub">
 🎙️ Tone of Voice
 </label>
 <div className="flex flex-wrap gap-1.5">
 <button
 type="button"
 onClick={() => setToneOfVoice("")}
 className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
 toneOfVoice === ""
 ? "bg-blue-600 text-white border-blue-600"
 : "pg-surface pg-border pg-text-sub"
 }`}
 >
 Auto
 </button>
 {toneOptions.map((tone) => (
 <button
 key={tone}
 type="button"
 onClick={() => setToneOfVoice(toneOfVoice === tone ? "" : tone)}
 className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
 toneOfVoice === tone
 ? "bg-blue-600 text-white border-blue-600"
 : "pg-surface pg-border pg-text-sub hover:neu-flat"
 }`}
 >
 {tone}
 </button>
 ))}
 </div>
 </div>

 {/* ── Push Enrichment: Audio Preferences ── */}
 <div className="space-y-2 pt-2 border-t pg-border">
 <label className="block text-xs font-semibold pg-text-sub">
 🔊 Audio Preferences
 </label>
 <div className="grid grid-cols-3 gap-2">
 {[
 { label: "BGM / Musik", state: musicPreference, setter: setMusicPreference },
 { label: "SFX / Efek", state: sfxPreference, setter: setSfxPreference },
 { label: "Voice Over", state: voPreference, setter: setVoPreference },
 ].map(({ label: lbl, state, setter }) => (
 <button
 key={lbl}
 type="button"
 onClick={() => setter(!state)}
 className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
 state
 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300"
 : "pg-surface-dim pg-border pg-text-muted"
 }`}
 >
 <span>{state ? "✓" : "✗"}</span>
 <span>{lbl}</span>
 </button>
 ))}
 </div>
 <p className="text-[10px] pg-text-muted">Default dari pengaturan channel. Klik untuk override.</p>
 </div>

 {/* ── Camera Movement Section ── */}
 <div className="space-y-3 pt-2 border-t pg-border">
 {/* Header + Main Toggle */}
 <div className="flex items-center justify-between">
 <label className="block text-xs font-semibold pg-text-sub">
 🎥 Camera Movement
 </label>
 <button
 type="button"
 onClick={() => {
 setCameraMovementEnabled(!cameraMovementEnabled);
 if (cameraMovementEnabled) {
 setCameraMovementPresets([]);
 setCameraMovementCustom("");
 setCameraMovementProMode(false);
 }
 }}
 className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
 cameraMovementEnabled
 ? "bg-blue-600"
 : "pg-surface-dim"
 }`}
 aria-label="Toggle camera movement"
 >
 <span
 className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
 cameraMovementEnabled ? "translate-x-5" : "translate-x-1"
 }`}
 />
 </button>
 </div>

 {/* Camera OFF hint */}
 {!cameraMovementEnabled && (
 <p className="text-[10px] pg-text-muted italic">{t("cameraMovementDisabledHint")}</p>
 )}

 {/* Camera ON: PRO toggle (Opsi B — only shown if user has entitlement) */}
 {cameraMovementEnabled && planFeatures.cameraMovementPro && (
 <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
 <div className="flex items-center gap-2">
 <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
 ✨ {t("cameraMovementProModeLabel")}
 </span>
 <span className="text-[10px] pg-text-muted">{t("cameraMovementProModeDesc")}</span>
 </div>
 <button
 type="button"
 onClick={() => {
 const next = !cameraMovementProMode;
 setCameraMovementProMode(next);
 if (next) {
 // Clear presets + custom when PRO mode is activated
 setCameraMovementPresets([]);
 setCameraMovementCustom("");
 }
 }}
 className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
 cameraMovementProMode ? "bg-blue-600" : "pg-surface-dim"
 }`}
 aria-label="Toggle PRO camera movement mode"
 >
 <span
 className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
 cameraMovementProMode ? "translate-x-5" : "translate-x-1"
 }`}
 />
 </button>
 </div>
 )}

 {/* Camera ON + PRO ON: show PRO active message, hide presets */}
 {cameraMovementEnabled && cameraMovementProMode && (
 <div className="text-[10px] pg-text-muted italic px-1">
 ✨ {t("cameraMovementAutoProActive")}
 </div>
 )}

 {/* Camera ON + PRO OFF: show presets + custom (standard / KURASI USER mode) */}
 {cameraMovementEnabled && !cameraMovementProMode && (
 <div className="space-y-3">
 {/* Grouped preset chips */}
 {CAMERA_MOVEMENT_CATEGORIES.map((cat) => (
 <div key={cat.category} className="space-y-1.5">
 <p className="text-[10px] font-semibold uppercase tracking-wide pg-text-muted">
 {cat.category}
 </p>
 <div className="flex flex-wrap gap-1.5">
 {cat.items.map((item) => {
 const isSelected = cameraMovementPresets.includes(item.value);
 return (
 <button
 key={item.value}
 type="button"
 onClick={() => {
 setCameraMovementPresets(prev =>
 isSelected
 ? prev.filter(v => v !== item.value)
 : [...prev, item.value]
 );
 }}
 className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
 isSelected
 ? "bg-blue-600 text-white border-blue-600 shadow-sm"
 : "pg-surface pg-border pg-text-sub hover:border-blue-400 hover:text-blue-600"
 }`}
 >
 {item.label}
 </button>
 );
 })}
 </div>
 </div>
 ))}

 {/* Selected count badge */}
 {cameraMovementPresets.length > 0 && (
 <div className="flex items-center justify-between">
 <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
 {t("cameraMovementPresetsSelected", { count: cameraMovementPresets.length })}
 </p>
 <button
 type="button"
 onClick={() => setCameraMovementPresets([])}
 className="text-[10px] pg-text-muted hover:text-red-500 transition-colors"
 >
 Reset
 </button>
 </div>
 )}

 {/* Custom camera movement concept input */}
 <div className="space-y-1">
 <label className="block text-[10px] font-medium pg-text-muted">
 {t("cameraMovementCustomConcept")}
 </label>
 <input
 type="text"
 value={cameraMovementCustom}
 onChange={(e) => setCameraMovementCustom(e.target.value)}
 placeholder={t("cameraMovementCustomConceptPlaceholder")}
 className="w-full px-3 py-1.5 text-xs bg-transparent border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none pg-text-heading"
 />
 <p className="text-[10px] pg-text-muted">{t("cameraMovementCustomConceptHint")}</p>
 </div>

 {/* Auto Standard hint (non-PRO user) or upsell (PRO available but not enabled) */}
 {cameraMovementPresets.length === 0 && !cameraMovementCustom.trim() && (
 <div className="text-[10px] pg-text-muted italic">
 {planFeatures.cameraMovementPro
 ? t("cameraMovementAutoStandardWithPro")
 : <span>{t("cameraMovementAutoStandard")} <span className="text-amber-500 font-semibold not-italic">🔒 {t("cameraMovementAutoProLocked")}</span></span>
 }
 </div>
 )}
 </div>
 )}
 </div>

 {/* Composition Sliders */}

 <CompositionSliderGroup
 value={videoConfig.composition}
 onChange={(val) => handleVideoConfigChange("composition", val)}
 />

 <div className="space-y-2">
 <label className="block text-xs font-medium pg-text-sub mb-1">
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
 <div className="pt-4 border-t pg-border space-y-4">
 <h3 className="font-semibold pg-text-heading mb-2">
 {t("imageSettings")}
 </h3>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("cameraType")}
 </label>
 <select
 name="cameraType"
 value={imageConfig.cameraType}
 onChange={handleImageConfigChange}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("shotType")}
 </label>
 <select
 name="shotType"
 value={imageConfig.shotType}
 onChange={handleImageConfigChange}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 >
 <option value="Close Up">Close Up</option>
 <option value="Medium Shot">Medium Shot</option>
 <option value="Wide Angle">Wide Angle</option>
 <option value="Macro">Macro</option>
 <option value="Bird Eye View">Bird Eye View</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("lighting")}
 </label>
 <select
 name="lighting"
 value={imageConfig.lighting}
 onChange={handleImageConfigChange}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 >
 <option value="Natural Light">Natural Light</option>
 <option value="Studio Lighting">Studio Lighting</option>
 <option value="Cinematic Lighting">Cinematic Lighting</option>
 <option value="Neon/Cyberpunk">Neon/Cyberpunk</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("mood")}
 </label>
 <input
 type="text"
 name="mood"
 value={imageConfig.mood}
 onChange={handleImageConfigChange}
 placeholder="E.g., Dark, Cheerful, Eerie"
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 />
 </div>
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("colorGrading")}
 </label>
 <input
 type="text"
 name="colorGrading"
 value={imageConfig.colorGrading}
 onChange={handleImageConfigChange}
 placeholder="E.g., Teal & Orange, Pastel"
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 />
 </div>

 <PresetSelect
 label="Visual Style & Aesthetic"
 value={imageConfig.visualStyle}
 onChange={(val) =>
 setImageConfig((prev) => ({ ...prev, visualStyle: String(val) }))
 }
 options={visualAesthetics.length > 0 ? visualAesthetics : [
 { value: "Cinematic Dark Mode (Sleek & Professional)", label: "Cinematic Dark Mode" },
 { value: "Neon Cyberpunk (Futuristis & High-Contrast)", label: "Neon Cyberpunk" },
 { value: "Minimalist Clean (Soft Colors & Modern)", label: "Minimalist Clean" },
 ]}
 placeholder={t("customAestheticPlaceholder")}
 />

 <div className="col-span-2">
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("negativePrompt")}
 </label>
 <input
 type="text"
 name="negativePrompt"
 value={imageConfig.negativePrompt}
 onChange={handleImageConfigChange}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 />
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-medium pg-text-sub mb-1">
 Aspect Ratio
 </label>
 <select
 name="aspectRatio"
 value={imageConfig.aspectRatio}
 onChange={handleImageConfigChange}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white mb-2"
 >
 <option value="16:9">16:9 (Landscape)</option>
 <option value="9:16">9:16 (Portrait / Story)</option>
 <option value="1:1">1:1 (Square)</option>
 </select>
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("variations")}
 </label>
 <input
 type="number"
 min="1"
 max="5"
 name="variations"
 value={imageConfig.variations}
 onChange={handleImageConfigChange}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 </fieldset>

 {step === 2 && (
 <div className="grid grid-cols-2 gap-3 mt-6">
 <button
 type="button"
 onClick={() => {
 setStep(1);
 setGeneratedPrompt("");
 setAiResultJson("");
 }}
 className="w-full py-3 px-4 pg-surface-dim pg-text-heading font-medium rounded-lg shadow-sm transition-all"
 >
 {t("backToEdit")}
 </button>
 <button
 type="button"
 onClick={() => handleGenerate()}
 disabled={loading}
 className="w-full py-3 px-4 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50 font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
 >
 {t("regenerateBtn")}
 </button>
 </div>
 )}
 </form>
 </div>

 {/* Kolom Hasil */}
 <div className="glass-panel shadow-lg rounded-xl p-6 flex flex-col h-[85vh]">
 <div className="flex justify-between items-center mb-4">
 <h2 className="text-xl font-bold pg-text-heading">
 {step === 1 ? t("resultTitle") : t("resultAndSave")}
 </h2>
 {step === 2 && (
 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
 ✓ {t("resultReady")}
 </span>
 )}
 </div>

 <div className="flex-1 flex flex-col space-y-4 min-h-0">
 {loading ? (
 <div className="flex-1 flex flex-col items-center justify-center pg-text-muted border pg-border rounded-lg pg-bg-page">
 <div className="w-10 h-10 border-4 pg-border border-t-blue-600 rounded-full animate-spin mb-4"></div>
 <p className="animate-pulse">{t("loadingMsg")}</p>
 </div>
 ) : step === 1 ? (
 <div className="flex-1 flex flex-col items-center justify-center pg-text-muted text-sm p-8 text-center border pg-border rounded-lg pg-bg-page gap-3">
 <span className="text-4xl">✨</span>
 <p>{t("emptyResult")}</p>
 </div>
 ) : (
 <>
 {/* Generated Prompt Output */}
 <div className="flex flex-col flex-1 border pg-border rounded-lg overflow-hidden pg-bg-page min-h-0 items-center justify-center p-8 text-center space-y-4">
 <div className="text-4xl">📦</div>
 <p className="text-sm pg-text-sub max-w-md">
 {t("jsonInstruction")}
 </p>
 <button
 type="button"
 onClick={downloadJsonPrompt}
 className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 mt-4"
 >
 ⬇️ Download JSON
 </button>
 </div>

 {/* Action Panel — Title + Save */}
 <div className="border border-blue-200 dark:border-blue-900 rounded-lg bg-blue-50/30 dark:bg-blue-900/10 p-4 space-y-3 shrink-0">
 <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">{t("saveAndContinueBtn")}</p>
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("optionalTitle")}
 </label>
 <input
 type="text"
 value={manualTitle}
 onChange={(e) => setManualTitle(e.target.value)}
 placeholder={t("optionalTitlePlaceholder")}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md outline-none dark:text-white"
 />
 </div>
 <div className="flex flex-wrap gap-2">
 {type === "VIDEO" ? (
 <button
 type="button"
 onClick={async () => {
 try {
 await fetch("/api/user/preferences", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ scenePromptState: { rawText: generatedPrompt } })
 });
 } catch(e) { console.error(e); }
 router.push(`/${document.documentElement.lang || "id"}/dashboard/scene-prompt`);
 }}
 className="flex-1 min-w-[140px] px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-md transition-colors flex items-center justify-center gap-1.5"
 >
 {t("continueToSceneStudioBtn")}
 </button>
 ) : (
 <>
 <button
 onClick={handleSaveDraft}
 disabled={saving}
 className="flex-1 min-w-[120px] px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors flex items-center justify-center"
 >
 {saving ? (
 <span className="inline-block animate-spin mr-2 border-2 border-white/20 border-t-white rounded-full w-4 h-4" />
 ) : null}
 {t("saveDraftBtn")}
 </button>
 <button
 type="button"
 onClick={() => router.push(`/${document.documentElement.lang || "id"}/dashboard/drafts`)}
 className="px-3 py-2 text-sm font-medium pg-text-sub bg-white border pg-border rounded-md hover:pg-surface-dim dark:pg-text-muted transition-colors"
 >
 {t("viewDraftsBtn")}
 </button>
 </>
 )}
 </div>
 </div>
 </>
 )}
 </div>
 </div>

 {/* Modal Quick Add Product */}
 {showProductModal && (
 <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
 <div className="pg-surface border pg-border rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
 <div className="flex justify-between items-center">
 <h3 className="text-lg font-bold pg-text-heading">{t("quickAddProductTitle")}</h3>
 <button
 type="button"
 onClick={() => setShowProductModal(false)}
 className="pg-text-muted hover:pg-text-sub text-lg"
 >
 ✕
 </button>
 </div>
 <form onSubmit={handleAddProduct} className="space-y-3">
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("productName")} *
 </label>
 <input
 type="text"
 value={newProductName}
 onChange={(e) => setNewProductName(e.target.value)}
 placeholder={t("productNamePlaceholder")}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md outline-none dark:text-white"
 required
 />
 </div>

 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("productPrice")}
 </label>
 <input
 type="number"
 min="0"
 value={newProductPrice}
 onChange={(e) => setNewProductPrice(e.target.value)}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md outline-none dark:text-white"
 />
 </div>

 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("productDesc")}
 </label>
 <textarea
 rows={2}
 value={newProductDesc}
 onChange={(e) => setNewProductDesc(e.target.value)}
 placeholder={t("productDescPlaceholder")}
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md outline-none dark:text-white"
 />
 </div>

 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 {t("productLink")}
 </label>
 <input
 type="url"
 value={newProductLink}
 onChange={(e) => setNewProductLink(e.target.value)}
 placeholder="https://..."
 className="w-full px-3 py-1.5 text-sm bg-white border pg-border rounded-md outline-none dark:text-white"
 />
 </div>

 <div className="flex justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setShowProductModal(false)}
 className="px-4 py-2 text-xs font-medium pg-text-sub hover:neu-flat rounded-md"
 >
 {t("cancelBtn")}
 </button>
 <button
 type="submit"
 disabled={addingProduct}
 className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md"
 >
 {addingProduct ? t("savingBtn") : t("saveProductBtn")}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
