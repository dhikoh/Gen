"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import CompositionSliderGroup from "./CompositionSliderGroup";
import { PresetSelect, PresetOption } from "@/components/ui/PresetSelect";
import { getVisualStyleOptions, mapVisualAestheticToKey } from "@/lib/visualStyleMap";

interface ProductItem {
 id: string;
 name: string;
 price: number;
 description?: string | null;
 link?: string | null;
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
  contentArchetypeId?: string | null;
  contentArchetype?: {
    id: string;
    name: string;
    description?: string | null;
    narrationMode: "VOICE_OVER" | "DIEGETIC_ONLY" | "SILENT_TEXT_ONLY" | "HYBRID" | string;
    emotionalArcTemplate: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultIncludedSections?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    compositionCategories?: any;
    durationCalcMode?: string;
    isSystem?: boolean;
  } | null;
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
 youtubeLongStudio?: boolean;
 retentionPacingPro?: boolean;
 };
}

export default function GeneratorForm({
 channels,
 promptSettings,
 planFeatures = { imagePromptStudio: true, htmlBlogExport: true, cameraMovementPro: false, youtubeLongStudio: false, retentionPacingPro: false }
}: GeneratorFormProps) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const t = useTranslations("Generator");

 const [type, setType] = useState<"VIDEO" | "IMAGE">("VIDEO");
 const [channelId, setChannelId] = useState(channels.length > 0 ? channels[0].id : "");
 const [topic, setTopic] = useState("");
 const [targetKeywords, setTargetKeywords] = useState<string[]>([]);
 const [outputLanguage, setOutputLanguage] = useState("Indonesian");
 const [additionalContext, setAdditionalContext] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

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
 const [visualStyleCustom, setVisualStyleCustom] = useState<string>(""); // Fix #60: custom style input
 const [hookStyleType, setHookStyleType] = useState<string>("auto");
 const [customHookText, setCustomHookText] = useState<string>("");
 const [musicPreference, setMusicPreference] = useState<boolean>(true);
 const [sfxPreference, setSfxPreference] = useState<boolean>(true);
 const [voPreference, setVoPreference] = useState<boolean>(true);
 const [narrationModeOverride, setNarrationModeOverride] = useState<string>("auto");
 const [trendingAudio, setTrendingAudio] = useState<string>("");

 // Camera Movement state
 const [cameraMovementEnabled, setCameraMovementEnabled] = useState<boolean>(true);
 const [cameraMovementPresets, setCameraMovementPresets] = useState<string[]>([]);
 const [cameraMovementCustom, setCameraMovementCustom] = useState<string>("");
 const [cameraMovementProMode, setCameraMovementProMode] = useState<boolean>(false); // Opsi B: PRO auto toggle
 const [overlayStyle, setOverlayStyle] = useState<string>("auto");
 const [affiliateAngle, setAffiliateAngle] = useState<boolean>(false);
 const [affiliateAngleMode, setAffiliateAngleMode] = useState<"CTA" | "SOFT">("SOFT");

 // YouTube 2026 Strategy Features
 const [retentionPacingProMode, setRetentionPacingProMode] = useState<boolean>(false);
 const [retentionPacingMode, setRetentionPacingMode] = useState<string>("JUMP_CUT");
 const [storytellingFramework, setStorytellingFramework] = useState<string>("VET_3ACT");
 const [valuePromise3Sec, setValuePromise3Sec] = useState<string>("");
 const [thumbnailStylePreset, setThumbnailStylePreset] = useState<string>("anti_gagal");
 const [thumbnailFaceDominance, setThumbnailFaceDominance] = useState<boolean>(true);
 const [targetKeywordsSpecific, setTargetKeywordsSpecific] = useState<string>("");
 const [targetKeywordsGeneral, setTargetKeywordsGeneral] = useState<string>("");
 const [targetKeywordsLongTail, setTargetKeywordsLongTail] = useState<string>("");
 const [audioFadeInOut, setAudioFadeInOut] = useState<boolean>(true);
 const [audioBeatSync, setAudioBeatSync] = useState<boolean>(true);

 // Marketplace settings (persisted)
 const MARKETPLACE_OPTIONS = [
  { key: "tokopedia",  label: "Tokopedia" },
  { key: "shopee",     label: "Shopee" },
  { key: "tiktokshop", label: "TikTok Shop" },
  { key: "lazada",     label: "Lazada" },
  { key: "blibli",     label: "Blibli" },
  { key: "custom",     label: "Custom URL" },
 ];
 const ALL_MARKETPLACE_KEYS = MARKETPLACE_OPTIONS.map(m => m.key);
 const [affiliateMarketplaces, setAffiliateMarketplaces] = useState<string[]>(ALL_MARKETPLACE_KEYS.filter(k => k !== "custom"));
 const [affiliateCustomUrl, setAffiliateCustomUrl] = useState<string>("");

 // Visual style options (from visualStyleMap)
 const visualStyleOptions: PresetOption[] = [
 { value: "", label: "Auto (Ikuti Estetika Channel)" },
 ...getVisualStyleOptions().map(o => ({ value: o.value, label: o.label })),
 { value: "__custom__", label: "✏️ Custom (Ketik Sendiri)" }, // Fix #60
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

  // ── Per-Channel State Isolation & Multi-Profile Synchronization (Section 32) ──
  const serverChannelStatesRef = useRef<Record<string, any>>({});
  const isInitializedRef = useRef<boolean>(false);

  const getCurrentStateSnapshot = useCallback(() => {
    return {
      type,
      channelId,
      outputLanguage,
      topic,
      targetKeywords,
      additionalContext,
      rolePOV,
      toneOfVoice,
      visualStyleKey,
      visualStyleCustom,
      hookStyleType,
      customHookText,
      musicPreference,
      sfxPreference,
      voPreference,
      narrationModeOverride,
      trendingAudio,
      cameraMovementEnabled,
      cameraMovementPresets,
      cameraMovementCustom,
      cameraMovementProMode,
      overlayStyle,
      affiliateAngle,
      affiliateAngleMode,
      affiliateMarketplaces,
      affiliateCustomUrl,
      retentionPacingProMode,
      retentionPacingMode,
      storytellingFramework,
      valuePromise3Sec,
      thumbnailStylePreset,
      thumbnailFaceDominance,
      targetKeywordsSpecific,
      targetKeywordsGeneral,
      targetKeywordsLongTail,
      audioFadeInOut,
      audioBeatSync,
      videoConfig,
      imageConfig,
      step,
      generatedPrompt,
      aiResultJson,
      manualTitle,
    };
  }, [
    type,
    channelId,
    outputLanguage,
    topic,
    targetKeywords,
    additionalContext,
    rolePOV,
    toneOfVoice,
    visualStyleKey,
    visualStyleCustom,
    hookStyleType,
    customHookText,
    musicPreference,
    sfxPreference,
    voPreference,
    narrationModeOverride,
    trendingAudio,
    cameraMovementEnabled,
    cameraMovementPresets,
    cameraMovementCustom,
    cameraMovementProMode,
    overlayStyle,
    affiliateAngle,
    affiliateAngleMode,
    affiliateMarketplaces,
    affiliateCustomUrl,
    retentionPacingProMode,
    retentionPacingMode,
    storytellingFramework,
    valuePromise3Sec,
    thumbnailStylePreset,
    thumbnailFaceDominance,
    targetKeywordsSpecific,
    targetKeywordsGeneral,
    targetKeywordsLongTail,
    audioFadeInOut,
    audioBeatSync,
    videoConfig,
    imageConfig,
    step,
    generatedPrompt,
    aiResultJson,
    manualTitle,
  ]);

  const applyStateForChannel = useCallback((targetChannelId: string, savedState?: any) => {
    const ch = channels.find((c: GeneratorFormChannel) => c.id === targetChannelId);
    if (!ch) return;

    const arch = ch.contentArchetype;
    const defSections = arch?.defaultIncludedSections as { hook?: boolean; cta?: boolean; caption?: boolean; thumbnail?: boolean } | undefined;
    const isNoVoMode = arch?.narrationMode === "DIEGETIC_ONLY" || arch?.narrationMode === "SILENT_TEXT_ONLY";
    const channelVisualStyle = mapVisualAestheticToKey(ch.visualAesthetic) || "";

    if (savedState) {
      if (savedState.type) setType(savedState.type);
      if (savedState.outputLanguage) setOutputLanguage(savedState.outputLanguage);
      setTopic(savedState.topic || "");
      setAdditionalContext(savedState.additionalContext || "");
      if (Array.isArray(savedState.targetKeywords)) setTargetKeywords(savedState.targetKeywords);
      setRolePOV(savedState.rolePOV || "default");
      setToneOfVoice(savedState.toneOfVoice || "");
      setHookStyleType(savedState.hookStyleType || "auto");
      setCustomHookText(savedState.customHookText || "");
      setTrendingAudio(savedState.trendingAudio || "");
      setCameraMovementEnabled(savedState.cameraMovementEnabled !== undefined ? savedState.cameraMovementEnabled : true);
      setCameraMovementPresets(Array.isArray(savedState.cameraMovementPresets) ? savedState.cameraMovementPresets : []);
      setCameraMovementCustom(savedState.cameraMovementCustom || "");
      setCameraMovementProMode(savedState.cameraMovementProMode || false);
      setOverlayStyle(savedState.overlayStyle || "auto");
      setAffiliateAngle(savedState.affiliateAngle || false);
      setAffiliateAngleMode(savedState.affiliateAngleMode || "SOFT");
      if (Array.isArray(savedState.affiliateMarketplaces)) setAffiliateMarketplaces(savedState.affiliateMarketplaces);
      setAffiliateCustomUrl(savedState.affiliateCustomUrl || "");
      setNarrationModeOverride(savedState.narrationModeOverride || "auto");
      setRetentionPacingProMode(savedState.retentionPacingProMode || false);
      setRetentionPacingMode(savedState.retentionPacingMode || "JUMP_CUT");
      setStorytellingFramework(savedState.storytellingFramework || "VET_3ACT");
      setValuePromise3Sec(savedState.valuePromise3Sec || "");
      setThumbnailStylePreset(savedState.thumbnailStylePreset || "anti_gagal");
      setThumbnailFaceDominance(savedState.thumbnailFaceDominance !== undefined ? savedState.thumbnailFaceDominance : true);
      setTargetKeywordsSpecific(savedState.targetKeywordsSpecific || "");
      setTargetKeywordsGeneral(savedState.targetKeywordsGeneral || "");
      setTargetKeywordsLongTail(savedState.targetKeywordsLongTail || "");
      setAudioFadeInOut(savedState.audioFadeInOut !== undefined ? savedState.audioFadeInOut : true);
      setAudioBeatSync(savedState.audioBeatSync !== undefined ? savedState.audioBeatSync : true);

      // Visual Style: If user picked a custom style or valid preset for this channel, keep it; else fallback to channel default
      if (savedState.visualStyleKey) {
        setVisualStyleKey(savedState.visualStyleKey);
        setVisualStyleCustom(savedState.visualStyleCustom || "");
      } else {
        setVisualStyleKey(channelVisualStyle);
        setVisualStyleCustom("");
      }

      // Audio: prioritize channel defaults unless user explicitly set preferences in this channel's state
      setMusicPreference(savedState.musicPreference !== undefined ? savedState.musicPreference : (ch.audioBGM !== false));
      setSfxPreference(savedState.sfxPreference !== undefined ? savedState.sfxPreference : (ch.audioSFX !== false));
      setVoPreference(isNoVoMode ? false : (savedState.voPreference !== undefined ? savedState.voPreference : (ch.audioVO !== false)));

      // VideoConfig: Core channel settings from DB always take precedence (Single Source of Truth)
      setVideoConfig((prev) => ({
        ...prev,
        ...(savedState.videoConfig || {}),
        targetPlatform: ch.targetPlatform || "TikTok",
        pov: ch.personaPov || "Expert Storyteller (Edukasi & Inspirasi)",
        speechRate: ch.speechRate ?? 0.35,
        selectedProductId: "", // Reset to avoid foreign product ID leakage
        includeHook: savedState.videoConfig?.includeHook !== undefined ? savedState.videoConfig.includeHook : (defSections?.hook ?? true),
        includeCTA: savedState.videoConfig?.includeCTA !== undefined ? savedState.videoConfig.includeCTA : (defSections?.cta ?? true),
        includeCaption: savedState.videoConfig?.includeCaption !== undefined ? savedState.videoConfig.includeCaption : (defSections?.caption ?? true),
        includeThumbnail: savedState.videoConfig?.includeThumbnail !== undefined ? savedState.videoConfig.includeThumbnail : (defSections?.thumbnail ?? false),
      }));

      setImageConfig((prev) => ({
        ...prev,
        ...(savedState.imageConfig || {}),
        visualStyle: channelVisualStyle || prev.visualStyle || "Cinematic Dark Mode (Sleek & Professional)",
      }));

      if (savedState.step && savedState.generatedPrompt && savedState.aiResultJson) {
        setStep(savedState.step as 1 | 2);
        setGeneratedPrompt(savedState.generatedPrompt);
        setAiResultJson(savedState.aiResultJson);
        setManualTitle(savedState.manualTitle || "");
      } else {
        setStep(1);
        setGeneratedPrompt("");
        setAiResultJson("");
        setManualTitle("");
      }
    } else {
      // Clean default initialization for this channel (no leakage from previous channel)
      setTopic("");
      setAdditionalContext("");
      setTargetKeywords([]);
      setRolePOV("default");
      setToneOfVoice("");
      setVisualStyleKey(channelVisualStyle);
      setVisualStyleCustom("");
      setHookStyleType("auto");
      setCustomHookText("");
      setTrendingAudio("");
      setCameraMovementEnabled(true);
      setCameraMovementPresets([]);
      setCameraMovementCustom("");
      setCameraMovementProMode(false);
      setAffiliateAngle(false);
      setAffiliateAngleMode("SOFT");
      setAffiliateMarketplaces(ALL_MARKETPLACE_KEYS.filter((k) => k !== "custom"));
      setAffiliateCustomUrl("");
      setNarrationModeOverride("auto");
      setRetentionPacingProMode(false);
      setRetentionPacingMode("JUMP_CUT");
      setStorytellingFramework("VET_3ACT");
      setValuePromise3Sec("");
      setThumbnailStylePreset("anti_gagal");
      setThumbnailFaceDominance(true);
      setTargetKeywordsSpecific("");
      setTargetKeywordsGeneral("");
      setTargetKeywordsLongTail("");
      setAudioFadeInOut(true);
      setAudioBeatSync(true);

      setMusicPreference(ch.audioBGM !== false);
      setSfxPreference(ch.audioSFX !== false);
      setVoPreference(isNoVoMode ? false : (ch.audioVO !== false));

      setVideoConfig((prev) => ({
        ...prev,
        targetPlatform: ch.targetPlatform || "TikTok",
        pov: ch.personaPov || "Expert Storyteller (Edukasi & Inspirasi)",
        speechRate: ch.speechRate ?? 0.35,
        selectedProductId: "",
        includeHook: defSections?.hook ?? true,
        includeCTA: defSections?.cta ?? true,
        includeCaption: defSections?.caption ?? true,
        includeThumbnail: defSections?.thumbnail ?? false,
        includeHtmlBlog: false,
        composition: { education: 40, entertainment: 40, marketing: 20 },
      }));

      setImageConfig((prev) => ({
        ...prev,
        visualStyle: channelVisualStyle || "Cinematic Dark Mode (Sleek & Professional)",
      }));

      setStep(1);
      setGeneratedPrompt("");
      setAiResultJson("");
      setManualTitle("");
    }
  }, [channels]);

  const handleChannelChange = useCallback((newChannelId: string) => {
    if (!newChannelId || newChannelId === channelId) return;

    // 1. Save current channel's state into localStorage before switching
    if (channelId) {
      const currentState = getCurrentStateSnapshot();
      try {
        localStorage.setItem(`generatorFormState_${channelId}`, JSON.stringify(currentState));
      } catch {}
    }

    // 2. Set new active channel ID
    setChannelId(newChannelId);
    try {
      localStorage.setItem("generatorLastActiveChannelId", newChannelId);
    } catch {}

    // 3. Retrieve saved state for target channel
    let targetSaved: any = null;
    try {
      const local = localStorage.getItem(`generatorFormState_${newChannelId}`);
      if (local) targetSaved = JSON.parse(local);
    } catch {}

    if (!targetSaved && serverChannelStatesRef.current?.[newChannelId]) {
      targetSaved = serverChannelStatesRef.current[newChannelId];
    }

    // 4. Apply clean/saved state for the new channel
    applyStateForChannel(newChannelId, targetSaved);
  }, [channelId, getCurrentStateSnapshot, applyStateForChannel]);

  // Mount effect: Resolve active channel, load per-channel state, fetch server preferences
  useEffect(() => {
    let ignore = false;

    const topicParam = searchParams.get("topic");
    const keywordsParam = searchParams.get("keywords");
    const channelParam = searchParams.get("channelId");

    let initialChannelId = channels.length > 0 ? channels[0].id : "";
    if (channelParam && channels.some((c) => c.id === channelParam)) {
      initialChannelId = channelParam;
    } else {
      try {
        const lastActive = localStorage.getItem("generatorLastActiveChannelId");
        if (lastActive && channels.some((c) => c.id === lastActive)) {
          initialChannelId = lastActive;
        }
      } catch {}
    }

    if (initialChannelId && initialChannelId !== channelId) {
      setChannelId(initialChannelId);
    }

    // Load initial channel state
    let initialSaved: any = null;
    try {
      const savedCh = localStorage.getItem(`generatorFormState_${initialChannelId}`);
      if (savedCh) {
        initialSaved = JSON.parse(savedCh);
      } else {
        const legacySaved = localStorage.getItem("generatorFormState");
        if (legacySaved) {
          const parsed = JSON.parse(legacySaved);
          if (parsed.channelId === initialChannelId) {
            initialSaved = parsed;
          }
        }
      }
    } catch {}

    queueMicrotask(() => {
      if (!ignore) {
        applyStateForChannel(initialChannelId, initialSaved);
        if (topicParam) setTopic(topicParam);
        if (keywordsParam) {
          const parsed = keywordsParam.split(",").map((k) => k.trim()).filter(Boolean);
          if (parsed.length > 0) setTargetKeywords(parsed);
        }
        isInitializedRef.current = true;
      }
    });

    // Fetch server preferences
    fetch("/api/user/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.success && data.generatorPreferences) {
          const prefs = data.generatorPreferences;
          if (prefs.channelFormStates) {
            serverChannelStatesRef.current = prefs.channelFormStates;
          }
          if (!initialSaved) {
            const serverSaved =
              prefs.channelFormStates?.[initialChannelId] ||
              (prefs.generatorFormState?.channelId === initialChannelId ? prefs.generatorFormState : null);
            if (serverSaved) {
              applyStateForChannel(initialChannelId, serverSaved);
              if (topicParam) setTopic(topicParam);
              if (keywordsParam) {
                const parsed = keywordsParam.split(",").map((k) => k.trim()).filter(Boolean);
                if (parsed.length > 0) setTargetKeywords(parsed);
              }
            }
          }
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []); // Run only once on mount

  // Auto-Save: Persist to per-channel localStorage immediately & debounced server sync
  useEffect(() => {
    if (!channelId || !isInitializedRef.current) return;
    const stateObj = getCurrentStateSnapshot();

    try {
      localStorage.setItem("generatorLastActiveChannelId", channelId);
      localStorage.setItem(`generatorFormState_${channelId}`, JSON.stringify(stateObj));
      localStorage.setItem("generatorFormState", JSON.stringify(stateObj)); // fallback
    } catch {}

    const timeoutId = setTimeout(() => {
      fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generatorFormState: stateObj,
          channelFormStates: {
            [channelId]: stateObj,
          },
        }),
      }).catch(() => {});
    }, 3000); // 3 seconds debounce

    return () => clearTimeout(timeoutId);
  }, [channelId, getCurrentStateSnapshot]);

 // Fetch presets on mount
 useEffect(() => {
 fetch("/api/platform-options")
 .then((res) => res.json())
 .then((d) => {
 if (d.success && d.options) {
 setPlatformOptions(
  d.options.map((opt: { label: string; value?: string }) => {
    const val = opt.value || opt.label;
    const isYtLong = /youtube\s*long/i.test(val);
    const isLocked = isYtLong && !planFeatures.youtubeLongStudio;
    return {
      value: val,
      label: isLocked ? `${opt.label} 🔒` : opt.label,
    };
  })
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

   // Reactive sync if URL search params change while on page (e.g. navigation from Research Studio)
  useEffect(() => {
    const topicParam = searchParams.get("topic");
    const keywordsParam = searchParams.get("keywords");
    const channelParam = searchParams.get("channelId");

    if (!topicParam && !keywordsParam && !channelParam) return;

    queueMicrotask(() => {
      if (topicParam) setTopic(topicParam);
      if (keywordsParam) {
        const parsed = keywordsParam.split(",").map((k) => k.trim()).filter(Boolean);
        if (parsed.length > 0) setTargetKeywords(parsed);
      }
      if (channelParam && channels.some((c) => c.id === channelParam) && channelParam !== channelId) {
        handleChannelChange(channelParam);
      }
    });
  }, [searchParams, channelId, channels, handleChannelChange]);

  // Fetch & apply template from URL searchParams (templateId)
  useEffect(() => {
    const templateIdParam = searchParams.get("templateId");
    if (!templateIdParam) return;

    let ignore = false;
    fetch(`/api/drafts/${templateIdParam}`)
      .then((res) => res.json())
      .then((resData) => {
        if (ignore || !resData.success || !resData.data) return;
        const draft = resData.data;

        if (draft.type && (draft.type === "VIDEO" || draft.type === "IMAGE")) {
          setType(draft.type);
        }
        if (draft.channelId && channels.some((c) => c.id === draft.channelId)) {
          handleChannelChange(draft.channelId);
        }
        if (draft.topic) {
          setTopic(draft.topic);
        }
        if (draft.title) {
          setManualTitle(draft.title);
        }
        if (draft.targetDurationSec) {
          setVideoConfig((prev) => ({
            ...prev,
            targetDurationSec: Number(draft.targetDurationSec),
            targetSceneCount: draft.targetSceneCount ? Number(draft.targetSceneCount) : prev.targetSceneCount,
            speechRate: draft.speechRate ? Number(draft.speechRate) : prev.speechRate,
            narrativeLoopStyle: draft.narrativeLoopStyle || prev.narrativeLoopStyle,
            visualLoopStyle: draft.visualLoopStyle || prev.visualLoopStyle,
          }));
        }
        toast.success(t("templateLoadedSuccess"));
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [searchParams, channels, handleChannelChange, t]);

  // Fetch channel products when channelId changes
  useEffect(() => {
    if (!channelId) {
      queueMicrotask(() => setChannelProducts([]));
      return;
    }
    let ignore = false;
    fetch(`/api/channels/${channelId}/products`)
      .then((res) => res.json())
      .then((d) => {
        if (!ignore && d.products) {
          setChannelProducts(d.products);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [channelId]);

 const handleVideoConfigChange = (key: string, value: unknown) => {
   setVideoConfig((prev) => {
     const next = { ...prev, [key]: value };
     if (key === "targetPlatform" && typeof value === "string") {
       if (/youtube\s*long/i.test(value)) {
         if (!planFeatures?.youtubeLongStudio) {
           toast.error(t("youtubeLongStudioLocked"));
         } else {
           next.aspectRatio = "16:9";
           if (next.targetSceneCount < 8) next.targetSceneCount = 8;
           if (next.targetDurationSec < 300) next.targetDurationSec = 300;
           setOverlayStyle("chapter_titles");
         }
       } else if (/youtube\s*shorts|tiktok|reels/i.test(value)) {
         next.aspectRatio = "9:16";
       }
     }
     return next;
   });
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
 targetKeywords: targetKeywords.length > 0 ? targetKeywords : undefined,
 socialCaption: videoConfig.includeCaption,
 thumbnailIdea: videoConfig.includeThumbnail,
 htmlBlog: videoConfig.includeHtmlBlog,
 // Push enrichment params
 rolePOV,
 toneOfVoice: toneOfVoice || undefined,
 // Fix #60: if __custom__ is selected, use the custom text; else use the preset key
 visualStyle: visualStyleKey === "__custom__"
   ? (visualStyleCustom.trim() || undefined)
   : (visualStyleKey || undefined),
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
 affiliateAngle,
 affiliateAngleMode: affiliateAngle ? affiliateAngleMode : undefined,
 affiliateMarketplaces: affiliateAngle ? affiliateMarketplaces : undefined,
 affiliateCustomUrl: affiliateAngle && affiliateMarketplaces.includes("custom") ? affiliateCustomUrl : undefined,
 isVideoPlatform: selectedChannel?.targetPlatform ? !/blog|podcast|article|web/i.test(selectedChannel.targetPlatform) : true,
 contentArchetypeId: selectedChannel?.contentArchetypeId || selectedChannel?.contentArchetype?.id,
 narrationMode: narrationModeOverride !== "auto" ? narrationModeOverride : selectedChannel?.contentArchetype?.narrationMode,
 trendingAudio: trendingAudio.trim() || undefined,
 overlayStyle: overlayStyle !== "auto" ? overlayStyle : undefined,
 retentionPacingProMode: planFeatures.retentionPacingPro ? retentionPacingProMode : false,
 retentionPacingMode: !retentionPacingProMode ? retentionPacingMode : undefined,
 storytellingFramework,
 valuePromise3Sec: valuePromise3Sec.trim() || undefined,
 thumbnailStylePreset: videoConfig.includeThumbnail ? thumbnailStylePreset : undefined,
 thumbnailFaceDominance: videoConfig.includeThumbnail ? thumbnailFaceDominance : undefined,
 targetKeywordsSpecific: targetKeywordsSpecific.trim() || undefined,
 targetKeywordsGeneral: targetKeywordsGeneral.trim() || undefined,
 targetKeywordsLongTail: targetKeywordsLongTail.trim() || undefined,
 audioFadeInOut,
 audioBeatSync,
 } : undefined,
 imageConfig: type === "IMAGE" ? {
  ...imageConfig,
  // Fix #59: pass targetKeywords to IMAGE path (previously only sent in videoConfig)
  targetKeywords: targetKeywords.length > 0 ? targetKeywords : undefined,
 } : undefined,
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
 } catch {
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
 toast.success(t("draftSavedSuccess"));
 const lang = document.documentElement.lang || "id";
 const targetUrl = channelId
 ? `/${lang}/dashboard/drafts?channelId=${encodeURIComponent(channelId)}`
 : `/${lang}/dashboard/drafts`;
 router.push(targetUrl);
 } else {
 setError(data.error || t("saveDraftFail"));
 }
 } catch {
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
 } catch {
 jsonString = generatedPrompt;
 }
 } else {
 // Validate JSON formatting
 try {
 const parsed = JSON.parse(jsonString);
 jsonString = JSON.stringify(parsed, null, 2);
 } catch {
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

 const selectedChannel = channels.find((c) => c.id === channelId);
 const currentArchetype = selectedChannel?.contentArchetype;
 const effectiveNarrationMode = narrationModeOverride !== "auto"
   ? narrationModeOverride
   : (currentArchetype?.narrationMode || "VOICE_OVER");
 const isNoVoMode = effectiveNarrationMode === "DIEGETIC_ONLY" || effectiveNarrationMode === "SILENT_TEXT_ONLY";
 const hasRequiredComposition =
   !currentArchetype ||
   (Array.isArray(currentArchetype.compositionCategories) &&
     currentArchetype.compositionCategories.length > 0 &&
     currentArchetype.compositionCategories.some((cat: { required: boolean }) => cat.required));

 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Kolom Form Input */}
 <div className="glass-panel shadow-lg rounded-xl p-6 max-md:h-[85vh] min-h-[50vh] overflow-y-auto custom-scrollbar">
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
 onChange={(e) => handleChannelChange(e.target.value)}
 className="w-full px-4 py-2 bg-white dark:bg-slate-700 border pg-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
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

 {currentArchetype && (
   <div className="mt-2.5 p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs flex flex-col gap-1">
     <div className="flex items-center justify-between flex-wrap gap-1.5">
       <span className="font-semibold text-blue-900 dark:text-blue-300">
         Model: {currentArchetype.name}
       </span>
       <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-200/80 dark:bg-blue-800/60 text-blue-950 dark:text-blue-200">
         {currentArchetype.narrationMode === "VOICE_OVER" && "🎙️ Voice Over"}
         {currentArchetype.narrationMode === "DIEGETIC_ONLY" && "🔇 Suara Diegetik Murni"}
         {currentArchetype.narrationMode === "SILENT_TEXT_ONLY" && "📄 Teks di Layar Saja"}
         {currentArchetype.narrationMode === "HYBRID" && "🔀 Hybrid (VO + Diegetic)"}
       </span>
     </div>
     {currentArchetype.description && (
       <p className="text-[11px] text-slate-600 dark:text-slate-400">
         {currentArchetype.description}
       </p>
     )}
   </div>
 )}
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
 <div className="flex items-center justify-between mb-2">
 <label className="block text-sm font-medium pg-text-sub">
 {t("mainTopic")}{" "}
 <span className="text-xs pg-text-muted font-normal">
 {t("optionalNicheChannel")}
 </span>
 </label>
 <a
 href={`/dashboard/research?channelId=${channelId || ""}&query=${encodeURIComponent(topic || "")}`}
 className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline transition-colors"
 title="Buka Studio Riset Tren & Keyword"
 >
 <span>🔍</span> Riset Tren & Keyword
 </a>
 </div>
 <textarea
 value={topic}
 onChange={(e) => setTopic(e.target.value)}
 onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }}
 placeholder={t("mainTopicPlaceholder")}
 rows={2}
 className="w-full px-4 py-2 bg-white dark:bg-slate-700 border pg-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-y min-h-[46px] transition-[height] duration-150"
 />

 {/* Target SEO Badges */}
 <div className="mt-2.5">
 {targetKeywords.length > 0 ? (
 <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex flex-col gap-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
 <span>🎯</span> Target Kata Kunci SEO ({targetKeywords.length}):
 </span>
 <button
 type="button"
 onClick={() => setTargetKeywords([])}
 className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
 >
 Hapus Semua
 </button>
 </div>
 <div className="flex flex-wrap items-center gap-1.5">
 {targetKeywords.map((kw, idx) => (
 <span
 key={idx}
 className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
 >
 {kw}
 <button
 type="button"
 onClick={() => setTargetKeywords(targetKeywords.filter((_, i) => i !== idx))}
 className="hover:text-red-600 text-emerald-700 dark:text-emerald-400 font-bold ml-0.5"
 title="Hapus keyword"
 >
 ×
 </button>
 </span>
 ))}
 </div>
 </div>
 ) : (
 <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
 <span>Target SEO belum ditentukan (opsional).</span>
 <a
 href={`/dashboard/research?channelId=${channelId || ""}&query=${encodeURIComponent(topic || "")}`}
 className="text-blue-500 hover:underline"
 >
 + Ambil dari Riset
 </a>
 </div>
 )}
 </div>
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
 onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }}
 placeholder={t("additionalContextPlaceholder")}
 rows={2}
 className="w-full px-4 py-2 bg-white dark:bg-slate-700 border pg-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-y min-h-[64px] transition-[height] duration-150"
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
 { value: "YouTube Long", label: planFeatures.youtubeLongStudio ? "YouTube Long" : "YouTube Long 🔒" },
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white"
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
 className="w-20 px-2 py-1 text-xs bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 />
 </div>

 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 Aspect Ratio Video
 </label>
 <select
 value={videoConfig.aspectRatio}
 onChange={(e) => handleVideoConfigChange("aspectRatio", e.target.value)}
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 {(videoConfig.includeHook || videoConfig.includeCTA) && (
   <div className={`grid gap-4 ${videoConfig.includeHook && videoConfig.includeCTA ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
     {videoConfig.includeHook && (
       <div>
         <label className="block text-xs font-medium pg-text-sub mb-1">
           {t("hookStyle")}
         </label>
         <select
           value={videoConfig.hookStyle}
           onChange={(e) => handleVideoConfigChange("hookStyle", e.target.value)}
           className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
         >
           <option value="Pertanyaan Provokatif">{t("hookProvocative")}</option>
           <option value="Fakta Mengejutkan">{t("hookSurprising")}</option>
           <option value="Tantangan">{t("hookChallenge")}</option>
           <option value="Negative Hook">{t("hookNegative")}</option>
         </select>
       </div>
     )}
     {videoConfig.includeCTA && (
       <div>
         <label className="block text-xs font-medium pg-text-sub mb-1">
           {t("endingStyle")}
         </label>
         <select
           value={videoConfig.endingStyle}
           onChange={(e) => handleVideoConfigChange("endingStyle", e.target.value)}
           className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
         >
           <option value="Pertanyaan Terbuka">{t("endingOpen")}</option>
           <option value="Hard Sell CTA">{t("endingHardSell")}</option>
           <option value="Ajakan Simpan/Share">{t("endingShare")}</option>
         </select>
       </div>
     )}
   </div>
 )}

 {/* Loop Options */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">
 Gaya Narrative Loop
 </label>
 <select
 value={videoConfig.narrativeLoopStyle}
 onChange={(e) => handleVideoConfigChange("narrativeLoopStyle", e.target.value)}
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
 >
 {visualStyleOptions.map((opt) => (
 <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
 ))}
 </select>
 {/* Fix #60: Show custom textarea when Custom is selected */}
 {visualStyleKey === "__custom__" && (
 <div className="mt-2">
 <label className="block text-xs font-medium pg-text-sub mb-1">
 ✏️ Deskripsikan Gaya Visual Custom
 </label>
 <textarea
 value={visualStyleCustom}
 onChange={(e) => setVisualStyleCustom(e.target.value)}
 rows={4}
 placeholder="Contoh: semi-realistic digital illustration, gouache-like painterly texture, bold soft ink outlines, warm muted color palette, gentle directional lighting..."
 className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white resize-none"
 />
 <p className="text-xs pg-text-muted mt-1">
 Deskripsi ini akan diinjeksi langsung ke panduan Visual Prompt setiap scene. Tulis sedetail mungkin — semakin presisi, semakin konsisten gaya visual yang dihasilkan AI.
 </p>
 </div>
 )}
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

 {/* ── Push Enrichment: Narration Mode Selector ── */}
 <div className="space-y-2 pt-2 border-t pg-border">
    <div className="flex items-center justify-between">
      <label className="block text-xs font-semibold pg-text-sub">
        🎬 Mode Narasi Video
      </label>
      <span className="text-[10px] pg-text-muted">
        {narrationModeOverride === "auto" ? "Ikuti Model Channel" : "Manual Override"}
      </span>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
      {[
        {
          value: "auto",
          label: "Auto",
          badge: currentArchetype?.narrationMode === "DIEGETIC_ONLY" ? "Diegetik" : "Voice Over",
          desc: "Ikuti model channel",
        },
        {
          value: "VOICE_OVER",
          label: "🎙️ Voice Over",
          desc: "Naskah narasi lengkap",
        },
        {
          value: "DIEGETIC_ONLY",
          label: "🔇 Diegetic Only",
          desc: "Suara alami + Teks layar",
        },
        {
          value: "SILENT_TEXT_ONLY",
          label: "📄 Teks Layar",
          desc: "Hening / Teks saja",
        },
      ].map((m) => {
        const isSelected = narrationModeOverride === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => setNarrationModeOverride(m.value)}
            className={`flex flex-col items-start p-2 rounded-lg border text-left transition-colors text-xs ${
              isSelected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/50"
                : "pg-border hover:pg-surface-dim pg-text-sub"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-[11px] truncate">{m.label}</span>
              {m.badge && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {m.badge}
                </span>
              )}
            </div>
            <span className="text-[9px] pg-text-muted mt-0.5 leading-tight">{m.desc}</span>
          </button>
        );
      })}
    </div>
    {effectiveNarrationMode === "DIEGETIC_ONLY" && (
      <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded border border-amber-200 dark:border-amber-900">
        ℹ️ <strong>Mode Diegetik Aktif</strong>: Video dirancang tanpa narator luar. Cerita disampaikan lewat SFX/suara lingkungan dan Teks Overlay di layar.
      </p>
    )}
  </div>

 {/* ── Push Enrichment: Overlay Style Selector ── */}
 <div className="space-y-2 pt-2 border-t pg-border">
    <div className="flex items-center justify-between">
      <label className="block text-xs font-semibold pg-text-sub">
        💬 Gaya Teks Overlay
      </label>
      <span className="text-[10px] pg-text-muted">
        {overlayStyle === "auto" ? "Otomatis (AI Pilih)" : "Manual Override"}
      </span>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
      {[
        {
          value: "auto",
          label: "🤖 Auto",
          desc: "AI pilih sesuai konteks & panjang konten",
        },
        {
          value: "chapter_titles",
          label: "📖 Chapter Title",
          desc: "Judul bab muncul lalu menghilang",
        },
        {
          value: "key_points",
          label: "📌 Key Point",
          desc: "Fakta/data menemani narasi",
        },
        {
          value: "mixed",
          label: "🔀 Mixed",
          desc: "Campuran chapter + key point",
        },
        {
          value: "minimal",
          label: "✨ Minimal",
          desc: "Overlay hanya jika perlu",
        },
      ].map((m) => {
        const isSelected = overlayStyle === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => setOverlayStyle(m.value)}
            className={`flex flex-col items-start p-2 rounded-lg border text-left transition-colors text-xs ${
              isSelected
                ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/50"
                : "pg-border hover:pg-surface-dim pg-text-sub"
            }`}
          >
            <span className="font-semibold text-[11px] truncate">{m.label}</span>
            <span className="text-[9px] pg-text-muted mt-0.5 leading-tight">{m.desc}</span>
          </button>
        );
      })}
    </div>
    {overlayStyle === "chapter_titles" && (
      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded border border-emerald-200 dark:border-emerald-900">
        📖 <strong>Chapter Title Mode</strong>: Overlay muncul sebagai judul bab di awal scene, lalu menghilang (fade out) saat narasi dimulai. Cocok untuk konten panjang dengan pembagian topik.
      </p>
    )}
    {overlayStyle === "minimal" && (
      <p className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30 p-1.5 rounded border border-slate-200 dark:border-slate-800">
        ✨ <strong>Minimal Mode</strong>: Overlay hanya di scene yang sangat membutuhkannya (hook, data kunci, CTA). Mayoritas scene tanpa overlay.
      </p>
    )}
  </div>

 {/* ── Push Enrichment: Audio Preferences ── */}
 <div className="space-y-2 pt-2 border-t pg-border">
 <label className="block text-xs font-semibold pg-text-sub">
 🔊 Audio Preferences
 </label>
 <div className="grid grid-cols-3 gap-2">
    <button
      type="button"
      onClick={() => setMusicPreference(!musicPreference)}
      className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
        musicPreference
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300"
          : "pg-surface-dim pg-border pg-text-muted"
      }`}
    >
      <span>{musicPreference ? "✓" : "✗"}</span>
      <span>BGM / Musik</span>
    </button>

    <button
      type="button"
      onClick={() => setSfxPreference(!sfxPreference)}
      className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
        sfxPreference
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300"
          : "pg-surface-dim pg-border pg-text-muted"
      }`}
    >
      <span>{sfxPreference ? "✓" : "✗"}</span>
      <span>SFX / Efek</span>
    </button>

    {(() => {
      if (isNoVoMode) {
        return (
          <button
            type="button"
            disabled
            title="Voice Over dinonaktifkan oleh Mode Narasi yang aktif (Diegetic / Silent)"
            className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg border pg-surface-dim pg-border opacity-50 cursor-not-allowed text-slate-400"
          >
            <span>✗</span>
            <span>Voice Over</span>
          </button>
        );
      }

      return (
        <button
          type="button"
          onClick={() => setVoPreference(!voPreference)}
          className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
            voPreference
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300"
              : "pg-surface-dim pg-border pg-text-muted"
          }`}
        >
          <span>{voPreference ? "✓" : "✗"}</span>
          <span>Voice Over</span>
        </button>
      );
    })()}
  </div>
  <p className="text-[10px] pg-text-muted">
    {isNoVoMode
      ? "Mode Narasi saat ini mewajibkan audio diegetik/silent (tanpa voice-over luar)."
      : voPreference
      ? "Voice Over aktif (naskah narasi lengkap + visual lipsync)."
      : "Voice Over OFF (naskah narasi tetap ada untuk dubbing, visual prompt 'no voice over')."}
  </p>

  {/* Audio Dynamics 2026: Fade-in/out & Beat Sync */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
    <button
      type="button"
      onClick={() => setAudioFadeInOut(!audioFadeInOut)}
      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
        audioFadeInOut
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300"
          : "pg-surface-dim pg-border pg-text-muted"
      }`}
    >
      <span className="font-bold">{audioFadeInOut ? "✓" : "✗"}</span>
      <div className="min-w-0">
        <p className="font-semibold text-[11px]">{t("audioFadeInOutLabel")}</p>
        <p className="text-[9px] pg-text-muted leading-tight">{t("audioFadeInOutDesc")}</p>
      </div>
    </button>

    <button
      type="button"
      onClick={() => setAudioBeatSync(!audioBeatSync)}
      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
        audioBeatSync
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300"
          : "pg-surface-dim pg-border pg-text-muted"
      }`}
    >
      <span className="font-bold">{audioBeatSync ? "✓" : "✗"}</span>
      <div className="min-w-0">
        <p className="font-semibold text-[11px]">{t("audioBeatSyncLabel")}</p>
        <p className="text-[9px] pg-text-muted leading-tight">{t("audioBeatSyncDesc")}</p>
      </div>
    </button>
  </div>

  {/* Sound / Trending Audio Input (Tugas 4) */}
  <div className="pt-2.5 border-t pg-border space-y-1">
    <div className="flex items-center justify-between">
      <label className="block text-xs font-semibold pg-text-sub flex items-center gap-1.5">
        <span>🎵</span>
        <span>{t("trendingAudio")}</span>
      </label>
      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Short-Form Boost</span>
    </div>
    <input
      type="text"
      value={trendingAudio}
      onChange={(e) => setTrendingAudio(e.target.value)}
      placeholder={t("trendingAudioPlaceholder")}
      maxLength={200}
      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700/50 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-[var(--pg-brand)]"
    />
    <p className="text-[10px] pg-text-muted">{t("trendingAudioHelp")}</p>
  </div>
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
 className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700/50 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none pg-text-heading"
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

 {/* ── Retention & Pacing Engine 2026 ── */}
 <div className="space-y-3 pt-2 border-t pg-border">
  <div className="flex items-center justify-between">
   <div>
    <label className="block text-xs font-semibold pg-text-sub flex items-center gap-1.5">
     <span>⚡</span>
     <span>{t("retentionPacingTitle")}</span>
    </label>
    <p className="text-[10px] pg-text-muted mt-0.5">{t("retentionPacingDesc")}</p>
   </div>
  </div>

  {/* PRO Retention Mode Toggle (if plan has retentionPacingPro) */}
  {planFeatures.retentionPacingPro ? (
   <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30">
    <div className="flex items-center gap-2">
     <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
      ✨ {t("retentionPacingProModeLabel")}
     </span>
     <span className="text-[10px] pg-text-muted hidden sm:inline">{t("retentionPacingProModeDesc")}</span>
    </div>
    <button
     type="button"
     onClick={() => setRetentionPacingProMode(!retentionPacingProMode)}
     className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
      retentionPacingProMode ? "bg-amber-500" : "pg-surface-dim"
     }`}
     aria-label="Toggle PRO retention mode"
    >
     <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
       retentionPacingProMode ? "translate-x-5" : "translate-x-1"
      }`}
     />
    </button>
   </div>
  ) : (
   <div className="flex items-center justify-between py-1.5 px-3 rounded-lg pg-surface-dim border pg-border">
    <span className="text-[11px] pg-text-muted">
     ✨ {t("retentionPacingProModeLabel")} <span className="text-amber-500 font-semibold">🔒 PRO</span>
    </span>
    <span className="text-[9px] pg-text-muted italic">{t("retentionPacingProModeDesc")}</span>
   </div>
  )}

  {/* Retention Pacing Style Presets (if not in PRO mode) */}
  {!retentionPacingProMode ? (
   <div className="space-y-1.5">
    <label className="block text-[11px] font-medium pg-text-sub">{t("retentionPacingStyleLabel")}</label>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
     {[
      { value: "JUMP_CUT", label: "⚡ Jump Cut", desc: "0s dead-air, energetik" },
      { value: "B_ROLL_HEAVY", label: "🎬 B-Roll Variety", desc: "Cutaways & aset visual" },
      { value: "BEAT_SYNC", label: "🎵 Beat Sync", desc: "Selaras birama BGM" },
      { value: "CONTEMPLATIVE", label: "🌊 Kontemplatif", desc: "Alur mendalam & emosional" },
     ].map((preset) => {
      const isSelected = retentionPacingMode === preset.value;
      return (
       <button
        key={preset.value}
        type="button"
        onClick={() => setRetentionPacingMode(preset.value)}
        className={`p-2 rounded-lg border text-left text-xs transition-colors flex flex-col justify-between ${
         isSelected
          ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/50"
          : "pg-border hover:pg-surface-dim pg-text-sub"
        }`}
       >
        <span className="font-semibold text-[11px] truncate">{preset.label}</span>
        <span className="text-[9px] pg-text-muted mt-0.5 leading-tight">{preset.desc}</span>
       </button>
      );
     })}
    </div>
   </div>
  ) : (
   <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-900">
    ✨ <strong>Mode Retensi Eksekutif (PRO 2026) Aktif</strong>: AI secara otomatis menginjeksikan aturan anti-drop 0-3 detik, eliminasi dead air, visual beat sync, cutaways dinamis, dan mid-roll re-engagement di setiap adegan naskah.
   </p>
  )}
 </div>

 {/* ── Storytelling Framework & 3-Second Value Promise ── */}
 <div className="space-y-3 pt-2 border-t pg-border">
  <div>
   <label className="block text-xs font-semibold pg-text-sub flex items-center gap-1.5">
    <span>🎭</span>
    <span>{t("storytellingFrameworkTitle")}</span>
   </label>
   <p className="text-[10px] pg-text-muted mt-0.5">{t("storytellingFrameworkDesc")}</p>
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
   {[
    { value: "VET_3ACT", label: "🎯 VET 3-Act", desc: "Visual, Emotional, Technical" },
    { value: "PAS", label: "🔥 PAS Formula", desc: "Problem → Agitate → Solve" },
    { value: "AIDA", label: "📢 AIDA", desc: "Attention → Interest → Action" },
    { value: "STORY_ARC", label: "⛰️ Story Arc", desc: "Eksposisi → Klimaks → Twist" },
   ].map((fw) => {
    const isSelected = storytellingFramework === fw.value;
    return (
     <button
      key={fw.value}
      type="button"
      onClick={() => setStorytellingFramework(fw.value)}
      className={`p-2 rounded-lg border text-left text-xs transition-colors flex flex-col justify-between ${
       isSelected
        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/50"
        : "pg-border hover:pg-surface-dim pg-text-sub"
      }`}
     >
      <span className="font-semibold text-[11px] truncate">{fw.label}</span>
      <span className="text-[9px] pg-text-muted mt-0.5 leading-tight">{fw.desc}</span>
     </button>
    );
   })}
  </div>

  {/* 3-Second Value Promise Input */}
  <div className="space-y-1 pt-1">
   <label className="block text-xs font-semibold pg-text-sub flex items-center gap-1.5">
    <span>⏱️</span>
    <span>{t("valuePromise3SecLabel")}</span>
   </label>
   <input
    type="text"
    value={valuePromise3Sec}
    onChange={(e) => setValuePromise3Sec(e.target.value)}
    placeholder={t("valuePromise3SecPlaceholder")}
    maxLength={200}
    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700/50 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-blue-500"
   />
   <p className="text-[10px] pg-text-muted">
    Nilai spesifik yang dijanjikan pada penonton di detik 0-3 untuk memutus scroll (Retention Hook 2026).
   </p>
  </div>
 </div>

 {/* ── Thumbnail 2026 Studio Presets ── */}
 {videoConfig.includeThumbnail && (
  <div className="space-y-3 pt-2 border-t pg-border">
   <div className="flex items-center justify-between">
    <div>
     <label className="block text-xs font-semibold pg-text-sub flex items-center gap-1.5">
      <span>🖼️</span>
      <span>{t("thumbnailStylePresetTitle")}</span>
     </label>
     <p className="text-[10px] pg-text-muted mt-0.5">Template 1-3 kata huruf kapital punchy dengan contrast tinggi & curiosity gap.</p>
    </div>
   </div>

   <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
    {[
     { value: "anti_gagal", label: "🛡️ ANTI GAGAL", desc: "Tutorial / Solusi Pasti" },
     { value: "gila", label: "🔥 GILA!", desc: "Reaksi / Shocking Fact" },
     { value: "3_langkah", label: "⚡ 3 LANGKAH SAJA", desc: "Kemudahan & Simpel" },
     { value: "booyah", label: "🎯 BOOYAH!", desc: "Kemenangan & Hasil" },
     { value: "kaget", label: "😲 KAGET!", desc: "Mind-Blowing Curiosity" },
    ].map((tpl) => {
     const isSelected = thumbnailStylePreset === tpl.value;
     return (
      <button
       key={tpl.value}
       type="button"
       onClick={() => setThumbnailStylePreset(tpl.value)}
       className={`p-2 rounded-lg border text-left text-xs transition-colors flex flex-col justify-between ${
        isSelected
         ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/50"
         : "pg-border hover:pg-surface-dim pg-text-sub"
       }`}
      >
       <span className="font-semibold text-[11px] truncate">{tpl.label}</span>
       <span className="text-[9px] pg-text-muted mt-0.5 leading-tight">{tpl.desc}</span>
      </button>
     );
    })}
   </div>

   {/* Face Dominance 60-80% Frame Toggle */}
   <div className="flex items-center justify-between py-1.5 px-3 rounded-lg pg-surface-dim border pg-border">
    <div>
     <span className="text-[11px] font-semibold pg-text-heading flex items-center gap-1.5">
      <span>👤</span>
      <span>{t("thumbnailFaceDominanceLabel")}</span>
     </span>
     <span className="text-[10px] pg-text-muted">{t("thumbnailFaceDominanceDesc")}</span>
    </div>
    <button
     type="button"
     onClick={() => setThumbnailFaceDominance(!thumbnailFaceDominance)}
     className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
      thumbnailFaceDominance ? "bg-rose-600" : "pg-surface-dim"
     }`}
     aria-label="Toggle face dominance"
    >
     <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
       thumbnailFaceDominance ? "translate-x-5" : "translate-x-1"
      }`}
     />
    </button>
   </div>
  </div>
 )}

 {/* ── Arsitektur Kata Kunci & SEO 3 Lapis (YouTube 2026) ── */}
 <div className="space-y-3 pt-2 border-t pg-border">
  <div>
   <label className="block text-xs font-semibold pg-text-sub flex items-center gap-1.5">
    <span>🎯</span>
    <span>{t("seo3TierTitle")}</span>
   </label>
   <p className="text-[10px] pg-text-muted mt-0.5">{t("seo3TierDesc")}</p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
   <div className="space-y-1">
    <label className="block text-[11px] font-medium pg-text-sub">{t("seoTagSpecificLabel")}</label>
    <input
     type="text"
     value={targetKeywordsSpecific}
     onChange={(e) => setTargetKeywordsSpecific(e.target.value)}
     placeholder={t("seoTagSpecificPlaceholder")}
     className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700/50 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-blue-500"
    />
   </div>

   <div className="space-y-1">
    <label className="block text-[11px] font-medium pg-text-sub">{t("seoTagGeneralLabel")}</label>
    <input
     type="text"
     value={targetKeywordsGeneral}
     onChange={(e) => setTargetKeywordsGeneral(e.target.value)}
     placeholder={t("seoTagGeneralPlaceholder")}
     className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700/50 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-blue-500"
    />
   </div>

   <div className="space-y-1">
    <label className="block text-[11px] font-medium pg-text-sub">{t("seoTagLongTailLabel")}</label>
    <input
     type="text"
     value={targetKeywordsLongTail}
     onChange={(e) => setTargetKeywordsLongTail(e.target.value)}
     placeholder={t("seoTagLongTailPlaceholder")}
     className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700/50 border pg-border rounded-lg outline-none pg-text-heading focus:ring-1 focus:ring-blue-500"
    />
   </div>
  </div>
 </div>

 {/* Composition Sliders */}
 {hasRequiredComposition ? (
   <CompositionSliderGroup
     value={videoConfig.composition}
     onChange={(val) => handleVideoConfigChange("composition", val)}
   />
 ) : (
   <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border pg-border rounded-lg text-xs pg-text-muted">
     <div className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-200 mb-1">
       <span>Komposisi Naskah: Model Terpadu ({currentArchetype?.name || "Archetype Non-Standar"})</span>
       <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
         {effectiveNarrationMode}
       </span>
     </div>
     <p className="text-[11px]">
       Archetype ini menggunakan alur emosional terpadu (<em>{currentArchetype?.emotionalArcTemplate}</em>) tanpa pembagian persentase komposisi edukasi/hiburan/marketing terpisah.
     </p>
   </div>
 )}

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

 {/* ── Affiliate Product Angle ── */}
 <label className="flex items-center space-x-2 col-span-2">
 <input
 type="checkbox"
 id="affiliateAngleCheckbox"
 checked={affiliateAngle}
 onChange={(e) => setAffiliateAngle(e.target.checked)}
 className="rounded"
 />
 <span>{t("affiliateAngle")}</span>
 </label>
 {affiliateAngle && (
 <div className="col-span-2 pl-4 md:pl-5 border-l-2 border-orange-300 dark:border-orange-700/50 space-y-3 py-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
 <p className="text-[10px] pg-text-muted">{t("affiliateAngleDesc")}</p>
 {/* Mode SOFT / CTA */}
 <div className="flex flex-col gap-1.5">
 <label className="flex items-start gap-2 cursor-pointer">
 <input type="radio" id="affiliateAngleModeSoft" name="affiliateAngleMode" value="SOFT"
 checked={affiliateAngleMode === "SOFT"} onChange={() => setAffiliateAngleMode("SOFT")}
 className="mt-0.5 rounded-full" />
 <div>
 <span className="text-xs font-medium pg-text-heading">{t("affiliateAngleModeSoft")}</span>
 <p className="text-[10px] pg-text-muted">{t("affiliateAngleModeSoftDesc")}</p>
 </div>
 </label>
 <label className="flex items-start gap-2 cursor-pointer">
 <input type="radio" id="affiliateAngleModeCTA" name="affiliateAngleMode" value="CTA"
 checked={affiliateAngleMode === "CTA"} onChange={() => setAffiliateAngleMode("CTA")}
 className="mt-0.5 rounded-full" />
 <div>
 <span className="text-xs font-medium pg-text-heading">{t("affiliateAngleModeCTA")}</span>
 <p className="text-[10px] pg-text-muted">{t("affiliateAngleModeCTADesc")}</p>
 </div>
 </label>
 </div>
 {/* Marketplace Selection */}
 <div className="border-t border-orange-200 dark:border-orange-700 pt-2.5 space-y-2">
 <p className="text-[10px] font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">🛒 Marketplace Rekomendasi</p>
 <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
 {MARKETPLACE_OPTIONS.map(mp => (
 <label key={mp.key} className="flex items-center gap-1.5 cursor-pointer">
 <input
 type="checkbox"
 id={`marketplace-${mp.key}`}
 checked={affiliateMarketplaces.includes(mp.key)}
 onChange={(e) => {
 if (e.target.checked) {
 setAffiliateMarketplaces(prev => [...prev, mp.key]);
 } else {
 setAffiliateMarketplaces(prev => prev.filter(k => k !== mp.key));
 }
 }}
 className="rounded"
 />
 <span className="text-xs pg-text-sub">{mp.label}</span>
 </label>
 ))}
 </div>
 {affiliateMarketplaces.includes("custom") && (
 <div className="mt-1.5">
 <p className="text-[10px] pg-text-muted mb-1">Base URL pencarian (contoh: https://bukalapak.com/products?search=)</p>
 <input
 type="url"
 id="affiliateCustomUrl"
 value={affiliateCustomUrl}
 onChange={(e) => setAffiliateCustomUrl(e.target.value)}
 placeholder="https://example.com/search?q="
 className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-orange-400 outline-none dark:text-white"
 />
 </div>
 )}
 </div>
 </div>
 )}
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white mb-2"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"
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
 <div className="glass-panel shadow-lg rounded-xl p-6 flex flex-col md:h-[85vh] min-h-[50vh]">
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white"
 />
 </div>
 <div className="flex flex-wrap gap-2">
 {type === "VIDEO" ? (
 <button
 type="button"
 onClick={async () => {
 try {
 const scenePromptPayload = {
 rawText: generatedPrompt,
 selectedChannelId: channelId,
 ar: videoConfig.aspectRatio || "9:16",
 };
 try {
 localStorage.setItem("scenePromptState", JSON.stringify(scenePromptPayload));
 } catch {}
 await fetch("/api/user/preferences", {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ scenePromptState: scenePromptPayload })
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
 className="px-3 py-2 text-sm font-medium pg-text-sub bg-white dark:bg-slate-700 border pg-border rounded-md hover:pg-surface-dim dark:pg-text-muted transition-colors"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white"
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
 className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white"
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
