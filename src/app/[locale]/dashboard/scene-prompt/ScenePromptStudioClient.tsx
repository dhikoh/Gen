"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import sanitizeHtml from "sanitize-html";
import {
  extractTitles,
  extractChosenTitle,
  extractThumbnailData,
  extractCaption,
  extractHashtags,
  extractHtmlBlog,
  extractBlogPublishingPack,
  extractAffiliateRecommendations,
  parseScenes,
  extractRemotionCode,
  cleanNarasiForTts,
  countWords,
  estimateExpressivePauseSeconds,
  estimateNarrationDuration,
  calculateScriptTiming,
  extractThreeTierSeo,
  formatAsYouTubeTags,
  formatAsHashtags,
  buildCombinedYouTubeTags,
  detectOutputStructure,
  extractSourceAudit,
  parseFunnelPack,
  extractMultiPlatformSeo,
  evaluatePlatformSeoStatus,
  normalizeScriptWhitespace,
} from "@/lib/parsers";
import type { ThumbnailData, AffiliateRecommendation, Scene, ThreeTierSeoData, BlogPublishingPack, MultiPlatformSeoData, PlatformSeoItem } from "@/lib/parsers";
import type { FunnelPackData, SourceAuditData } from "@/types/generator";
import { GEMINI_TTS_VOICES, GEMINI_TTS_MODELS, DEFAULT_TTS_VOICE, DEFAULT_TTS_MODEL, TTS_PITCH_PRESETS, DEFAULT_TTS_PITCH, type TtsPitchPresetId } from "@/lib/ttsVoices";
import {
  buildOverlayVisualCopyText,
  buildBatchExportText,
  buildUnifiedVisualPrompt,
  DEFAULT_BATCH_EXPORT_FILTER,
  type SceneForExport,
  type BatchExportFilterOptions,
} from "@/lib/sceneExportFormat";
import { getUserItem, setUserItem } from "@/lib/clientStorage";
import VideoTimelineTab from "@/components/video/VideoTimelineTab";
import { DrivePackageUploadModal } from "@/components/video/DrivePackageUploadModal";
import { AutoPublishModal } from "@/components/publish/AutoPublishModal";
import { formatPlatformSeoText } from "@/lib/gdrivePackageFormat";
import { buildTimeline, validateTimeline } from "@/lib/timelineBuilder";
import type { VideoTimeline } from "@/types/videoTimeline";

export interface SerializedParsedOutput {
  id: string;
  rawInput: string;
  parsedResult: unknown;
  createdAt: string;
}

function formatHistoryDate(dateStr: string, locale?: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return locale === "id" ? "Baru saja" : "Just now";
    if (diffMins < 60) return `${diffMins} ${locale === "id" ? "menit lalu" : "min ago"}`;
    if (diffHours < 24) return `${diffHours} ${locale === "id" ? "jam lalu" : "hours ago"}`;

    return d.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

interface Channel {
  id: string;
  channelName: string;
  niche?: string | null;
  speechRate?: number | null;
}
interface Props {
  channels: Channel[];
  locale: string;
  planFeatures: { textToSpeechStudio: boolean; fullVideoStudio?: boolean; remotionStudio?: boolean; googleDriveUpload?: boolean };
  initialDraft?: {
    id?: string;
    title?: string | null;
    channelId?: string | null;
    rawJson: string;
    parsedData?: unknown;
    estimatedDurationSec?: number | null;
    wordCount?: number | null;
  };
  initialParsedOutputs?: SerializedParsedOutput[];
  userId: string;
}

interface TtsResult {
  status: "idle" | "generating" | "done" | "error";
  audioBase64?: string;
  mimeType?: string;
  errorMessage?: string;
  durationSec?: number; // durasi audio, dibaca dari onLoadedMetadata
}

const BLOG_SANITIZE_OPTIONS = {
  allowedTags: [
    "h1","h2","h3","h4","h5","h6","p","ul","ol","li","strong","em","b","i","a","br","hr","blockquote","pre","code",
    "table","thead","tbody","tfoot","tr","th","td","caption","colgroup","col",
    "svg","g","path","rect","circle","line","polyline","polygon","text","defs","linearGradient","stop",
    "div","span","label","input","button","select","option","output"
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    table: ["class", "style", "border", "cellpadding", "cellspacing"],
    thead: ["class", "style"],
    tbody: ["class", "style"],
    tfoot: ["class", "style"],
    tr: ["class", "style"],
    th: ["class", "style", "scope", "colspan", "rowspan"],
    td: ["class", "style", "colspan", "rowspan"],
    caption: ["class", "style"],
    svg: ["class", "style", "width", "height", "viewBox", "xmlns", "fill", "stroke"],
    g: ["class", "style", "fill", "stroke", "transform"],
    path: ["class", "style", "d", "fill", "stroke", "stroke-width"],
    rect: ["class", "style", "x", "y", "width", "height", "rx", "ry", "fill", "stroke"],
    circle: ["class", "style", "cx", "cy", "r", "fill", "stroke"],
    line: ["class", "style", "x1", "y1", "x2", "y2", "stroke", "stroke-width"],
    polyline: ["class", "style", "points", "fill", "stroke"],
    polygon: ["class", "style", "points", "fill", "stroke"],
    text: ["class", "style", "x", "y", "fill", "font-size", "font-weight", "text-anchor"],
    div: ["class", "style", "id"],
    span: ["class", "style", "id"],
    label: ["class", "style", "for"],
    input: ["class", "style", "type", "id", "name", "value", "placeholder", "min", "max", "step", "oninput", "change"],
    button: ["class", "style", "type", "id", "onclick"],
    select: ["class", "style", "id", "name", "onchange"],
    option: ["value", "selected"],
    output: ["class", "style", "id", "for"]
  }
};

function buildBlogIframeDoc(htmlContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.7;
      color: #e2e8f0;
      background: #090d16;
      padding: 1.5rem;
      margin: 0;
    }
    h1 { font-size: 1.75rem; color: #f8fafc; margin-bottom: 1rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.5rem; }
    h2 { font-size: 1.35rem; color: #38bdf8; margin-top: 1.75rem; margin-bottom: 0.75rem; }
    h3 { font-size: 1.15rem; color: #34d399; margin-top: 1.25rem; margin-bottom: 0.5rem; }
    p { margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.9rem; }
    th { background: #0f172a; color: #38bdf8; text-align: left; padding: 0.6rem 0.8rem; border: 1px solid #334155; }
    td { padding: 0.6rem 0.8rem; border: 1px solid #334155; }
    caption { font-size: 0.8rem; color: #94a3b8; text-align: right; margin-top: 0.4rem; font-style: italic; }
    svg { max-width: 100%; height: auto; display: block; margin: 1.25rem auto; }
    .interactive-calculator {
      background: #0f172a;
      border: 1px solid #0284c7;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin: 1.5rem 0;
    }
    input, select {
      background: #1e293b;
      border: 1px solid #475569;
      color: #f8fafc;
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
      margin: 0.4rem 0;
      font-size: 0.9rem;
    }
    button {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: background 0.2s;
    }
    button:hover { background: #0369a1; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
}


export default function ScenePromptStudioClient({ channels, locale, planFeatures, initialDraft, initialParsedOutputs = [], userId }: Props) {
  const t = useTranslations("ScenePromptStudio");
  const tVideo = useTranslations("VideoStudio");

  const initialSpeechRate = useMemo(() => {
    if (initialDraft?.parsedData && typeof initialDraft.parsedData === "object" && "speechRate" in (initialDraft.parsedData as Record<string, unknown>)) {
      const rate = Number((initialDraft.parsedData as Record<string, unknown>).speechRate);
      if (!isNaN(rate) && rate > 0) return rate;
    }
    const ch = channels.find((c) => c.id === initialDraft?.channelId) || channels[0];
    if (ch?.speechRate && !isNaN(ch.speechRate) && ch.speechRate > 0) {
      return ch.speechRate;
    }
    return 0.35;
  }, [channels, initialDraft]);

  const [speechRate, setSpeechRate] = useState<number>(initialSpeechRate);

  // Determine initial default source (memoized to prevent recalculation and reference instability)
  // 1. initialDraft (navigating with ?draftId=)
  // 2. initialParsedOutputs[0] (latest parse from database memory)
  const defaultSource = useMemo(() => {
    if (initialDraft?.rawJson) {
      const isFunnel = detectOutputStructure(initialDraft.rawJson) === "FUNNEL_BUNDLE";
      if (isFunnel) {
        const fp = parseFunnelPack(initialDraft.rawJson, initialSpeechRate);
        return {
          raw: initialDraft.rawJson,
          parsed: fp.segments.short1.scenes,
          id: initialDraft.id,
          isDraft: true,
          funnelPack: fp,
        };
      }
      return {
        raw: initialDraft.rawJson,
        parsed: parseScenes(initialDraft.rawJson, initialSpeechRate),
        id: initialDraft.id,
        isDraft: true,
      };
    }
    if (initialParsedOutputs.length > 0) {
      const raw = initialParsedOutputs[0].rawInput;
      const isFunnel = detectOutputStructure(raw) === "FUNNEL_BUNDLE";
      if (isFunnel) {
        const fp = parseFunnelPack(raw, initialSpeechRate);
        return {
          raw,
          parsed: fp.segments.short1.scenes,
          id: initialParsedOutputs[0].id,
          isDraft: false,
          funnelPack: fp,
        };
      }
      return {
        raw,
        parsed:
          Array.isArray(initialParsedOutputs[0].parsedResult) &&
          (initialParsedOutputs[0].parsedResult as unknown[]).length > 0
            ? (initialParsedOutputs[0].parsedResult as Scene[])
            : parseScenes(initialParsedOutputs[0].rawInput, initialSpeechRate),
        id: initialParsedOutputs[0].id,
        isDraft: false,
      };
    }
    return null;
  }, [initialDraft, initialParsedOutputs, initialSpeechRate]);

  const [rawText, setRawText] = useState(defaultSource?.raw || "");
  const [funnelPackData, setFunnelPackData] = useState<FunnelPackData | null>(() => {
    if (defaultSource && "funnelPack" in defaultSource && defaultSource.funnelPack) {
      return defaultSource.funnelPack as FunnelPackData;
    }
    if (defaultSource?.raw && detectOutputStructure(defaultSource.raw) === "FUNNEL_BUNDLE") {
      return parseFunnelPack(defaultSource.raw, initialSpeechRate);
    }
    return null;
  });
  const [activeFunnelSegment, setActiveFunnelSegment] = useState<"short1" | "short2" | "long">("short1");
  const [isSourceAuditOpen, setIsSourceAuditOpen] = useState(true);
  const [scenes, setScenes] = useState<Scene[]>(() => defaultSource?.parsed || []);

  const timingSummary = useMemo(() => {
    return calculateScriptTiming(scenes, speechRate);
  }, [scenes, speechRate]);
  const [caption, setCaption] = useState(() => (defaultSource?.raw ? extractCaption(defaultSource.raw) : ""));
  const [hashtags, setHashtags] = useState(() => (defaultSource?.raw ? extractHashtags(defaultSource.raw) : ""));
  const [thumbnailData, setThumbnailData] = useState<ThumbnailData | null>(() => (defaultSource?.raw ? extractThumbnailData(defaultSource.raw) : null));
  const [threeTierSeo, setThreeTierSeo] = useState<ThreeTierSeoData | null>(() => (defaultSource?.raw ? extractThreeTierSeo(defaultSource.raw) : null));
  const [multiPlatformSeo, setMultiPlatformSeo] = useState<MultiPlatformSeoData | null>(() => (defaultSource?.raw ? extractMultiPlatformSeo(defaultSource.raw) : null));
  const [selectedPlatformTab, setSelectedPlatformTab] = useState<"youtube" | "tiktok" | "instagram" | "facebook">("youtube");
  const [parsedTitles, setParsedTitles] = useState<string[]>(() => (defaultSource?.raw ? extractTitles(defaultSource.raw) : []));
  const [draftTitle, setDraftTitle] = useState(() => {
    if (initialDraft?.title) return initialDraft.title;
    if (defaultSource?.raw) {
      return extractChosenTitle(defaultSource.raw) || extractTitles(defaultSource.raw)[0] || "";
    }
    return "";
  });
  const [selectedChannelId, setSelectedChannelId] = useState(() => {
    if (initialDraft?.channelId && channels.some((c) => c.id === initialDraft.channelId)) {
      return initialDraft.channelId;
    }
    return channels[0]?.id || "";
  });
  const [ar, setAr] = useState("9:16");
  const [thumbAr, setThumbAr] = useState<"16:9" | "9:16">("16:9");
  const [sref, setSref] = useState("");
  const [cref, setCref] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"scenes"|"thumbnail"|"platform"|"voiceStudio"|"htmlBlog"|"seo2026"|"fullVideo">("scenes");
  const [currentTimeline, setCurrentTimeline] = useState<VideoTimeline | null>(null);
  const [markedTitles, setMarkedTitles] = useState<string[]>([]);
  const [blogPack, setBlogPack] = useState<BlogPublishingPack>(() =>
    extractBlogPublishingPack(defaultSource?.raw || "")
  );
  const [blogPreviewMode, setBlogPreviewMode] = useState<"interactive" | "standard" | "code">("interactive");
  const [htmlBlog, setHtmlBlog] = useState(() => (defaultSource?.raw ? extractHtmlBlog(defaultSource.raw) : ""));
  const [affiliateRecs, setAffiliateRecs] = useState<AffiliateRecommendation[]>(() => (defaultSource?.raw ? extractAffiliateRecommendations(defaultSource.raw) : []));
  const [detectedRemotionCode, setDetectedRemotionCode] = useState<string | null>(() => (defaultSource?.raw ? extractRemotionCode(defaultSource.raw) : null));
  const [completedChecklist, setCompletedChecklist] = useState<Record<number, boolean>>({});
  const [drivePackageModalOpen, setDrivePackageModalOpen] = useState(false);
  const [autoPublishModalOpen, setAutoPublishModalOpen] = useState(false);
  const currentChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId) || channels[0],
    [channels, selectedChannelId]
  );

  const switchFunnelSegment = useCallback((segId: "short1" | "short2" | "long") => {
    if (!funnelPackData) return;
    setActiveFunnelSegment(segId);
    const target = funnelPackData.segments[segId];
    if (target.title) setDraftTitle(target.title);
    setScenes(target.scenes);
    setAr(target.aspectRatio);
    setSelectedSceneIds(new Set(target.scenes.map((s) => s.id)));
    if (target.caption) setCaption(target.caption);
    if (target.hashtags) setHashtags(target.hashtags);
    if (target.thumbnailData) {
      setThumbnailData(target.thumbnailData);
    } else if (segId === "long" && funnelPackData.segments.long.thumbnailData) {
      setThumbnailData(funnelPackData.segments.long.thumbnailData);
    }
    if (target.multiPlatformSeo) {
      setMultiPlatformSeo(target.multiPlatformSeo);
    } else if (funnelPackData.multiPlatformSeo) {
      setMultiPlatformSeo(funnelPackData.multiPlatformSeo);
    }
  }, [funnelPackData]);

  // Parse History state (10 latest)
  const [historyList, setHistoryList] = useState<SerializedParsedOutput[]>(initialParsedOutputs);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    !initialDraft && defaultSource?.id ? defaultSource.id : null
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyDropdownRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const lastLoadedDraftIdRef = useRef<string | null>(initialDraft?.id || null);

 // ── TTS State ──
 const [ttsVoice, setTtsVoice] = useState(DEFAULT_TTS_VOICE);
 const [ttsModel, setTtsModel] = useState<string>(DEFAULT_TTS_MODEL);
 const [ttsStyleInstruction, setTtsStyleInstruction] = useState("");
 const [ttsSpeed, setTtsSpeed] = useState(1.0);
 const [ttsPitch, setTtsPitch] = useState<TtsPitchPresetId>(DEFAULT_TTS_PITCH);
 const [ttsResults, setTtsResults] = useState<Record<number, TtsResult>>({});
 const [ttsGeneratingAll, setTtsGeneratingAll] = useState(false);
 const [ttsMergedAudio, setTtsMergedAudio] = useState<string | null>(null);
 const [ttsMerging, setTtsMerging] = useState(false);
  const [ttsPreviewText, setTtsPreviewText] = useState("");
  const [ttsPreviewResult, setTtsPreviewResult] = useState<TtsResult | null>(null);

  // ── Voice Filter, Search & Favorite State ──
  const [favoriteVoices, setFavoriteVoices] = useState<string[]>(() => {
    try {
      const saved = getUserItem(userId, "promptgen_favorite_voices");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [ttsVoiceFilter, setTtsVoiceFilter] = useState<"all" | "favorites" | "male" | "female">("all");
  const [ttsVoiceSearch, setTtsVoiceSearch] = useState("");

  const toggleFavoriteVoice = useCallback((voiceId: string) => {
    setFavoriteVoices(prev => {
      const next = prev.includes(voiceId) ? prev.filter(id => id !== voiceId) : [...prev, voiceId];
      setUserItem(userId, "promptgen_favorite_voices", JSON.stringify(next));
      return next;
    });
  }, [userId]);

  const filteredVoices = React.useMemo(() => {
    let list = [...GEMINI_TTS_VOICES];

    // Filter gender / favorites
    if (ttsVoiceFilter === "favorites") {
      list = list.filter(v => favoriteVoices.includes(v.id));
    } else if (ttsVoiceFilter === "male") {
      list = list.filter(v => v.gender === "Male");
    } else if (ttsVoiceFilter === "female") {
      list = list.filter(v => v.gender === "Female");
    }

    // Filter search
    if (ttsVoiceSearch.trim()) {
      const q = ttsVoiceSearch.toLowerCase().trim();
      list = list.filter(v =>
        v.id.toLowerCase().includes(q) ||
        v.tone.toLowerCase().includes(q) ||
        v.bestFor.toLowerCase().includes(q) ||
        v.styleHint.toLowerCase().includes(q)
      );
    }

    // Sort: favorites first, then A-Z
    return list.sort((a, b) => {
      const aFav = favoriteVoices.includes(a.id);
      const bFav = favoriteVoices.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.id.localeCompare(b.id);
    });
  }, [ttsVoiceFilter, ttsVoiceSearch, favoriteVoices]);

  // Ensure currently selected voice is never orphaned in select dropdown
  const displayVoices = React.useMemo(() => {
    if (filteredVoices.some(v => v.id === ttsVoice)) return filteredVoices;
    const curr = GEMINI_TTS_VOICES.find(v => v.id === ttsVoice);
    return curr ? [curr, ...filteredVoices] : filteredVoices;
  }, [filteredVoices, ttsVoice]);

  // Channel Smart Recommendation
  const activeChannel = React.useMemo(() => channels.find(c => c.id === selectedChannelId), [channels, selectedChannelId]);
  const isRecommendedForChannel = React.useMemo(() => {
    if (!activeChannel?.niche) return false;
    const currentVoice = GEMINI_TTS_VOICES.find(v => v.id === ttsVoice);
    if (!currentVoice) return false;
    const nicheWords = activeChannel.niche.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const bestForText = (currentVoice.bestFor + " " + currentVoice.tone).toLowerCase();
    return nicheWords.some(word => bestForText.includes(word));
  }, [activeChannel, ttsVoice]);

  // ── Batch Selection State (Fitur 3) ──
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<number>>(() => {
    if (defaultSource?.parsed && defaultSource.parsed.length > 0) {
      return new Set(defaultSource.parsed.map(s => s.id));
    }
    return new Set();
  });
  const [batchFilter, setBatchFilter] = useState<BatchExportFilterOptions>(DEFAULT_BATCH_EXPORT_FILTER);

  // Click outside to close history dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target as Node)) {
        setHistoryOpen(false);
      }
    };
    if (historyOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [historyOpen]);

  // Handover effect when navigating with initialDraft
  useEffect(() => {
    if (initialDraft?.rawJson && lastLoadedDraftIdRef.current !== (initialDraft.id || null)) {
      lastLoadedDraftIdRef.current = initialDraft.id || null;
      const raw = initialDraft.rawJson;
      queueMicrotask(() => {
        setRawText(raw);
        if (initialDraft.title) setDraftTitle(initialDraft.title);
        if (initialDraft.channelId && channels.some((c) => c.id === initialDraft.channelId)) {
          setSelectedChannelId(initialDraft.channelId);
        }
        let draftSpeechRate = speechRate;
        if (initialDraft.parsedData && typeof initialDraft.parsedData === "object" && "speechRate" in (initialDraft.parsedData as Record<string, unknown>)) {
          const rate = Number((initialDraft.parsedData as Record<string, unknown>).speechRate);
          if (!isNaN(rate) && rate > 0) {
            draftSpeechRate = rate;
            setSpeechRate(rate);
          }
        }
        const isFunnel = detectOutputStructure(raw) === "FUNNEL_BUNDLE";
        if (isFunnel) {
          const fp = parseFunnelPack(raw, draftSpeechRate);
          setFunnelPackData(fp);
          setActiveFunnelSegment("short1");
          setScenes(fp.segments.short1.scenes);
          setAr(fp.segments.short1.aspectRatio);
          setSelectedSceneIds(new Set(fp.segments.short1.scenes.map((s) => s.id)));
          setCaption(fp.segments.short1.caption || extractCaption(raw));
          setHashtags(fp.segments.short1.hashtags || extractHashtags(raw));
          setThumbnailData(fp.segments.long.thumbnailData || extractThumbnailData(raw));
          setThreeTierSeo(fp.threeTierSeo || extractThreeTierSeo(raw));
          setMultiPlatformSeo(fp.segments.short1.multiPlatformSeo || fp.multiPlatformSeo || extractMultiPlatformSeo(raw));
        } else {
          setFunnelPackData(null);
          const parsed = parseScenes(raw, draftSpeechRate);
          setScenes(parsed);
          setSelectedSceneIds(new Set(parsed.map((s) => s.id)));
          setCaption(extractCaption(raw));
          setHashtags(extractHashtags(raw));
          setThumbnailData(extractThumbnailData(raw));
          setThreeTierSeo(extractThreeTierSeo(raw));
          setMultiPlatformSeo(extractMultiPlatformSeo(raw));
        }
        const titles = extractTitles(raw);
        setParsedTitles(titles);
        if (!initialDraft.title) {
          const chosen = extractChosenTitle(raw) || titles[0] || "";
          if (chosen) setDraftTitle(chosen);
        }
        const pack = extractBlogPublishingPack(raw);
        setBlogPack(pack);
        setHtmlBlog(pack.html);
        setAffiliateRecs(extractAffiliateRecommendations(raw));
        toast.success(t("draftLoadedSuccess"));
      });
    }
  }, [initialDraft, channels, speechRate, t]);

 // ── TTS Functions (Fitur 1) ──
 const buildTtsInputText = useCallback((scene: Scene) => {
   let text = cleanNarasiForTts(scene.narasi || "");
   if (scene.voiceGuidelines) {
     const vg = scene.voiceGuidelines;
     const hints: string[] = [];
     if (vg.traits) hints.push(vg.traits);
     if (vg.directorsNote) hints.push(vg.directorsNote);
     if (hints.length) text = `[${hints.join("; ")}] ${text}`;
   }
   return text;
 }, []);

 const generateSceneTts = useCallback(async (scene: Scene) => {
   setTtsResults(prev => ({ ...prev, [scene.id]: { status: "generating" } }));
   try {
     const text = buildTtsInputText(scene);
     // Cari pitch instruction dari preset yang dipilih
     const pitchPreset = TTS_PITCH_PRESETS.find(p => p.id === ttsPitch);
     const pitchInstruction = pitchPreset?.instruction || undefined;
     const res = await fetch("/api/tts/generate", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         text,
         voice: ttsVoice,
         model: ttsModel,
         styleInstruction: ttsStyleInstruction || undefined,
         speakingRate: ttsSpeed !== 1.0 ? ttsSpeed : undefined,
         pitchInstruction,
       }),
     });
     const data = await res.json();
     if (data.success) {
       setTtsResults(prev => ({ ...prev, [scene.id]: { status: "done", audioBase64: data.audioBase64, mimeType: data.mimeType } }));
       if (data.fallbackOccurred) toast(t("ttsFallbackUsed"), { icon: "⚠️" });
     } else {
       setTtsResults(prev => ({ ...prev, [scene.id]: { status: "error", errorMessage: data.error || t("generalError") } }));
       toast.error(data.error || t("generalError"));
     }
   } catch {
     setTtsResults(prev => ({ ...prev, [scene.id]: { status: "error", errorMessage: t("generalError") } }));
   }
 }, [buildTtsInputText, ttsVoice, ttsModel, ttsStyleInstruction, ttsSpeed, ttsPitch, t]);

 const generateAllScenesTts = useCallback(async () => {
   const eligible = scenes.filter(s => s.narasi !== "—" && !s.isDiegetic);
   if (!eligible.length) { toast.error(t("noNarrationToCopy")); return; }
   setTtsGeneratingAll(true);
   // Controlled concurrency=2
   const queue = [...eligible];
   const runNext = async (): Promise<void> => {
     const scene = queue.shift();
     if (!scene) return;
     await generateSceneTts(scene);
     return runNext();
   };
   await Promise.all([runNext(), runNext()]);
   setTtsGeneratingAll(false);
   toast.success(t("ttsAllDone"));
 }, [scenes, generateSceneTts, t]);

 const downloadAllAsZip = useCallback(async () => {
   const doneScenes = scenes.filter(s => ttsResults[s.id]?.status === "done" && ttsResults[s.id]?.audioBase64);
   if (!doneScenes.length) return;
   const JSZip = (await import("jszip")).default;
   const zip = new JSZip();
   doneScenes.forEach(s => {
     const result = ttsResults[s.id];
     if (result?.audioBase64) {
       const buf = Uint8Array.from(atob(result.audioBase64), c => c.charCodeAt(0));
       zip.file(`${s.sceneNumber.replace(/\s+/g, "_")}.wav`, buf);
     }
   });
   const blob = await zip.generateAsync({ type: "blob" });
   const url = URL.createObjectURL(blob);
   const a = document.createElement("a");
   a.href = url; a.download = `voice_studio_${draftTitle || "scenes"}.zip`;
   a.click();
   setTimeout(() => URL.revokeObjectURL(url), 2000);
   toast.success(t("ttsZipDownloaded"));
 }, [scenes, ttsResults, draftTitle, t]);

  // ── Preview satu teks pendek dengan settings saat ini ──
  const generatePreview = useCallback(async () => {
    const text = cleanNarasiForTts(ttsPreviewText.trim());
    if (!text) return;
    setTtsPreviewResult({ status: "generating" });
    try {
      const pitchPreset = TTS_PITCH_PRESETS.find(p => p.id === ttsPitch);
      const pitchInstruction = pitchPreset?.instruction || undefined;
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: ttsVoice,
          model: ttsModel,
          styleInstruction: ttsStyleInstruction || undefined,
          speakingRate: ttsSpeed !== 1.0 ? ttsSpeed : undefined,
          pitchInstruction,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTtsPreviewResult({ status: "done", audioBase64: data.audioBase64, mimeType: data.mimeType });
      } else {
        setTtsPreviewResult({ status: "error", errorMessage: data.error || t("ttsPreviewError") });
        toast.error(data.error || t("ttsPreviewError"));
      }
    } catch {
      setTtsPreviewResult({ status: "error", errorMessage: t("ttsPreviewError") });
    }
  }, [ttsPreviewText, ttsVoice, ttsModel, ttsStyleInstruction, ttsSpeed, ttsPitch, t]);

 // Generate All lalu gabungkan semua audio menjadi satu WAV
 const generateAndMergeAll = useCallback(async () => {
   const eligible = scenes.filter(s => s.narasi !== "—" && !s.isDiegetic);
   if (!eligible.length) { toast.error(t("noNarrationToCopy")); return; }

   // 1. Generate semua scene yang belum punya audio
   setTtsGeneratingAll(true);
   setTtsMergedAudio(null);
   const queue = [...eligible.filter(s => ttsResults[s.id]?.status !== "done")];
   if (queue.length > 0) {
     const runNext = async (): Promise<void> => {
       const scene = queue.shift();
       if (!scene) return;
       await generateSceneTts(scene);
       return runNext();
     };
     await Promise.all([runNext(), runNext()]);
   }
   setTtsGeneratingAll(false);

   // 2. Kumpulkan semua audioBase64 yang berhasil (urut sesuai scene)
   const doneBase64 = eligible
     .map(s => ttsResults[s.id]?.audioBase64)
     .filter((b): b is string => !!b);

   if (doneBase64.length === 0) {
     toast.error(t("ttsMergeError"));
     return;
   }

   // 3. Kirim ke /api/tts/merge untuk digabung server-side
   setTtsMerging(true);
   try {
     const res = await fetch("/api/tts/merge", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ audioBase64: doneBase64 }),
     });
     const data = await res.json();
     if (data.success) {
       setTtsMergedAudio(data.audioBase64);
       toast.success(t("ttsMergeSuccess"));
     } else {
       toast.error(data.error || t("ttsMergeError"));
     }
   } catch {
     toast.error(t("ttsMergeError"));
   } finally {
     setTtsMerging(false);
   }
 }, [scenes, ttsResults, generateSceneTts, t]);

 const downloadMergedAudio = useCallback(() => {
   if (!ttsMergedAudio) return;
   const a = document.createElement("a");
   a.href = `data:audio/wav;base64,${ttsMergedAudio}`;
   a.download = `full_vo_${draftTitle || "scenes"}.wav`;
   a.click();
 }, [ttsMergedAudio, draftTitle]);

 // ── Batch Export Functions (Fitur 2 & 3) ──
 const handleCopyOverlayVisual = useCallback((scene: Scene) => {
   const text = buildOverlayVisualCopyText(scene as SceneForExport, locale);
   if (!text) { toast.error(t("generalError")); return; }
   navigator.clipboard.writeText(text).then(() => {
     setCopiedId(`ov-vis-${scene.id}`);
     setTimeout(() => setCopiedId(null), 2000);
     toast.success(t("copyOverlayVisualSuccess"));
   });
 }, [t, locale]);

 const handleCopyBatchExport = useCallback(() => {
   const selected = scenes.filter(s => selectedSceneIds.has(s.id));
   if (!selected.length) { toast.error(t("selectAtLeastOneScene")); return; }
   const text = buildBatchExportText(selected as SceneForExport[], batchFilter, locale);
   navigator.clipboard.writeText(text).then(() => {
     setCopiedId("batch-export");
     setTimeout(() => setCopiedId(null), 2000);
     toast.success(t("batchExportCopied"));
   });
 }, [scenes, selectedSceneIds, batchFilter, t, locale]);

 const toggleAllScenes = useCallback(() => {
   if (selectedSceneIds.size === scenes.length) {
     setSelectedSceneIds(new Set());
   } else {
     setSelectedSceneIds(new Set(scenes.map(s => s.id)));
   }
 }, [scenes, selectedSceneIds]);

 const toggleScene = useCallback((id: number) => {
   setSelectedSceneIds(prev => {
     const next = new Set(prev);
     if (next.has(id)) next.delete(id); else next.add(id);
     return next;
   });
 }, []);

 const handleMarkAsUsed = async (title: string) => {
  if (!selectedChannelId) { toast.error(t("selectChannelFirst")); return; }
  try {
  const res = await fetch("/api/drafts/import-titles", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
  channelId: selectedChannelId,
  type: "VIDEO",
  titles: [title]
  })
  });
  if (res.ok) {
  setMarkedTitles(prev => [...prev, title]);
  toast.success(t("markTitleSuccess"));
  } else {
  toast.error(t("markTitleFail"));
  }
  } catch {
  toast.error(t("generalError"));
  }
  };

  // "Pilih" hanya mengatur draftTitle.
  // "Simpan ke Direktori" adalah aksi terpisah via tombol eksplisit (handleMarkAsUsed).
  const handleSelectTitle = (title: string) => {
    setDraftTitle(title);
  };

  // Sinkronisasi otomatis judul terpakai channel aktif ke markedTitles
  useEffect(() => {
    if (!selectedChannelId) return;
    let ignore = false;
    async function loadChannelUsedTitles() {
      try {
        const res = await fetch(
          `/api/drafts/export?channelId=${selectedChannelId}&type=VIDEO&format=json&_t=${Date.now()}`
        );
        if (res.ok && !ignore) {
          const data = await res.json();
          if (Array.isArray(data.titles)) {
            const existing = data.titles
              .map((item: { title: string }) => item.title)
              .filter(Boolean);
            setMarkedTitles((prev) => {
              const seen = new Set(prev.map((t) => t.trim().toLowerCase()));
              const next = [...prev];
              for (const title of existing) {
                const key = title.trim().toLowerCase();
                if (!seen.has(key)) {
                  seen.add(key);
                  next.push(title);
                }
              }
              return next;
            });
          }
        }
      } catch (err) {
        console.error("Failed to load used titles for channel:", err);
      }
    }
    loadChannelUsedTitles();
    return () => {
      ignore = true;
    };
  }, [selectedChannelId]);

  // Audio map from Voice Studio TTS results
  const audioMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const [sceneIdStr, result] of Object.entries(ttsResults)) {
      if (result?.status === "done" && result.audioBase64) {
        map.set(Number(sceneIdStr), `data:${result.mimeType || "audio/wav"};base64,${result.audioBase64}`);
      }
    }
    return map;
  }, [ttsResults]);

  // Sumber data judul terpakai. Diambil SEKALI per channel, bukan setiap TTS selesai.
  const [usedTitles, setUsedTitles] = useState<{ ids: string[]; texts: string[] }>({
    ids: [],
    texts: [],
  });

  useEffect(() => {
    if (!selectedChannelId) {
      queueMicrotask(() => {
        setUsedTitles({ ids: [], texts: [] });
      });
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/used-titles?channelId=${selectedChannelId}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const titles = (await res.json()) as { id: string; title: string }[];
          setUsedTitles({
            ids: titles.map((item) => item.id),
            texts: titles.map((item) => item.title),
          });
        }
      } catch {
        if (!controller.signal.aborted) setUsedTitles({ ids: [], texts: [] });
      }
    })();
    return () => controller.abort();
  }, [selectedChannelId]);

  useEffect(() => {
    if (scenes.length === 0) {
      queueMicrotask(() => {
        setCurrentTimeline(null);
      });
      return;
    }
    const tl = buildTimeline(scenes as SceneForExport[], {
      draftId: initialDraft?.id ?? "",
      channelId: selectedChannelId ?? null,
      usedTitleIds: usedTitles.ids,
      usedTitleTexts: usedTitles.texts,
      defaultDurationSec: 4,
    });
    if (audioMap.size > 0) {
      tl.scenes = tl.scenes.map((s) => ({
        ...s,
        audioRef: audioMap.get(s.sceneNumber) ?? null,
      }));
    }
    queueMicrotask(() => {
      setCurrentTimeline(tl);
    });
  }, [scenes, initialDraft?.id, selectedChannelId, audioMap, usedTitles]);

  // Manifest JSON export handler
  const handleExportManifest = useCallback(() => {
    if (!currentTimeline) return;
    const errors = validateTimeline(currentTimeline);
    if (errors.length > 0) {
      toast.error(tVideo("manifestValidationError"));
      console.error("Timeline validation errors:", errors);
      return;
    }
    const blob = new Blob([JSON.stringify(currentTimeline, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timeline-${currentTimeline.draftId || "draft"}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast.success(tVideo("manifestExported"));
  }, [currentTimeline, tVideo]);

  // Scroll to scene in viewer
  const scrollToScene = useCallback((sceneNumber: number) => {
    setActiveTab("scenes");
    setTimeout(() => {
      const el = document.getElementById(`scene-card-${sceneNumber}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }, []);

  // Server-Side Sync & LocalStorage Persistence (Run strictly once on mount)
  useEffect(() => {
    let ignore = false;
    const hasLoadedSource = Boolean(defaultSource);

    // 1. User-scoped Storage load (deferred to avoid cascading render during effect mount)
    const saved = getUserItem(userId, "scenePromptState");
    const savedFavorites = getUserItem(userId, "promptgen_favorite_voices");
    if (saved || savedFavorites) {
      queueMicrotask(() => {
        if (!ignore) {
          if (savedFavorites) {
            try {
              const favs = JSON.parse(savedFavorites);
              if (Array.isArray(favs) && favs.length > 0) setFavoriteVoices(favs);
            } catch {}
          }
          if (saved) {
            try {
              const p = JSON.parse(saved);
            // Only restore rawText from localStorage if neither initialDraft nor initialParsedOutputs was loaded
            if (!hasLoadedSource && p.rawText) {
              setRawText(p.rawText);
              const parsed = parseScenes(p.rawText);
              setScenes(parsed);
              setSelectedSceneIds(new Set(parsed.map(s => s.id)));
              setCaption(extractCaption(p.rawText));
              setHashtags(extractHashtags(p.rawText));
              setThumbnailData(extractThumbnailData(p.rawText));
              setThreeTierSeo(extractThreeTierSeo(p.rawText));
              setMultiPlatformSeo(extractMultiPlatformSeo(p.rawText));
              const titles = extractTitles(p.rawText);
              setParsedTitles(titles);
              const chosen = extractChosenTitle(p.rawText) || titles[0] || "";
              setDraftTitle(chosen || t("defaultDraftTitle"));
              const bp = extractBlogPublishingPack(p.rawText);
              setBlogPack(bp);
              setHtmlBlog(bp.html);
              setAffiliateRecs(extractAffiliateRecommendations(p.rawText));
            }
            if (p.selectedChannelId && channels.some(c => c.id === p.selectedChannelId)) setSelectedChannelId(p.selectedChannelId);
            if (p.ar) setAr(p.ar);
            if (p.sref) setSref(p.sref);
            if (p.cref) setCref(p.cref);
            if (!hasLoadedSource && p.draftTitle) setDraftTitle(p.draftTitle);
            if (p.ttsVoice) setTtsVoice(p.ttsVoice);
            if (p.ttsModel) setTtsModel(p.ttsModel);
            if (p.ttsPitch) setTtsPitch(p.ttsPitch);
            if (typeof p.ttsSpeed === "number") setTtsSpeed(p.ttsSpeed);
            if (typeof p.ttsStyleInstruction === "string") setTtsStyleInstruction(p.ttsStyleInstruction);
            if (p.ttsVoiceFilter) setTtsVoiceFilter(p.ttsVoiceFilter);
            if (Array.isArray(p.favoriteVoices) && p.favoriteVoices.length > 0) {
              setFavoriteVoices(p.favoriteVoices);
            }
          } catch {}
        }
      }
    });
  }

    // 2. Server load (overrides local)
    fetch("/api/user/preferences")
      .then(res => res.json())
      .then(data => {
        if (!ignore && data.success && data.generatorPreferences?.scenePromptState) {
          const p = data.generatorPreferences.scenePromptState;
          if (!hasLoadedSource && p.rawText) {
            setRawText(p.rawText);
            const parsed = parseScenes(p.rawText);
            setScenes(parsed);
            setSelectedSceneIds(new Set(parsed.map(s => s.id)));
            setCaption(extractCaption(p.rawText));
            setHashtags(extractHashtags(p.rawText));
            setThumbnailData(extractThumbnailData(p.rawText));
            setThreeTierSeo(extractThreeTierSeo(p.rawText));
            setMultiPlatformSeo(extractMultiPlatformSeo(p.rawText));
            const titles = extractTitles(p.rawText);
            setParsedTitles(titles);
            const chosen = extractChosenTitle(p.rawText) || titles[0] || "";
            setDraftTitle(chosen || t("defaultDraftTitle"));
            const bp = extractBlogPublishingPack(p.rawText);
            setBlogPack(bp);
            setHtmlBlog(bp.html);
            setAffiliateRecs(extractAffiliateRecommendations(p.rawText));
          }
          if (p.selectedChannelId && channels.some(c => c.id === p.selectedChannelId)) setSelectedChannelId(p.selectedChannelId);
          if (p.ar) setAr(p.ar);
          if (p.sref) setSref(p.sref);
          if (p.cref) setCref(p.cref);
          if (!hasLoadedSource && p.draftTitle) setDraftTitle(p.draftTitle);
          if (p.ttsVoice) setTtsVoice(p.ttsVoice);
          if (p.ttsModel) setTtsModel(p.ttsModel);
          if (p.ttsPitch) setTtsPitch(p.ttsPitch);
          if (typeof p.ttsSpeed === "number") setTtsSpeed(p.ttsSpeed);
          if (typeof p.ttsStyleInstruction === "string") setTtsStyleInstruction(p.ttsStyleInstruction);
          if (p.ttsVoiceFilter) setTtsVoiceFilter(p.ttsVoiceFilter);
          if (Array.isArray(p.favoriteVoices) && p.favoriteVoices.length > 0) {
            setFavoriteVoices(p.favoriteVoices);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) {
          isInitializedRef.current = true;
        }
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isInitializedRef.current) return;

    const stateObj = {
      rawText,
      selectedChannelId,
      ar,
      sref,
      cref,
      draftTitle,
      ttsVoice,
      ttsModel,
      ttsPitch,
      ttsSpeed,
      ttsStyleInstruction,
      ttsVoiceFilter,
      favoriteVoices,
    };
    setUserItem(userId, "scenePromptState", JSON.stringify(stateObj));

    const timeoutId = setTimeout(() => {
      if (rawText || draftTitle || sref || cref || ttsVoice !== DEFAULT_TTS_VOICE) {
        fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenePromptState: stateObj }),
        }).catch(() => {});
      }
    }, 3000); // 3 seconds debounce

    return () => clearTimeout(timeoutId);
  }, [
    rawText,
    selectedChannelId,
    ar,
    sref,
    cref,
    draftTitle,
    ttsVoice,
    ttsModel,
    ttsPitch,
    ttsSpeed,
    ttsStyleInstruction,
    ttsVoiceFilter,
    favoriteVoices,
    userId,
  ]);

 // sref/cref are manual inputs — no channel default sync needed

 const copy = useCallback((id: string, text: string) => {
 navigator.clipboard.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); });
 }, []);

 const handleDownloadHtml = useCallback(() => {
   const content = blogPack.html || htmlBlog;
   if (!content) return;
   const blob = new Blob([content], { type: "text/html;charset=utf-8" });
   const url = URL.createObjectURL(blob);
   const a = document.createElement("a");
   a.href = url;
   a.download = `${(draftTitle || "artikel-blog").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);
   toast.success(locale === "id" ? "File HTML berhasil diunduh!" : "HTML file downloaded successfully!");
 }, [blogPack.html, htmlBlog, draftTitle, locale]);

  const applyParsedOutput = useCallback((item: SerializedParsedOutput) => {
    const raw = item.rawInput;
    setRawText(raw);
    const isFunnel = detectOutputStructure(raw) === "FUNNEL_BUNDLE";
    if (isFunnel) {
      const fp = parseFunnelPack(raw, speechRate);
      setFunnelPackData(fp);
      setActiveFunnelSegment("short1");
      setScenes(fp.segments.short1.scenes);
      setAr(fp.segments.short1.aspectRatio);
      setSelectedSceneIds(new Set(fp.segments.short1.scenes.map((s) => s.id)));
      setTtsResults({});
      setCaption(fp.segments.short1.caption || extractCaption(raw));
      setHashtags(fp.segments.short1.hashtags || extractHashtags(raw));
      setThumbnailData(fp.segments.long.thumbnailData || extractThumbnailData(raw));
      setThreeTierSeo(fp.threeTierSeo || extractThreeTierSeo(raw));
      setMultiPlatformSeo(fp.segments.short1.multiPlatformSeo || fp.multiPlatformSeo || extractMultiPlatformSeo(raw));
    } else {
      setFunnelPackData(null);
      const parsed = Array.isArray(item.parsedResult) && (item.parsedResult as unknown[]).length > 0
        ? (item.parsedResult as Scene[])
        : parseScenes(raw, speechRate);
      setScenes(parsed);
      setSelectedSceneIds(new Set(parsed.map((s) => s.id)));
      setTtsResults({});
      setCaption(extractCaption(raw));
      setHashtags(extractHashtags(raw));
      setThumbnailData(extractThumbnailData(raw));
      setThreeTierSeo(extractThreeTierSeo(raw));
      setMultiPlatformSeo(extractMultiPlatformSeo(raw));
    }
    const titles = extractTitles(raw);
    setParsedTitles(titles);
    const chosen = extractChosenTitle(raw) || titles[0] || "";
    setDraftTitle(chosen || t("defaultDraftTitle"));
    const bp = extractBlogPublishingPack(raw);
    setBlogPack(bp);
    setHtmlBlog(bp.html);
    setAffiliateRecs(extractAffiliateRecommendations(raw));
    setDetectedRemotionCode(extractRemotionCode(raw));
    setSelectedHistoryId(item.id);
    toast.success(t("historyLoadedSuccess"));
  }, [speechRate, t]);

  const handleParse = async () => {
    if (!rawText.trim()) return;
    const textToParse = normalizeScriptWhitespace(rawText);
    if (textToParse !== rawText) {
      setRawText(textToParse);
    }
    const isFunnel = detectOutputStructure(textToParse) === "FUNNEL_BUNDLE";
    if (isFunnel) {
      const fp = parseFunnelPack(textToParse, speechRate);
      setFunnelPackData(fp);
      setActiveFunnelSegment("short1");
      setScenes(fp.segments.short1.scenes);
      setAr(fp.segments.short1.aspectRatio);
      setSelectedSceneIds(new Set(fp.segments.short1.scenes.map((s) => s.id)));
      setTtsResults({});
      setCaption(fp.segments.short1.caption || extractCaption(rawText));
      setHashtags(fp.segments.short1.hashtags || extractHashtags(rawText));
      setThumbnailData(fp.segments.long.thumbnailData || extractThumbnailData(rawText));
      setThreeTierSeo(fp.threeTierSeo || extractThreeTierSeo(rawText));
      setMultiPlatformSeo(fp.segments.short1.multiPlatformSeo || fp.multiPlatformSeo || extractMultiPlatformSeo(rawText));
      const titles = extractTitles(rawText);
      setParsedTitles(titles);
      const chosen = extractChosenTitle(rawText) || titles[0] || "";
      setDraftTitle(chosen || t("defaultDraftTitle"));
      const blogP = extractBlogPublishingPack(rawText);
      setBlogPack(blogP);
      setHtmlBlog(blogP.html);
      setAffiliateRecs(extractAffiliateRecommendations(rawText));
      const remCode = extractRemotionCode(rawText);
      setDetectedRemotionCode(remCode);
      if (remCode) {
        toast.success(t("remotionCodeDetectedToast"));
      }
      try {
        const res = await fetch("/api/parsed-outputs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawInput: rawText, parsedResult: fp }),
        });
        if (res.ok) {
          const data = await res.json();
          const newRecord: SerializedParsedOutput = {
            id: data.output?.id || data.id,
            rawInput: rawText,
            parsedResult: fp,
            createdAt: data.output?.createdAt ? new Date(data.output.createdAt).toISOString() : new Date().toISOString(),
          };
          setHistoryList((prev) => [newRecord, ...prev.filter((item) => item.id !== newRecord.id)].slice(0, 10));
          setSelectedHistoryId(newRecord.id);
        }
      } catch {}
      return;
    }

    setFunnelPackData(null);
    const parsed = parseScenes(rawText, speechRate);
    setScenes(parsed);
    setSelectedSceneIds(new Set(parsed.map(s => s.id))); // auto-select semua scene
    setTtsResults({}); // reset TTS results
    setCaption(extractCaption(rawText));
    setHashtags(extractHashtags(rawText));
    setThumbnailData(extractThumbnailData(rawText));
    setThreeTierSeo(extractThreeTierSeo(rawText));
    setMultiPlatformSeo(extractMultiPlatformSeo(rawText));
    const titles = extractTitles(rawText);
    setParsedTitles(titles);
    const chosen = extractChosenTitle(rawText) || titles[0] || "";
    setDraftTitle(chosen || t("defaultDraftTitle"));
    const blogP = extractBlogPublishingPack(rawText);
    setBlogPack(blogP);
    setHtmlBlog(blogP.html);
    setAffiliateRecs(extractAffiliateRecommendations(rawText));
    const remCode = extractRemotionCode(rawText);
    setDetectedRemotionCode(remCode);
    if (remCode) {
      toast.success(t("remotionCodeDetectedToast"));
    }
    try {
      const res = await fetch("/api/parsed-outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: rawText, parsedResult: parsed }),
      });
      if (res.ok) {
        const data = await res.json();
        const newRecord: SerializedParsedOutput = {
          id: data.output?.id || data.id,
          rawInput: rawText,
          parsedResult: parsed,
          createdAt: data.output?.createdAt ? new Date(data.output.createdAt).toISOString() : new Date().toISOString(),
        };
        setHistoryList((prev) => [newRecord, ...prev.filter((item) => item.id !== newRecord.id)].slice(0, 10));
        setSelectedHistoryId(newRecord.id);
      }
    } catch {}
  };

 const buildVisualPrompt = (visual: string) => {
 let p = visual.replace(/\s*--ar\s+\S+/gi, "").trim();
 if (p && p !== "—") { p += ` --ar ${ar}`; if (sref) { p += ` --sref ${sref}`; } if (cref) { p += ` --cref ${cref}`; } }
 return p;
 };

 const buildThumbnailPrompt = useCallback((prompt: string, overrideAr?: string) => {
 if (!prompt || prompt === "—") return "";
 let p = prompt.replace(/\s*--ar\s+\S+/gi, "").trim();
 const aspect = overrideAr || thumbAr || "16:9";
 if (p) {
 p += ` --ar ${aspect}`;
 if (sref) { p += ` --sref ${sref}`; }
 if (cref) { p += ` --cref ${cref}`; }
 }
 return p;
 }, [thumbAr, sref, cref]);

 const copyAllNarration = useCallback(() => {
 const validNarrations = scenes
 .filter(s => s.narasi && s.narasi !== "—" && !s.isDiegetic)
 .map(s => cleanNarasiForTts(s.narasi).trim())
 .filter(Boolean);

 if (!validNarrations.length) {
 toast.error(t("noNarrationToCopy"));
 return;
 }

 const fullNarrationText = validNarrations.join("\n\n");
 copy("all-narration", fullNarrationText);
 toast.success(t("allNarasiCopied"));
 }, [scenes, copy, t]);

 const copyAllNarrationRaw = useCallback(() => {
   const validNarrations = scenes
     .filter(s => s.narasi && s.narasi !== "—" && !s.isDiegetic)
     .map(s => s.narasi.trim());

   if (!validNarrations.length) {
     toast.error(t("noNarrationToCopy"));
     return;
   }

   const fullNarrationText = validNarrations.join("\n\n");
   copy("all-narration-raw", fullNarrationText);
   toast.success(t("allNarasiCopied") + " (Raw)");
 }, [scenes, copy, t]);

 const copyAllThumbnailConcept = useCallback(() => {
 if (!thumbnailData) return;
 const parts: string[] = [];
 parts.push(`=== ${t("thumbnailTab").toUpperCase()} ===`);
 if (thumbnailData.seoText) {
 parts.push(`[${t("seoOverlayTitle").toUpperCase()}]\n${thumbnailData.seoText}`);
 }
 if (thumbnailData.opsi1Prompt || thumbnailData.opsi1Overlay) {
 parts.push(`[${t("option1Title").toUpperCase()}]\nPrompt AI: ${buildThumbnailPrompt(thumbnailData.opsi1Prompt)}\n${t("overlayTextLabel")}: ${thumbnailData.opsi1Overlay || "—"}`);
 }
 if (thumbnailData.opsi2Prompt || thumbnailData.opsi2Overlay) {
 parts.push(`[${t("option2Title").toUpperCase()}]\nPrompt AI: ${buildThumbnailPrompt(thumbnailData.opsi2Prompt)}\n${t("overlayTextLabel")}: ${thumbnailData.opsi2Overlay || "—"}`);
 }
 if (thumbnailData.recommendations) {
 parts.push(`[${t("recommendationsTitle").toUpperCase()}]\n${thumbnailData.recommendations}`);
 }
 copy("all-thumb", parts.join("\n\n"));
 toast.success(t("allThumbnailCopied"));
 }, [thumbnailData, buildThumbnailPrompt, copy, t]);

 const handleSaveDraft = async () => {
  if (!scenes.length) return;
  setSaving(true); setSaveMsg(null);
  try {
  const bp = extractBlogPublishingPack(rawText);
  setBlogPack(bp);
  const htmlBlogContent = bp.html;
  setHtmlBlog(htmlBlogContent);

  const selectedChannel = channels.find(c => c.id === selectedChannelId);
  const effectiveTopic = draftTitle || selectedChannel?.niche || "Draft Video";

  const ideThumbText = thumbnailData
    ? [
        thumbnailData.seoText && `SEO: ${thumbnailData.seoText}`,
        thumbnailData.opsi1Prompt && `Opsi 1: ${thumbnailData.opsi1Prompt}`,
        thumbnailData.opsi2Prompt && `Opsi 2: ${thumbnailData.opsi2Prompt}`,
        thumbnailData.recommendations && `Rekomendasi: ${thumbnailData.recommendations}`,
      ].filter(Boolean).join("\n\n")
    : undefined;

    const parsedData: Record<string, unknown> = {
      segments: scenes,
      caption_medsos: caption || undefined,
      ide_thumbnail: ideThumbText,
      opsi_judul: parsedTitles.length > 0 ? parsedTitles : undefined,
      html_blog: htmlBlogContent || undefined,
      scenes,
      caption: caption || undefined,
      hashtags: hashtags || undefined,
      thumbnailData: thumbnailData ?? undefined,
      speechRate,
      funnelPackData: funnelPackData ?? undefined,
      outputStructure: funnelPackData ? "FUNNEL_BUNDLE" : "SINGLE",
    };

    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId: selectedChannelId || undefined,
        type: "VIDEO",
        topic: effectiveTopic,
        title: draftTitle,
        rawJson: JSON.stringify({ scenes, caption, hashtags, thumbnailData }),
        parsedData,
        speechRate,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      if (draftTitle && draftTitle.trim()) {
        const clean = draftTitle.trim();
        setMarkedTitles((prev) =>
          prev.some((t) => t.trim().toLowerCase() === clean.toLowerCase())
            ? prev
            : [...prev, clean]
        );
      }
      setSaveMsg(t("draftSaved"));
    } else {
      setSaveMsg(data.error || t("draftError"));
    }
  } catch {
    setSaveMsg(t("draftError"));
  } finally {
    setSaving(false);
    setTimeout(() => setSaveMsg(null), 4000);
  }
};

  const cls = "w-full px-3.5 py-2 text-sm pg-surface-dim border pg-border rounded-lg outline-none pg-text-heading focus:border-[var(--pg-brand)] focus:ring-2 focus:ring-[var(--pg-brand-light)] transition-all";
  const btn = (active?: boolean) => `px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all ${active ? "bg-[var(--pg-brand)] text-white border-[var(--pg-brand)] shadow-sm" : "pg-surface pg-border pg-text-sub hover:pg-surface-dim hover:pg-text-heading"}`;

 return (
 <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
 <div>
 <h1 className="text-2xl font-bold pg-text-heading">{t("title")}</h1>
 <p className="text-sm pg-text-muted mt-1">{t("subtitle")}</p>
 </div>

 <div className="glass-panel rounded-xl p-6 space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">{t("channelLabel")}</label>
 <select
   value={selectedChannelId}
   onChange={(e) => {
     const newId = e.target.value;
     setSelectedChannelId(newId);
     const ch = channels.find((c) => c.id === newId);
     if (ch?.speechRate && !isNaN(ch.speechRate) && ch.speechRate > 0) {
       setSpeechRate(ch.speechRate);
     }
   }}
   className={cls}
 >
 {channels.map(c => <option key={c.id} value={c.id}>{c.channelName}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">Aspect Ratio</label>
 <select value={ar} onChange={e => setAr(e.target.value)} className={cls}>
 {["9:16","16:9","1:1","4:5"].map(v => <option key={v} value={v}>{v}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium pg-text-sub mb-1">Sref URL</label>
 <input value={sref} onChange={e => setSref(e.target.value)} placeholder="https://..." className={cls} />
 </div>
 </div>
        <textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder={t("pastePlaceholder")} rows={8} className={`${cls} resize-y min-h-[140px] font-mono text-xs`} />
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <button onClick={handleParse} disabled={!rawText.trim()} className="pg-btn-primary min-h-[40px] px-5 text-sm font-semibold rounded-lg shadow-sm">
              ⚡ {t("parseButton")}
            </button>
            {scenes.length > 0 && <span className="text-xs pg-text-muted font-medium">{scenes.length} {t("scenesFound")}</span>}
          </div>

          {/* Riwayat Parse Dropdown */}
          {historyList.length > 0 && (
            <div className="relative" ref={historyDropdownRef}>
              <button
                type="button"
                onClick={() => setHistoryOpen(!historyOpen)}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border pg-border pg-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors pg-text-sub shadow-sm"
                title={t("parseHistoryTooltip")}
              >
                <span>🕒</span>
                <span>{t("parseHistory")}</span>
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">
                  {historyList.length}
                </span>
                <span className={`text-[10px] transition-transform ${historyOpen ? "rotate-180" : ""}`}>▼</span>
              </button>

              {historyOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-96 overflow-y-auto pg-surface border pg-border rounded-xl shadow-2xl z-50 p-2 space-y-1.5 custom-scrollbar">
                  <div className="px-2.5 py-1.5 border-b pg-border flex items-center justify-between">
                    <span className="text-xs font-bold pg-text-heading flex items-center gap-1.5">
                      <span>🕒</span> {t("parseHistory")}
                    </span>
                    <span className="text-[11px] pg-text-muted">
                      {historyList.length}/10 {t("savedItems")}
                    </span>
                  </div>
                  {historyList.length === 0 ? (
                    <div className="p-4 text-center text-xs pg-text-muted">
                      {t("noParseHistory")}
                    </div>
                  ) : (
                    historyList.map((item, idx) => {
                      const itemTitle = extractChosenTitle(item.rawInput) || extractTitles(item.rawInput)[0] || (item.rawInput.slice(0, 45).replace(/[#*`\n]/g, " ").trim() + "...");
                      const sceneCount = Array.isArray(item.parsedResult) ? item.parsedResult.length : 0;
                      const isActive = selectedHistoryId === item.id;
                      const timeFormatted = formatHistoryDate(item.createdAt, locale);

                      return (
                        <button
                          key={item.id || idx}
                          type="button"
                          onClick={() => {
                            applyParsedOutput(item);
                            setHistoryOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 ${
                            isActive
                              ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40"
                              : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold pg-text-heading truncate flex-1" title={itemTitle}>
                              {itemTitle}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white shrink-0">
                                {t("activeParseBadge")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] pg-text-muted">
                            <span>{timeFormatted}</span>
                            {sceneCount > 0 && <span>{sceneCount} {t("scenesFound")}</span>}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
 </div>

 {scenes.length > 0 && (
 <>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
 <div className="glass-panel p-1.5 rounded-2xl border pg-border flex gap-1.5 overflow-x-auto whitespace-nowrap custom-scrollbar shadow-sm flex-1">
 {(["scenes","thumbnail","seo2026","platform","voiceStudio","htmlBlog","fullVideo"] as const).map(tab => {
 if (tab === "seo2026" && !threeTierSeo) return null;
 if (tab === "htmlBlog" && !htmlBlog) return null;
 return (
 <button key={tab} onClick={() => setActiveTab(tab)} className={btn(activeTab === tab)}>
 {tab === "scenes" ? `🎬 ${t("sceneViewerTab")} (${scenes.length})` : tab === "thumbnail" ? `🖼️ ${t("thumbnailTab")}` : tab === "seo2026" ? t("seo2026Tab") : tab === "htmlBlog" ? t("htmlBlogTab") : tab === "voiceStudio" ? `🎙️ ${t("voiceStudioTab")}` : tab === "fullVideo" ? `🎞️ ${t("tabFullVideo")}` : `📱 ${t("platformTab")}`}
 </button>
 );
 })}
 </div>

 {planFeatures.googleDriveUpload && (
 <button
 type="button"
 onClick={() => setDrivePackageModalOpen(true)}
 className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 shrink-0"
 title={locale === "en" ? "Upload content package to Google Drive" : "Upload paket konten ke Google Drive"}
 >
 <span>☁️</span>
 <span>{locale === "en" ? "Upload Package to Drive" : "Upload Paket ke Drive"}</span>
 </button>
 )}
 </div>

 {affiliateRecs.length > 0 && (
 <div className="glass-panel rounded-xl p-5 border border-emerald-200 dark:border-emerald-800 shadow-sm">
 <h2 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2">
 🛒 {t("affiliateRecommendationsTitle")}
 <span className="text-[10px] font-normal bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
 {affiliateRecs.length} {t("productsCount")}
 </span>
 </h2>
 <div className="space-y-4">
 {affiliateRecs.map((rec, i) => (
 <div key={i} className="pg-surface-dim rounded-lg p-3 space-y-1.5">
 <div className="flex items-start justify-between gap-2">
 <p className="text-sm font-semibold pg-text-heading">{rec.productName}</p>
 </div>
 {rec.reason && (
 <p className="text-xs pg-text-muted leading-relaxed">{rec.reason}</p>
 )}
 {rec.links.length > 0 && (
 <div className="flex flex-wrap gap-1.5 pt-1">
 {rec.links.map((link, j) => (
 <a
 key={j}
 href={link.url}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 transition-colors"
 >
 🔗 {link.marketplace}
 </a>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

  {/* ── Extracted Titles Panel ── */}
  {parsedTitles.length > 0 && (
  <div className="glass-panel rounded-xl p-5 border border-blue-100 dark:border-blue-900 shadow-sm">
   <div className="flex items-center justify-between mb-3">
     <h2 className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">✨ {t("titlesFound")}</h2>
     <span className="text-[10px] pg-text-muted">{t("selectOrSave")}</span>
   </div>
  <div className="space-y-2">
  {parsedTitles.map((title, i) => {
  const isActiveDraft = title.trim().toLowerCase() === draftTitle.trim().toLowerCase();
  const isMarked = markedTitles.some((mt) => mt.trim().toLowerCase() === title.trim().toLowerCase());
  return (
  <div
     key={i}
     className={`flex items-start justify-between rounded-lg px-3 py-2.5 gap-3 transition-colors
       ${isActiveDraft
         ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
         : 'pg-surface-dim'}`}
   >
   {/* Left: status icon + title text */}
   <div className="flex items-start gap-2 flex-1 min-w-0 pt-0.5">
     {isActiveDraft && <span className="text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0 mt-0.5">✓</span>}
     {isMarked && !isActiveDraft && <span className="text-emerald-500 text-xs shrink-0 mt-0.5">✅</span>}
     <span className="text-sm pg-text-sub leading-snug">{title}</span>
   </div>
   {/* Right: action buttons stacked */}
   <div className="flex flex-col items-end gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
     <div className="flex items-center gap-2">
       {/* Set as Draft Title */}
       {isActiveDraft ? (
         <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{t("selectedTitle")}</span>
       ) : (
         <button
           onClick={() => handleSelectTitle(title)}
           className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
         >
           {t("selectTitle")}
         </button>
       )}
       {/* Copy */}
       <button onClick={() => copy(`t-${i}`, title)} className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">{copiedId === `t-${i}` ? "✓" : t("copy")}</button>
     </div>
     {/* Save to Used Titles Directory — explicit separate action */}
     {isMarked ? (
       <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">✅ {t("savedToDirectory")}</span>
     ) : (
       <button
         onClick={() => handleMarkAsUsed(title)}
         className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
       >
         📂 {t("saveToDirectory")}
       </button>
     )}
   </div>
   </div>
  );
  })}
  </div>
  </div>
  )}

  {activeTab === "scenes" && (
  <div className="space-y-4">
    {/* 3-in-1 Funnel Pack Segment Switcher */}
    {funnelPackData && (
      <div className="glass-panel p-3 rounded-2xl border pg-border bg-[var(--pg-surface-dim)]/40 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b pg-border/40">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌪️</span>
            <div>
              <div className="text-xs font-bold pg-text-heading flex items-center gap-2">
                <span>{locale === "en" ? "3-in-1 Funnel Pack" : "Paket Funnel 3-in-1"}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
                  {locale === "en" ? "Integrated Video Ecosystem" : "Ekosistem Video Terintegrasi"}
                </span>
              </div>
              <p className="text-[11px] pg-text-muted mt-0.5">
                {locale === "en"
                  ? "Select a video segment below to view, edit, and generate audio for its scenes"
                  : "Pilih segmen video di bawah untuk mempratinjau, mengedit, dan menghasilkan audio"}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--pg-surface)] border pg-border self-start sm:self-auto">
            {locale === "en" ? "Active" : "Aktif"}: <strong className="uppercase">{activeFunnelSegment}</strong> ({ar})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Short 1 Card */}
          <button
            type="button"
            onClick={() => switchFunnelSegment("short1")}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              activeFunnelSegment === "short1"
                ? "bg-[var(--pg-brand)] text-white border-[var(--pg-brand)] shadow-md ring-2 ring-[var(--pg-brand)]/30"
                : "bg-[var(--pg-surface)] hover:bg-[var(--pg-surface-dim)] pg-border text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <span>⚡</span> Short 1
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                activeFunnelSegment === "short1" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                9:16
              </span>
            </div>
            <div className="text-[11px] opacity-90 truncate font-semibold" title={funnelPackData.segments.short1.title || "The Spark Hook"}>
              {funnelPackData.segments.short1.title || "The Spark Hook"}
            </div>
            <div className="text-[10px] opacity-75 mt-0.5">
              {funnelPackData.segments.short1.scenes.length} Scene • ~{funnelPackData.segments.short1.timingSummary.formattedTotalDuration}
            </div>
          </button>

          {/* Short 2 Card */}
          <button
            type="button"
            onClick={() => switchFunnelSegment("short2")}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              activeFunnelSegment === "short2"
                ? "bg-[var(--pg-brand)] text-white border-[var(--pg-brand)] shadow-md ring-2 ring-[var(--pg-brand)]/30"
                : "bg-[var(--pg-surface)] hover:bg-[var(--pg-surface-dim)] pg-border text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <span>🎯</span> Short 2
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                activeFunnelSegment === "short2" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                9:16
              </span>
            </div>
            <div className="text-[11px] opacity-90 truncate font-semibold" title={funnelPackData.segments.short2.title || "Problem & Contrarian"}>
              {funnelPackData.segments.short2.title || "Problem & Contrarian"}
            </div>
            <div className="text-[10px] opacity-75 mt-0.5">
              {funnelPackData.segments.short2.scenes.length} Scene • ~{funnelPackData.segments.short2.timingSummary.formattedTotalDuration}
            </div>
          </button>

          {/* Long Pillar Card */}
          <button
            type="button"
            onClick={() => switchFunnelSegment("long")}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              activeFunnelSegment === "long"
                ? "bg-[var(--pg-brand)] text-white border-[var(--pg-brand)] shadow-md ring-2 ring-[var(--pg-brand)]/30"
                : "bg-[var(--pg-surface)] hover:bg-[var(--pg-surface-dim)] pg-border text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <span>🏛️</span> Long Pillar
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                activeFunnelSegment === "long" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                16:9
              </span>
            </div>
            <div className="text-[11px] opacity-90 truncate font-semibold" title={funnelPackData.segments.long.title || "Masterclass Berbab"}>
              {funnelPackData.segments.long.title || "Masterclass Berbab"}
            </div>
            <div className="text-[10px] opacity-75 mt-0.5">
              {funnelPackData.segments.long.scenes.length} Scene • ~{funnelPackData.segments.long.timingSummary.formattedTotalDuration}
            </div>
          </button>
        </div>
      </div>
    )}

    {/* Source Audit Card */}
    {funnelPackData?.sourceAudit && (
      <div className="glass-panel rounded-2xl border pg-border overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setIsSourceAuditOpen(prev => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--pg-surface-dim)]/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🛡️</span>
            <div>
              <div className="text-xs font-bold pg-text-heading flex items-center gap-2 flex-wrap">
                <span>{locale === "en" ? "Source Audit & Grounded Data" : "Audit Link Sumber & Data Nyata"}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  {locale === "en" ? "Zero-Hallucination & Angle Shift" : "Anti-Halusinasi & Inversi Sudut Pandang"}
                </span>
              </div>
              <p className="text-[11px] pg-text-muted mt-0.5">
                {locale === "en"
                  ? "Original facts extracted and rewritten with authentic channel persona without duplication"
                  : "Fakta riil diekstrak dan ditulis ulang dengan persona channel tanpa duplikasi materi"}
              </p>
            </div>
          </div>
          <span className="text-xs pg-text-muted">{isSourceAuditOpen ? "▲" : "▼"}</span>
        </button>
        {isSourceAuditOpen && (
          <div className="p-4 pt-0 space-y-3 text-xs pg-border/40 border-t mt-1">
            {funnelPackData.sourceAudit.sourceUrl && (
              <div className="flex items-start gap-2 pt-3">
                <span className="font-semibold pg-text-heading shrink-0">🔗 {locale === "en" ? "Source URL" : "URL Sumber"}:</span>
                <a
                  href={funnelPackData.sourceAudit.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-all"
                >
                  {funnelPackData.sourceAudit.sourceUrl}
                </a>
              </div>
            )}
            {funnelPackData.sourceAudit.keyFacts && funnelPackData.sourceAudit.keyFacts.length > 0 && (
              <div>
                <div className="font-semibold pg-text-heading mb-1">📊 {locale === "en" ? "Key Verified Facts" : "Fakta & Data Kunci"}:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
                  {funnelPackData.sourceAudit.keyFacts.map((fact, idx) => (
                    <li key={idx}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}
            {funnelPackData.sourceAudit.angleShift && (
              <div>
                <span className="font-semibold pg-text-heading">💡 {locale === "en" ? "Angle Shift" : "Inversi Sudut Pandang (Angle Shift)"}: </span>
                <span className="text-slate-700 dark:text-slate-300">{funnelPackData.sourceAudit.angleShift}</span>
              </div>
            )}
            {funnelPackData.sourceAudit.pillarBridge && (
              <div>
                <span className="font-semibold pg-text-heading">🌉 {locale === "en" ? "Funnel Bridge" : "Jembatan Funnel"}: </span>
                <span className="text-slate-700 dark:text-slate-300">{funnelPackData.sourceAudit.pillarBridge}</span>
              </div>
            )}
            {funnelPackData.sourceAudit.disclaimer && (
              <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                ⚠️ <strong>{locale === "en" ? "Integrity Note" : "Catatan Integritas"}:</strong> {funnelPackData.sourceAudit.disclaimer}
              </div>
            )}
          </div>
        )}
      </div>
    )}
    {/* Detected Remotion Code Alert Banner */}
    {detectedRemotionCode && (
      <div className="glass-panel p-4 rounded-2xl border border-[var(--pg-brand)]/40 bg-gradient-to-r from-[var(--pg-brand)]/10 via-blue-500/10 to-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-2xl p-2 rounded-xl bg-[var(--pg-brand-light)] text-[var(--pg-brand)] shrink-0">⚛️</span>
          <div>
            <h4 className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              {t("remotionCodeDetectedBannerTitle")}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 font-mono">React Remotion v4</span>
            </h4>
            <p className="text-[11px] pg-text-muted mt-0.5 leading-relaxed">
              {t("remotionCodeDetectedBannerDesc")}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/dashboard/remotion-studio`}
          onClick={() => {
            navigator.clipboard.writeText(detectedRemotionCode);
            toast.success("Kode Remotion disalin ke clipboard!");
          }}
          className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-xs flex items-center gap-1.5"
        >
          <span>{t("openStandaloneRemotionBtn")}</span>
          <span>→</span>
        </Link>
      </div>
    )}

    {/* Script Timing & Duration Control Bar */}
    {scenes.length > 0 && (
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border pg-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[var(--pg-surface)] to-[var(--pg-surface-dim)]">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Total Duration Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold pg-text-sub">
                {t("totalDuration")}
              </div>
              <div className="text-base sm:text-lg font-extrabold font-mono pg-text-heading">
                ~{timingSummary.formattedTotalDuration}{" "}
                <span className="text-xs font-normal font-sans pg-text-sub">
                  ({timingSummary.totalDurationSec}s)
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-border/60 hidden sm:block" />

          {/* Word Count & Scenes Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold pg-text-sub">
                {t("wordsCount", { count: timingSummary.totalWords })}
              </div>
              <div className="text-xs sm:text-sm font-semibold pg-text-heading">
                {timingSummary.sceneCount} {t("scenesFound")?.replace(/^[0-9\/ ]+/, "") || "Scene"}
                {timingSummary.totalPausesSec > 0 && (
                  <span className="ml-1.5 text-[11px] font-mono text-amber-600 dark:text-amber-400">
                    (+{timingSummary.totalPausesSec}s {locale === "en" ? "pause" : "jeda"})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-border/60 hidden sm:block" />

          {/* Shorts Ready vs Long-Form Badge */}
          <div>
            {timingSummary.isShortsReady ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
                <span>⚡</span> {t("shortsReadyBadge")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 shadow-xs">
                <span>📺</span> {t("longFormBadge")}
              </span>
            )}
          </div>
        </div>

        {/* Interactive Speech Rate Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label className="text-xs font-bold pg-text-sub flex items-center gap-1 shrink-0">
            <span>🎙️</span> {t("speechRateLabel")}:
          </label>
          <select
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border pg-border bg-background pg-text-heading focus:ring-1 focus:ring-[var(--pg-brand)] cursor-pointer shadow-xs"
          >
            <option value={0.25}>{t("speechRateSuperFast")}</option>
            <option value={0.30}>{t("speechRateFast")}</option>
            <option value={0.35}>{t("speechRateNormal")}</option>
            <option value={0.40}>{t("speechRateRelaxed")}</option>
            <option value={0.50}>{t("speechRateSlow")}</option>
          </select>
        </div>
      </div>
    )}

    {/* Scene Viewer Actions Toolbar */}
    <div className="glass-panel rounded-2xl px-4 py-3 border pg-border shadow-sm flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Select All Checkbox */}
          <input
            type="checkbox"
            checked={selectedSceneIds.size === scenes.length && scenes.length > 0}
            onChange={toggleAllScenes}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-[var(--pg-brand)] cursor-pointer"
            title={t("selectAllScenes")}
          />
          <span className="text-sm font-bold pg-text-heading flex items-center gap-1.5">
            <span>🎬</span> {t("sceneViewerTab")}
          </span>
          <span className="text-xs pg-surface-dim border pg-border px-2.5 py-0.5 rounded-full pg-text-sub font-medium">
            {selectedSceneIds.size}/{scenes.length} {t("scenesFound")}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyBatchExport}
            disabled={selectedSceneIds.size === 0}
            className="inline-flex items-center gap-1.5 text-xs font-semibold h-9 px-3.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-40"
            title={t("copyBatchExport")}
          >
            <span>📦</span>
            {copiedId === "batch-export" ? `✓ ${t("batchExportCopied")}` : t("copyBatchExport")}
          </button>
          <div className="inline-flex rounded-lg shadow-sm">
            <button
              type="button"
              onClick={copyAllNarration}
              className="inline-flex items-center gap-1.5 text-xs font-semibold h-9 px-3.5 rounded-l-lg bg-[var(--pg-brand)] hover:bg-[var(--pg-brand-hover)] text-white transition-all active:scale-95 shadow-sm"
              title={t("copyAllCleanNarrationTitle")}
            >
              <span>🎤</span>
              {copiedId === "all-narration" ? `✓ ${t("allNarasiCopied")}` : t("copyAllNarasi")}
            </button>
            <button
              type="button"
              onClick={copyAllNarrationRaw}
              className="inline-flex items-center text-xs font-semibold h-9 px-3 rounded-r-lg bg-[var(--pg-brand-hover)] hover:bg-[#d96500] text-white border-l border-white/20 transition-all active:scale-95 shadow-sm"
              title={t("copyAllRawNarrationTitle")}
            >
              {copiedId === "all-narration-raw" ? "✓ " + t("raw") : t("raw")}
            </button>
          </div>
        </div>
      </div>

      {/* Option A: Inline Toggle Pills for Batch Export Filter */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold pg-text-sub flex items-center gap-1 mr-1">
          <span>⚙️</span> {t("exportFilterLabel")}:
        </span>
        <button
          type="button"
          onClick={() => setBatchFilter(prev => ({ ...prev, includeNarasi: !prev.includeNarasi }))}
          className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 font-medium ${
            batchFilter.includeNarasi
              ? "bg-purple-600/15 border-purple-500/50 text-purple-300 shadow-xs"
              : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-300"
          }`}
        >
          <span>{batchFilter.includeNarasi ? "✓" : "○"}</span>
          <span>{t("filterNarasi")}</span>
        </button>
        <button
          type="button"
          onClick={() => setBatchFilter(prev => ({ ...prev, includeVisual: !prev.includeVisual }))}
          className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 font-medium ${
            batchFilter.includeVisual
              ? "bg-purple-600/15 border-purple-500/50 text-purple-300 shadow-xs"
              : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-300"
          }`}
        >
          <span>{batchFilter.includeVisual ? "✓" : "○"}</span>
          <span>{t("filterVisual")}</span>
        </button>
        <button
          type="button"
          onClick={() => setBatchFilter(prev => ({ ...prev, includeDurasi: !prev.includeDurasi }))}
          className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 font-medium ${
            batchFilter.includeDurasi
              ? "bg-purple-600/15 border-purple-500/50 text-purple-300 shadow-xs"
              : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-300"
          }`}
        >
          <span>{batchFilter.includeDurasi ? "✓" : "○"}</span>
          <span>{t("filterDurasi")}</span>
        </button>
        <button
          type="button"
          onClick={() => setBatchFilter(prev => ({ ...prev, includeContext: !prev.includeContext }))}
          className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 font-medium ${
            batchFilter.includeContext
              ? "bg-purple-600/15 border-purple-500/50 text-purple-300 shadow-xs"
              : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-300"
          }`}
        >
          <span>{batchFilter.includeContext ? "✓" : "○"}</span>
          <span>{t("filterContext")}</span>
        </button>
        <button
          type="button"
          onClick={() => setBatchFilter(prev => ({ ...prev, includeOverlay: !prev.includeOverlay }))}
          className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 font-medium ${
            batchFilter.includeOverlay
              ? "bg-purple-600/15 border-purple-500/50 text-purple-300 shadow-xs"
              : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-300"
          }`}
        >
          <span>{batchFilter.includeOverlay ? "✓" : "○"}</span>
          <span>{t("filterOverlay")}</span>
        </button>
      </div>
    </div>

  {scenes.map((scene, sceneIdx) => {
    // Chapter divider: show when this scene starts a new chapter
    const prevScene = sceneIdx > 0 ? scenes[sceneIdx - 1] : null;
    const isNewChapter = scene.chapter !== undefined && (prevScene?.chapter !== scene.chapter);
    return (
    <div key={scene.id} id={`scene-card-${scene.id}`}>
    {isNewChapter && (
      <div className="flex items-center gap-3 py-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-sm">
          <span>📖</span> {scene.chapterPrefix || "BAB"} {scene.chapter}: {scene.chapterTitle}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
      </div>
    )}
    <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4 border pg-border hover:border-[var(--pg-brand-glow)] transition-all shadow-sm">
      {/* Scene Header — 2-Row Responsive Layout (Zero mobile overflow) */}
      <div className="space-y-2 pb-1 border-b pg-border/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <input
              type="checkbox"
              checked={selectedSceneIds.has(scene.id)}
              onChange={() => toggleScene(scene.id)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-[var(--pg-brand)] cursor-pointer"
            />
            <h3 className="font-bold text-sm sm:text-base pg-text-heading truncate">{scene.sceneNumber}</h3>
          </div>
          {(() => {
            const sceneTiming = estimateNarrationDuration(scene.narasi, speechRate);
            return (
              <span
                className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full pg-surface-dim border pg-border pg-text-heading shrink-0 shadow-xs flex items-center gap-1.5"
                title={`${locale === "en" ? "Calculated Narration Duration" : "Estimasi Durasi Narasi Real"}: ~${sceneTiming.totalDurationSec}s (${sceneTiming.spokenWords} ${locale === "en" ? "words" : "kata"} + ${sceneTiming.pauseDurationSec}s ${locale === "en" ? "pause" : "jeda"})`}
              >
                <span>⏱️</span>
                <span>{sceneTiming.totalDurationSec > 0 ? `~${sceneTiming.totalDurationSec}s` : scene.durasi}</span>
                {sceneTiming.spokenWords > 0 && (
                  <span className="text-[10px] opacity-75 font-normal">({sceneTiming.spokenWords}w)</span>
                )}
              </span>
            );
          })()}
        </div>

        {/* Emotion / Pacing / Diegetic Tags Row */}
        {(scene.isDiegetic || scene.targetEmosi || scene.teknikPacing || scene.settingKamera) && (
          <div className="flex flex-wrap items-center gap-1.5 pl-6 sm:pl-6.5">
            {scene.isDiegetic && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                <span>🔇</span> Diegetic (Tanpa VO)
              </span>
            )}
            {scene.targetEmosi && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1" title="Target Emosi (VET 3-Act)">
                <span>🎯</span> {scene.targetEmosi}
              </span>
            )}
            {scene.teknikPacing && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1" title="Teknik Editing & Pacing">
                <span>⚡</span> {scene.teknikPacing}
              </span>
            )}
            {scene.settingKamera && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center gap-1" title="Camera Setting">
                <span>🎥</span> {scene.settingKamera}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scene Context (Konteks Adegan) */}
      {scene.sceneContext && (
        <div className="rounded-xl p-3.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              <span>🎬</span> {t("sceneContext")}
            </span>
            <button
              type="button"
              onClick={() => copy(`ctx-${scene.id}`, scene.sceneContext!)}
              className="text-xs px-2 py-0.5 rounded font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {copiedId === `ctx-${scene.id}` ? "✓ " + t("copied") : `📋 ${t("copy")}`}
            </button>
          </div>
          <p className="text-xs sm:text-sm font-medium leading-relaxed">{scene.sceneContext}</p>
        </div>
      )}

      {/* Narasi (jika ada spoken voiceover) */}
      {scene.narasi !== "—" && (() => {
        const cleanSpoken = cleanNarasiForTts(scene.narasi);
        const hasDirectorNotes = cleanSpoken && cleanSpoken !== scene.narasi.trim();
        const sceneWords = countWords(cleanSpoken || scene.narasi);
        const pauseSec = estimateExpressivePauseSeconds(scene.narasi);
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold pg-text-sub uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                <span>🎤</span> {t("narasi")}
                {sceneWords > 0 && (
                  <span className="text-[10px] font-normal font-mono px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-700/60 pg-text-sub">
                    {sceneWords} {locale === "en" ? "words" : "kata"}
                  </span>
                )}
                {pauseSec > 0 && (
                  <span
                    className="text-[10px] font-normal font-mono px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25"
                    title={locale === "en" ? `Expressive pause overhead: ~${pauseSec}s` : `Kompensasi jeda ekspresif: ~${pauseSec}s`}
                  >
                    +{pauseSec}s {locale === "en" ? "pause" : "jeda"}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1.5">
                {hasDirectorNotes && (
                  <button
                    type="button"
                    onClick={() => copy(`nar-raw-${scene.id}`, scene.narasi)}
                    className="text-xs px-2 py-0.5 rounded border pg-border pg-surface-dim pg-text-sub hover:pg-text-heading transition-colors"
                    title={t("copySceneRawNarrationTitle")}
                  >
                    {copiedId === `nar-raw-${scene.id}` ? "✓ " + t("raw") : t("raw")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => copy(`nar-${scene.id}`, cleanSpoken || scene.narasi)}
                  className="text-xs px-2.5 py-0.5 rounded font-semibold bg-[var(--pg-brand)]/10 text-[var(--pg-brand)] hover:bg-[var(--pg-brand)] hover:text-white transition-all shadow-xs"
                  title={t("copyAllCleanNarrationTitle")}
                >
                  {copiedId === `nar-${scene.id}` ? "✓ " + t("copied") : `📋 ${t("copy")}`}
                </button>
              </div>
            </div>
            <p className="text-sm pg-text-heading leading-relaxed font-normal bg-card/40 p-3 rounded-xl border pg-border/50">{scene.narasi}</p>
          </div>
        );
      })()}

      {/* Teks Overlay Layar */}
      {scene.teksOverlay && (
        <div className={`rounded-xl p-3.5 border ${scene.overlayType === "chapter_title" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-200" : scene.overlayType === "key_point" ? "bg-blue-500/10 border-blue-500/25 text-blue-800 dark:text-blue-200" : "bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-200"}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${scene.overlayType === "chapter_title" ? "text-emerald-600 dark:text-emerald-400" : scene.overlayType === "key_point" ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
              <span>{scene.overlayType === "chapter_title" ? "📖" : scene.overlayType === "key_point" ? "📌" : "💬"}</span>
              {scene.overlayType === "chapter_title" ? "Chapter Title" : scene.overlayType === "key_point" ? "Key Point" : "Teks Overlay Layar"}
            </span>
            <button
              onClick={() => copy(`ov-${scene.id}`, scene.teksOverlay!)}
              className="text-xs px-2 py-0.5 rounded font-semibold hover:underline"
            >
              {copiedId === `ov-${scene.id}` ? "✓" : t("copy")}
            </button>
          </div>
          <p className="text-sm font-semibold italic">&ldquo;{scene.teksOverlay}&rdquo;</p>
        </div>
      )}

      {/* Audio Cues (SFX, Ambient & BGM) — Selalu tampil jika ada cue */}
      {(scene.bgmCues?.length || scene.sfxCues?.length || scene.ambientCues?.length) ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {scene.bgmCues?.map((c, i) => (
            <span key={i} className="text-[11px] font-medium px-2.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full flex items-center gap-1">
              <span>🎵</span> {c}
            </span>
          ))}
          {scene.ambientCues?.map((c, i) => (
            <span key={i} className="text-[11px] font-medium px-2.5 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full flex items-center gap-1">
              <span>🌿</span> {c}
            </span>
          ))}
          {scene.sfxCues?.map((c, i) => (
            <span key={i} className="text-[11px] font-medium px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full flex items-center gap-1">
              <span>🔊</span> {c}
            </span>
          ))}
        </div>
      ) : null}

      {/* Panduan Suara / Voice Guidelines */}
      {scene.voiceGuidelines && (
        <div className="pg-surface-dim border pg-border/60 rounded-xl p-3 text-xs pg-text-sub space-y-1">
          {scene.voiceGuidelines.sampleContext && <p>📍 <span className="font-medium pg-text-heading">{t("vgContext")}</span> {scene.voiceGuidelines.sampleContext}</p>}
          {scene.voiceGuidelines.directorsNote && <p>🎬 <span className="font-medium pg-text-heading">{t("vgNote")}</span> {scene.voiceGuidelines.directorsNote}</p>}
          {scene.voiceGuidelines.traits && <p>🎙️ <span className="font-medium pg-text-heading">{t("vgTraits")}</span> {scene.voiceGuidelines.traits}</p>}
          {scene.voiceGuidelines.sync && <p>⏱️ <span className="font-medium pg-text-heading">{t("vgSync")}</span> {scene.voiceGuidelines.sync}</p>}
        </div>
      )}

      {/* Visual Prompt */}
      {scene.visual !== "—" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold pg-text-sub uppercase tracking-wide flex items-center gap-1.5">
              <span>🎨</span> {t("visualPrompt")}
            </span>
            <div className="inline-flex rounded-lg shadow-xs overflow-hidden border border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  const fullVisual = buildUnifiedVisualPrompt({
                    visual: buildVisualPrompt(scene.visual),
                    durasi: scene.durasi,
                    estimatedDurationSec: scene.estimatedDurationSec,
                    sceneContext: scene.sceneContext,
                  }, { locale });
                  copy(`vis-full-${scene.id}`, fullVisual);
                }}
                className="text-xs px-2.5 py-1 font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1"
                title={t("copyFullVisualPromptTitle")}
              >
                <span>📋</span>
                {copiedId === `vis-full-${scene.id}` ? `✓ ${t("copied")}` : t("copyFullVisualPrompt")}
              </button>
              <button
                type="button"
                onClick={() => copy(`vis-raw-${scene.id}`, buildVisualPrompt(scene.visual))}
                className="text-xs px-2 py-1 font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-l border-slate-700/60 transition-colors"
                title={t("copyRawVisualPromptTitle")}
              >
                {copiedId === `vis-raw-${scene.id}` ? `✓ ${t("rawCopied")}` : t("rawVisualPrompt")}
              </button>
            </div>
          </div>
          <div className="rounded-xl p-3.5 bg-slate-950 dark:bg-black/60 border border-slate-800 shadow-inner">
            <p className="text-xs font-mono text-slate-200 leading-relaxed break-words">{buildVisualPrompt(scene.visual)}</p>
          </div>
        </div>
      )}

      {/* Copy Overlay + Visual (Fitur 2) */}
      {(scene.teksOverlay || (scene.visual && scene.visual !== "—")) && (
        <button
          type="button"
          onClick={() => handleCopyOverlayVisual(scene)}
          className="pg-btn-secondary min-h-[32px] px-3 py-1 text-xs font-semibold rounded-lg shadow-xs hover:border-[var(--pg-brand)] transition-all flex items-center gap-1.5"
        >
          <span>📋</span>
          {copiedId === `ov-vis-${scene.id}` ? `✓ ${t("copyOverlayVisualSuccess")}` : t("copyOverlayVisual")}
        </button>
      )}
    </div>
    </div>
    );
  })}
  </div>
  )}

  {/* Thumbnail Studio */}
  {activeTab === "thumbnail" && thumbnailData && (
    <div className="space-y-6">
      {/* Header & Global Actions Bar */}
      <div className="glass-panel rounded-xl p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold pg-text-heading flex items-center gap-2">
              <span>🖼️</span> {t("thumbnailTab")}
            </h2>
            <p className="text-xs pg-text-muted mt-0.5">{t("thumbnailSubtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Aspect Ratio Picker */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-[11px] font-medium pg-text-muted px-1.5">{t("thumbnailAspectLabel")}:</span>
              {(["16:9", "9:16"] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setThumbAr(ratio)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    thumbAr === ratio
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {ratio} {ratio === "16:9" ? "(Landscape)" : "(Vertical)"}
                </button>
              ))}
            </div>

            {/* Copy All Concepts Button */}
            <button
              type="button"
              onClick={copyAllThumbnailConcept}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm active:scale-95"
            >
              <span>📋</span>
              {copiedId === "all-thumb" ? `✓ ${t("allThumbnailCopied")}` : t("copyAllThumbnail")}
            </button>
          </div>
        </div>

        {/* SEO Hook Text Banner (jika ada) */}
        {thumbnailData.seoText && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/30 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span>🔥</span> {t("seoOverlayTitle")}
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-medium">
                  Curiosity Gap
                </span>
              </div>
              <p className="text-sm font-bold pg-text-heading tracking-wide">
                &ldquo;{thumbnailData.seoText}&rdquo;
              </p>
              <p className="text-[11px] pg-text-muted">{t("seoOverlayDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => copy("seo", thumbnailData.seoText)}
              className="self-start sm:self-center shrink-0 text-xs font-medium px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 transition-colors"
            >
              {copiedId === "seo" ? "✓" : t("copy")}
            </button>
          </div>
        )}

        {/* Mobile Screen Shrink Test Preview (YouTube 2026 Strategy) */}
        {(() => {
          const testText = thumbnailData.seoText || thumbnailData.opsi1Overlay || thumbnailData.opsi2Overlay || "";
          const wordCount = testText.trim() ? testText.trim().split(/\s+/).length : 0;
          return (
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-purple-500/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <span>📱</span> Mobile Screen &quot;Shrink Test&quot; (Simulasi Feed HP YouTube 2026)
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    wordCount <= 3
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}>
                    {wordCount <= 3 ? "✓ Lolos (1-3 Kata)" : `⚠️ ${wordCount} Kata (Disarankan Maks 3 Kata)`}
                  </span>
                </div>
                <p className="text-[10px] pg-text-muted">
                  Uji keterbacaan dalam 0.5 detik pada layar smartphone kecil
                </p>
              </div>

              {/* Smartphone Simulator Preview Card */}
              <div className="flex flex-wrap items-center gap-4">
                <div className={`relative rounded-lg overflow-hidden border-2 border-slate-700 shadow-lg bg-slate-900 flex items-center justify-center p-3 text-center ${
                  thumbAr === "16:9" ? "w-52 h-28" : "w-32 h-52"
                }`}>
                  {/* Subtle simulated cinematic background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-slate-950 to-black pointer-events-none" />
                  <div className="absolute top-1.5 right-1.5 bg-black/80 text-[8px] font-bold text-white px-1 rounded z-10">
                    HD
                  </div>
                  {/* High contrast bold thumbnail text */}
                  <p className="relative z-10 text-white font-black text-xs uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-black/50 px-2 py-1 rounded border border-white/20 max-w-full truncate">
                    {testText || "JUDUL PUNCHY"}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs pg-text-sub flex-1 min-w-[200px]">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>{t("shrinkWordLength")}:</strong> {wordCount} {t("wordsUnit")} ({wordCount <= 3 ? t("shrinkOptimal") : t("shrinkTooLong")})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>{t("shrinkFraming")}:</strong> {t("shrinkFramingDesc")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>{t("shrinkAbTesting")}:</strong> {t("shrinkAbTestingDesc")}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Grid Opsi 1 & Opsi 2 */}
      {(thumbnailData.opsi1Prompt || thumbnailData.opsi2Prompt) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Opsi 1 */}
          {thumbnailData.opsi1Prompt && (
            <div className="glass-panel rounded-xl p-5 border border-blue-200/70 dark:border-blue-800/70 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <span>🎯</span> {t("option1Title")}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {t("primaryBadge")}
                    </span>
                  </div>
                </div>

                {/* Teks Overlay Opsi 1 */}
                {thumbnailData.opsi1Overlay && (
                  <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                        <span>💬</span> {t("overlayTextLabel")}
                      </span>
                      <button
                        type="button"
                        onClick={() => copy("o1o", thumbnailData.opsi1Overlay)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {copiedId === "o1o" ? "✓" : t("copy")}
                      </button>
                    </div>
                    <p className="text-sm font-bold pg-text-heading tracking-wide">
                      &ldquo;{thumbnailData.opsi1Overlay}&rdquo;
                    </p>
                  </div>
                )}

                {/* Visual Prompt Opsi 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold pg-text-muted uppercase flex items-center gap-1">
                      <span>🎨</span> {t("promptAiLabel")}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copy("o1p-raw", thumbnailData.opsi1Prompt)}
                        className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        title={t("copyPromptRaw")}
                      >
                        {copiedId === "o1p-raw" ? "✓" : t("copyPromptRaw")}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-mono pg-text-sub pg-surface-dim rounded-lg p-3 leading-relaxed break-words border border-slate-200/50 dark:border-slate-700/50">
                    {buildThumbnailPrompt(thumbnailData.opsi1Prompt)}
                  </p>
                </div>

                {/* Bedah Formula Visual Opsi 1 */}
                <div className="rounded-lg p-3 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 space-y-2">
                  <span className="text-[11px] font-bold pg-text-muted uppercase tracking-wider flex items-center gap-1">
                    <span>🔍</span> {t("breakdownTitle")}
                  </span>
                  <div className="grid grid-cols-1 gap-2 text-[11px]">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-semibold text-blue-600 dark:text-blue-400">👤 {t("breakdownSubject")}:</span>
                      <span className="pg-text-sub">{t("breakdownSubjectDesc")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400">💡 {t("breakdownLighting")}:</span>
                      <span className="pg-text-sub">{t("breakdownLightingDesc")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-semibold text-emerald-600 dark:text-emerald-400">📐 {t("breakdownComposition")}:</span>
                      <span className="pg-text-sub">{t("breakdownCompositionDesc")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const formatted = `[Visual Prompt]\n${buildThumbnailPrompt(thumbnailData.opsi1Prompt)}\n\n[Overlay Text]\n${thumbnailData.opsi1Overlay || "—"}`;
                    copy("o1-all", formatted);
                  }}
                  className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>📋</span>
                  {copiedId === "o1-all" ? t("copyOverlayVisualSuccess") : t("copyOverlayVisual")}
                </button>
              </div>
            </div>
          )}

          {/* Card Opsi 2 */}
          {thumbnailData.opsi2Prompt && (
            <div className="glass-panel rounded-xl p-5 border border-purple-200/70 dark:border-purple-800/70 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <span>⚡</span> {t("option2Title")}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                      {t("abTestBadge")}
                    </span>
                  </div>
                </div>

                {/* Teks Overlay Opsi 2 */}
                {thumbnailData.opsi2Overlay && (
                  <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        <span>💬</span> {t("overlayTextLabel")}
                      </span>
                      <button
                        type="button"
                        onClick={() => copy("o2o", thumbnailData.opsi2Overlay)}
                        className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        {copiedId === "o2o" ? "✓" : t("copy")}
                      </button>
                    </div>
                    <p className="text-sm font-bold pg-text-heading tracking-wide">
                      &ldquo;{thumbnailData.opsi2Overlay}&rdquo;
                    </p>
                  </div>
                )}

                {/* Visual Prompt Opsi 2 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold pg-text-muted uppercase flex items-center gap-1">
                      <span>🎨</span> {t("promptAiLabel")}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copy("o2p-raw", thumbnailData.opsi2Prompt)}
                        className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        title={t("copyPromptRaw")}
                      >
                        {copiedId === "o2p-raw" ? "✓" : t("copyPromptRaw")}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-mono pg-text-sub pg-surface-dim rounded-lg p-3 leading-relaxed break-words border border-slate-200/50 dark:border-slate-700/50">
                    {buildThumbnailPrompt(thumbnailData.opsi2Prompt)}
                  </p>
                </div>

                {/* Bedah Formula Visual Opsi 2 */}
                <div className="rounded-lg p-3 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 space-y-2">
                  <span className="text-[11px] font-bold pg-text-muted uppercase tracking-wider flex items-center gap-1">
                    <span>🔍</span> {t("breakdownTitle")}
                  </span>
                  <div className="grid grid-cols-1 gap-2 text-[11px]">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-semibold text-purple-600 dark:text-purple-400">👤 {t("breakdownSubject")}:</span>
                      <span className="pg-text-sub">{t("breakdownSubjectDesc")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400">💡 {t("breakdownLighting")}:</span>
                      <span className="pg-text-sub">{t("breakdownLightingDesc")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-semibold text-emerald-600 dark:text-emerald-400">📐 {t("breakdownComposition")}:</span>
                      <span className="pg-text-sub">{t("breakdownCompositionDesc")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const formatted = `[Visual Prompt]\n${buildThumbnailPrompt(thumbnailData.opsi2Prompt)}\n\n[Overlay Text]\n${thumbnailData.opsi2Overlay || "—"}`;
                    copy("o2-all", formatted);
                  }}
                  className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>📋</span>
                  {copiedId === "o2-all" ? t("copyOverlayVisualSuccess") : t("copyOverlayVisual")}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Rekomendasi Warna & Elemen */}
      {thumbnailData.recommendations && (
        <div className="glass-panel rounded-xl p-5 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <span>🎨</span> {t("recommendationsTitle")}
            </h3>
            <button
              type="button"
              onClick={() => copy("rec", thumbnailData.recommendations)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              {copiedId === "rec" ? "✓" : t("copy")}
            </button>
          </div>
          <p className="text-sm pg-text-sub leading-relaxed pg-surface-dim rounded-lg p-3.5 border border-emerald-200/30 dark:border-emerald-900/30">
            {thumbnailData.recommendations}
          </p>
        </div>
      )}

      {/* Tips Box */}
      <div className="glass-panel rounded-xl p-4 border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
        <h4 className="text-xs font-bold pg-text-heading flex items-center gap-1.5">
          <span>💡</span> {t("thumbnailTipsTitle")}
        </h4>
        <ul className="text-xs pg-text-muted space-y-1 list-disc list-inside">
          <li>{t("thumbnailTip1")}</li>
          <li>{t("thumbnailTip2")}</li>
          <li>{t("thumbnailTip3")}</li>
        </ul>
      </div>

      {!thumbnailData.seoText && !thumbnailData.opsi1Prompt && (
        <p className="text-sm pg-text-muted text-center py-4">{t("noThumbnailData")}</p>
      )}
    </div>
  )}
  {activeTab === "thumbnail" && !thumbnailData && (
    <div className="glass-panel rounded-xl p-8 text-center pg-text-muted text-sm space-y-2">
      <div className="text-3xl">🖼️</div>
      <p>{t("noThumbnailData")}</p>
    </div>
  )}

  {/* YouTube 2026 SEO & Pre-Flight Studio */}
  {activeTab === "seo2026" && threeTierSeo && (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-xl p-6 border border-red-500/20 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-transparent space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h2 className="text-lg font-bold pg-text-heading">{t("seoStudioTitle")}</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                Algorithm Ready
              </span>
            </div>
            <p className="text-xs pg-text-muted mt-1">
              {t("seoStudioSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const tags500 = buildCombinedYouTubeTags(
                  threeTierSeo.tagSpesifik,
                  threeTierSeo.tagUmum,
                  threeTierSeo.tagMajemuk,
                  500
                );
                if (!tags500) {
                  toast.error("Tag kosong atau belum tersedia");
                  return;
                }
                copy("all-yt-tags", tags500);
                toast.success(t("ytStudioTagsCopiedToast"));
              }}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title={t("combinedTagsBoxTitle")}
            >
              <span>⚡</span>
              {copiedId === "all-yt-tags" ? "✓ " + t("ytStudioTagsCopied") : t("copyYtStudioTags")}
            </button>
            <button
              type="button"
              onClick={() => {
                const fullSeo = [
                  `=== YOUTUBE 2026 SEO METADATA ===`,
                  locale === "en" ? `[SPECIFIC TAGS]\n${threeTierSeo.tagSpesifik}` : `[TAG SPESIFIK]\n${threeTierSeo.tagSpesifik}`,
                  locale === "en" ? `\n[GENERAL TAGS]\n${threeTierSeo.tagUmum}` : `\n[TAG UMUM]\n${threeTierSeo.tagUmum}`,
                  locale === "en" ? `\n[LONG-TAIL TAGS]\n${threeTierSeo.tagMajemuk}` : `\n[TAG MAJEMUK / LONG-TAIL]\n${threeTierSeo.tagMajemuk}`,
                  locale === "en" ? `\n[YOUTUBE DESCRIPTION (SEO & EMPATHY)]\n${threeTierSeo.deskripsi}` : `\n[DESKRIPSI YOUTUBE (SEO & EMPATI)]\n${threeTierSeo.deskripsi}`,
                  locale === "en" ? `\n[PRE-UPLOAD CHECKLIST]\n` + threeTierSeo.checklist.map((c, i) => `${i + 1}. ${c}`).join("\n") : `\n[CHECKLIST PRA-UPLOAD]\n` + threeTierSeo.checklist.map((c, i) => `${i + 1}. ${c}`).join("\n"),
                ].join("\n");
                copy("all-seo", fullSeo);
              }}
              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>📋</span>
              {copiedId === "all-seo" ? "✓ " + t("copied") : t("copyAllSeoMetadata")}
            </button>
          </div>
        </div>
      </div>

      {/* 3-Tier Keyword Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 1: Tag Spesifik */}
        <div className="glass-panel rounded-xl p-5 border border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t("tier1Title")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const val = formatAsYouTubeTags(threeTierSeo.tagSpesifik);
                  if (val) {
                    copy("tag-spec-yt", val);
                    toast.success(t("specificTagsCopiedToast"));
                  }
                }}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer transition-colors"
                title={t("copyAsCommaKeywords")}
              >
                {copiedId === "tag-spec-yt" ? "✓ Tags" : "📋 Tags"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = formatAsHashtags(threeTierSeo.tagSpesifik);
                  if (val) {
                    copy("tag-spec-hash", val);
                    toast.success(t("descHashtagsCopiedToast"));
                  }
                }}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer transition-colors"
                title={t("copyAsHashtagsDesc")}
              >
                {copiedId === "tag-spec-hash" ? "✓ #Hashtag" : "🏷️ #Hashtag"}
              </button>
            </div>
          </div>
          <p className="text-[11px] pg-text-muted leading-relaxed">
            {t("tier1Desc")}
          </p>
          <div className="pg-surface-dim rounded-lg p-3 text-xs font-mono pg-text-sub border border-slate-200/40 dark:border-slate-800/40 min-h-[60px] flex flex-wrap gap-1.5 items-start">
            {threeTierSeo.tagSpesifik ? (
              threeTierSeo.tagSpesifik
                .split(/[,;\n]+/)
                .map((t) => t.replace(/^[#\s"']+|[#\s"']+$/g, "").trim())
                .filter(Boolean)
                .map((t, idx) => (
                  <span key={idx} className="inline-block px-2 py-0.5 rounded-md bg-blue-100/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px]">
                    {t}
                  </span>
                ))
            ) : (
              <span className="text-slate-400 italic">{t("noSpecificTags")}</span>
            )}
          </div>
        </div>

        {/* Tier 2: Tag Umum */}
        <div className="glass-panel rounded-xl p-5 border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                {t("tier2Title")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const val = formatAsYouTubeTags(threeTierSeo.tagUmum);
                  if (val) {
                    copy("tag-gen-yt", val);
                    toast.success(t("generalTagsCopiedToast"));
                  }
                }}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer transition-colors"
                title={t("copyAsCommaKeywords")}
              >
                {copiedId === "tag-gen-yt" ? "✓ Tags" : "📋 Tags"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = formatAsHashtags(threeTierSeo.tagUmum);
                  if (val) {
                    copy("tag-gen-hash", val);
                    toast.success(t("descHashtagsCopiedToast"));
                  }
                }}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer transition-colors"
                title={t("copyAsHashtagsDesc")}
              >
                {copiedId === "tag-gen-hash" ? "✓ #Hashtag" : "🏷️ #Hashtag"}
              </button>
            </div>
          </div>
          <p className="text-[11px] pg-text-muted leading-relaxed">
            {t("tier2Desc")}
          </p>
          <div className="pg-surface-dim rounded-lg p-3 text-xs font-mono pg-text-sub border border-slate-200/40 dark:border-slate-800/40 min-h-[60px] flex flex-wrap gap-1.5 items-start">
            {threeTierSeo.tagUmum ? (
              threeTierSeo.tagUmum
                .split(/[,;\n]+/)
                .map((t) => t.replace(/^[#\s"']+|[#\s"']+$/g, "").trim())
                .filter(Boolean)
                .map((t, idx) => (
                  <span key={idx} className="inline-block px-2 py-0.5 rounded-md bg-purple-100/70 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[11px]">
                    {t}
                  </span>
                ))
            ) : (
              <span className="text-slate-400 italic">{t("noGeneralTags")}</span>
            )}
          </div>
        </div>

        {/* Tier 3: Tag Majemuk / Long-Tail */}
        <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t("tier3Title")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const val = formatAsYouTubeTags(threeTierSeo.tagMajemuk);
                  if (val) {
                    copy("tag-long-yt", val);
                    toast.success(t("longTailTagsCopiedToast"));
                  }
                }}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer transition-colors"
                title={t("copyAsCommaKeywords")}
              >
                {copiedId === "tag-long-yt" ? "✓ Tags" : "📋 Tags"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = formatAsHashtags(threeTierSeo.tagMajemuk);
                  if (val) {
                    copy("tag-long-hash", val);
                    toast.success(t("descHashtagsCopiedToast"));
                  }
                }}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer transition-colors"
                title={t("copyAsHashtagsDesc")}
              >
                {copiedId === "tag-long-hash" ? "✓ #Hashtag" : "🏷️ #Hashtag"}
              </button>
            </div>
          </div>
          <p className="text-[11px] pg-text-muted leading-relaxed">
            {t("tier3Desc")}
          </p>
          <div className="pg-surface-dim rounded-lg p-3 text-xs font-mono pg-text-sub border border-slate-200/40 dark:border-slate-800/40 min-h-[60px] flex flex-wrap gap-1.5 items-start">
            {threeTierSeo.tagMajemuk ? (
              threeTierSeo.tagMajemuk
                .split(/[,;\n]+/)
                .map((t) => t.replace(/^[#\s"']+|[#\s"']+$/g, "").trim())
                .filter(Boolean)
                .map((t, idx) => (
                  <span key={idx} className="inline-block px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px]">
                    {t}
                  </span>
                ))
            ) : (
              <span className="text-slate-400 italic">{t("noCompoundTags")}</span>
            )}
          </div>
        </div>
      </div>

      {/* Deskripsi Naratif Berempati */}
      <div className="glass-panel rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <div>
              <h3 className="text-sm font-bold pg-text-heading">{t("seoVideoDescTitle")}</h3>
              <p className="text-[11px] pg-text-muted">
                {t("seoVideoDescSubtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => copy("seo-desc", threeTierSeo.deskripsi)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium pg-text-sub transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>📋</span>
            {copiedId === "seo-desc" ? "✓ " + t("copied") : t("copyDescription")}
          </button>
        </div>
        <div className="pg-surface-dim rounded-lg p-4 text-xs pg-text-sub whitespace-pre-wrap leading-relaxed border border-slate-200/50 dark:border-slate-800/50 max-h-80 overflow-y-auto custom-scrollbar font-sans">
          {threeTierSeo.deskripsi || <span className="text-slate-400 italic">{t("descNotAvailable")}</span>}
        </div>
      </div>

      {/* Pre-Flight Checklist Pra-Upload */}
      <div className="glass-panel rounded-xl p-6 space-y-4 border border-amber-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛫</span>
            <div>
              <h3 className="text-sm font-bold pg-text-heading">{t("seoChecklistTitle")}</h3>
              <p className="text-[11px] pg-text-muted">
                {t("seoChecklistSubtitle")}
              </p>
            </div>
          </div>
          <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0 self-start sm:self-auto">
            {Object.values(completedChecklist).filter(Boolean).length} / {threeTierSeo.checklist.length} {t("completed")}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(Object.values(completedChecklist).filter(Boolean).length / Math.max(threeTierSeo.checklist.length, 1)) * 100}%`
            }}
          />
        </div>

        <div className="space-y-2 pt-1">
          {threeTierSeo.checklist.map((item, idx) => {
            const isDone = Boolean(completedChecklist[idx]);
            return (
              <label
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                  isDone
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-800/60"
                    : "pg-surface-dim border-slate-200/40 dark:border-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={(e) => {
                    setCompletedChecklist(prev => ({ ...prev, [idx]: e.target.checked }));
                  }}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className={`text-xs leading-relaxed ${isDone ? "line-through text-slate-400 dark:text-slate-500" : "pg-text-sub font-medium"}`}>
                  {item}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  )}

  {activeTab === "seo2026" && !threeTierSeo && (
    <div className="glass-panel rounded-xl p-8 text-center pg-text-muted text-sm space-y-2">
      <div className="text-3xl">🎯</div>
      <p className="font-semibold pg-text-heading">{t("seoNotGeneratedTitle")}</p>
      <p className="text-xs max-w-md mx-auto">
        {t("seoNotGeneratedDesc")}
      </p>
    </div>
  )}

 {/* Platform Content & Multi-Platform SEO 2026 */}
 {activeTab === "platform" && (() => {
    const platformList: Array<{
      key: "youtube" | "tiktok" | "instagram" | "facebook";
      label: string;
      icon: string;
      limitDesc: string;
    }> = [
      {
        key: "youtube",
        label: t("platformYoutube"),
        icon: "🔴",
        limitDesc: locale === "id"
          ? "Batas: 5.000 kar. | Optimal: 800–1.500 kar. (Hook 150 kar. pertama krusial)"
          : "Limit: 5,000 chars | Optimal: 800–1,500 chars (First 150 chars crucial for snippet)",
      },
      {
        key: "tiktok",
        label: t("platformTiktok"),
        icon: "⚫",
        limitDesc: locale === "id"
          ? "Batas: 2.200 kar. | Optimal: 150–300 kar. (Cut-off 70–100 kar. di layar HP)"
          : "Limit: 2,200 chars | Optimal: 150–300 chars (Screen cut-off at 70–100 chars)",
      },
      {
        key: "instagram",
        label: t("platformInstagram"),
        icon: "🟣",
        limitDesc: locale === "id"
          ? "Batas: 2.200 kar. | Optimal: 200–500 kar. (Hook WAJIB tuntas sebelum 125 kar.)"
          : "Limit: 2,200 chars | Optimal: 200–500 chars (Hook must complete before 125 chars)",
      },
      {
        key: "facebook",
        label: t("platformFacebook"),
        icon: "🔵",
        limitDesc: locale === "id"
          ? "Batas: 2.000 kar. (Reels) | Optimal: 250–500 kar. (Diskusi ramah komunitas)"
          : "Limit: 2,000 chars (Reels) | Optimal: 250–500 chars (Community discussion)",
      },
    ];

    const activeItem: PlatformSeoItem | undefined = multiPlatformSeo?.[selectedPlatformTab];
    const hasAnyContent = Boolean(
      activeItem?.description ||
      activeItem?.hashtags ||
      activeItem?.tags ||
      caption ||
      hashtags
    );

    const effectiveItem: PlatformSeoItem = activeItem || {
      platform: selectedPlatformTab,
      description: caption || "",
      hashtags: hashtags || "",
      tags: "",
      charCount: {
        description: (caption || "").length,
        hashtags: (hashtags || "").length,
        tags: 0,
      },
      status: evaluatePlatformSeoStatus(selectedPlatformTab, (caption || "").length, 0),
    };

    const currentMeta = platformList.find((p) => p.key === selectedPlatformTab) || platformList[0];

    const handleCopyAllPlatform = () => {
      const parts: string[] = [];
      if (effectiveItem.description) parts.push(effectiveItem.description);
      if (effectiveItem.hashtags) parts.push(effectiveItem.hashtags);
      const combined = parts.join("\n\n");
      if (!combined) return;
      copy(`plat-all-${selectedPlatformTab}`, combined);
      toast.success(t("allCopiedSuccess"));
    };

    const handleDownloadPlatformTxt = () => {
      const text = formatPlatformSeoText(selectedPlatformTab, effectiveItem, draftTitle || "Untitled");
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedPlatformTab}_metadata_${(draftTitle || "konten").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(locale === "id" ? `File ${selectedPlatformTab}_metadata.txt berhasil diunduh!` : `${selectedPlatformTab}_metadata.txt downloaded!`);
    };

    return (
      <div className="space-y-6">
        {/* Header & Subtitle */}
        <div className="glass-panel rounded-2xl p-6 border pg-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold pg-text-heading flex items-center gap-2">
                <span>📱</span> {t("platformContent")}
              </h2>
              <p className="text-xs pg-text-muted mt-1 max-w-2xl leading-relaxed">
                {t("platformSeoSubtitle")}
              </p>
            </div>

            {hasAnyContent && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyAllPlatform}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95"
                >
                  <span>{copiedId === `plat-all-${selectedPlatformTab}` ? "✓" : "📋"}</span>
                  <span>
                    {copiedId === `plat-all-${selectedPlatformTab}`
                      ? t("copied")
                      : `${t("copyAllPlatform")} (${currentMeta.label})`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPlatformTxt}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm transition-all active:scale-95"
                  title="Unduh metadata file .txt untuk platform ini"
                >
                  <span>💾</span>
                  <span>Unduh .txt</span>
                </button>
              </div>
            )}
          </div>

          {/* Sub-Tab Platform Selector */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pt-2 pb-1 border-t pg-border">
            {platformList.map((p) => {
              const isSelected = selectedPlatformTab === p.key;
              const hasData = Boolean(
                multiPlatformSeo?.[p.key]?.description ||
                (caption && p.key === "youtube")
              );

              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedPlatformTab(p.key)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                      : "pg-surface-dim hover:pg-surface text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                  {hasData && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-emerald-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {!hasAnyContent ? (
          <div className="glass-panel rounded-2xl p-8 border pg-border text-center space-y-3">
            <span className="text-3xl">📭</span>
            <h3 className="text-sm font-semibold pg-text-heading">
              {locale === "id" ? "Belum ada konten platform" : "No platform content available"}
            </h3>
            <p className="text-xs pg-text-muted max-w-sm mx-auto">
              {locale === "id"
                ? "Generate atau parse naskah dengan bagian KONTEN PLATFORM aktif untuk melihat deskripsi, hashtag, dan tag SEO."
                : "Generate or parse a script with PLATFORM CONTENT enabled to view tailored descriptions, hashtags, and SEO tags."}
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-6 border pg-border shadow-sm space-y-6">
            {/* Platform Status & Character Health Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border pg-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold pg-text-heading flex items-center gap-1.5">
                    <span>{currentMeta.icon}</span> {currentMeta.label} SEO Hub
                  </span>
                  {effectiveItem.status.descriptionIdeal ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {t("charCountIdeal")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      {t("charCountWarning")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] pg-text-muted">
                  {currentMeta.limitDesc}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold pg-text-heading">
                  {effectiveItem.charCount.description}
                </span>
                <span className="text-[11px] pg-text-muted font-mono ml-1">
                  {locale === "id" ? "Karakter Deskripsi" : "Desc Characters"}
                </span>
              </div>
            </div>

            {/* Warnings if any */}
            {effectiveItem.status.descriptionWarning && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{effectiveItem.status.descriptionWarning}</span>
              </div>
            )}
            {effectiveItem.status.tagsWarning && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">🚨</span>
                <span>{effectiveItem.status.tagsWarning}</span>
              </div>
            )}

            {/* Description Block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold pg-text-heading flex items-center gap-1.5">
                  <span>📝</span> {t("platformDescTitle")}
                </span>
                <button
                  type="button"
                  onClick={() => copy(`plat-desc-${selectedPlatformTab}`, effectiveItem.description)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {copiedId === `plat-desc-${selectedPlatformTab}` ? `✓ ${t("copied")}` : t("copyDescription")}
                </button>
              </div>
              <p className="text-sm pg-text-sub pg-surface-dim rounded-xl p-4 whitespace-pre-wrap leading-relaxed border pg-border">
                {effectiveItem.description || (
                  <span className="text-slate-400 italic">
                    {locale === "id" ? "Deskripsi tidak tersedia." : "Description not available."}
                  </span>
                )}
              </p>
            </div>

            {/* Hashtags Block */}
            {effectiveItem.hashtags && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold pg-text-heading flex items-center gap-1.5">
                    <span>#️⃣</span> {t("platformHashtagsTitle")}
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(`plat-hash-${selectedPlatformTab}`, effectiveItem.hashtags)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copiedId === `plat-hash-${selectedPlatformTab}` ? `✓ ${t("copied")}` : t("copyHashtags")}
                  </button>
                </div>
                <div className="pg-surface-dim rounded-xl p-3.5 border pg-border space-y-2.5">
                  <p className="text-xs font-mono pg-text-sub">{effectiveItem.hashtags}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {effectiveItem.hashtags
                      .split(/\s+/)
                      .filter((h) => h.startsWith("#"))
                      .map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tags / Kata Kunci Rekomendasi Block */}
            {effectiveItem.tags && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold pg-text-heading flex items-center gap-1.5">
                      <span>🎯</span> {t("platformTagsTitle")}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {effectiveItem.charCount.tags} / 500 kar.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const formatted = formatAsYouTubeTags(effectiveItem.tags) || effectiveItem.tags;
                      copy(`plat-tags-${selectedPlatformTab}`, formatted);
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copiedId === `plat-tags-${selectedPlatformTab}` ? `✓ ${t("copied")}` : t("copyTags")}
                  </button>
                </div>
                <div className="pg-surface-dim rounded-xl p-3.5 border pg-border space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {effectiveItem.tags
                      .split(/[,;\n]+/)
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  })()}

 {/* ── Voice Studio Tab ── */}
 {activeTab === "voiceStudio" && (
 <div className="space-y-5">
   {!planFeatures.textToSpeechStudio ? (
     <div className="glass-panel rounded-xl p-8 border border-amber-200/60 dark:border-amber-800/60 text-center space-y-4">
       <div className="text-4xl">🔒</div>
       <h3 className="text-lg font-bold pg-text-heading">{t("voiceStudioTitle")}</h3>
       <p className="text-sm pg-text-muted max-w-sm mx-auto">{t("voiceStudioLocked")}</p>
       <Link href="/dashboard/billing" className="inline-block px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
         {t("voiceStudioUpgrade")}
       </Link>
     </div>
   ) : (
     <div className="glass-panel rounded-xl p-6 border border-indigo-200/60 dark:border-indigo-800/60 space-y-5">

       {/* Header + Action Buttons */}
       <div className="flex items-center justify-between flex-wrap gap-2">
         <h3 className="text-base font-bold pg-text-heading flex items-center gap-2">
           <span>🎙️</span> {t("voiceStudioTitle")}
         </h3>
         <div className="flex items-center gap-2 flex-wrap">
           {Object.values(ttsResults).some(r => r.status === "done") && (
             <button type="button" onClick={downloadAllAsZip}
               className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm active:scale-95">
               <span>📦</span> {t("ttsDownloadAllZip")}
             </button>
           )}
           <button type="button" onClick={generateAllScenesTts} disabled={ttsGeneratingAll || ttsMerging}
             className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50">
             <span>⚡</span> {ttsGeneratingAll ? t("ttsGeneratingAll") : t("ttsGenerateAll")}
           </button>
           <button type="button" onClick={generateAndMergeAll} disabled={ttsGeneratingAll || ttsMerging}
             className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50">
             <span>🔗</span> {ttsMerging ? t("ttsMergingAll") : t("ttsGenerateMergeAll")}
           </button>
         </div>
       </div>

       {/* Full VO Player (muncul setelah merge berhasil) */}
       {ttsMergedAudio && (
         <div className="rounded-xl p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 space-y-2">
           <div className="flex items-center justify-between gap-2 flex-wrap">
             <span className="text-xs font-bold text-violet-700 dark:text-violet-300">🎵 {t("ttsFullVoiceOver")}</span>
             <button type="button" onClick={downloadMergedAudio}
               className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-all active:scale-95">
               ⬇️ {t("ttsDownloadFullVo")}
             </button>
           </div>
           <audio controls className="w-full" src={`data:audio/wav;base64,${ttsMergedAudio}`} />
         </div>
       )}

       {/* Voice Settings Grid */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Voice Selector with Pills, Search & Star Toggle */}
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-semibold pg-text-heading flex items-center gap-1.5">
                <span>🎙️</span> {t("voiceSelectLabel")}
              </label>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setTtsVoiceFilter("all")}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                    ttsVoiceFilter === "all"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {t("ttsFilterAll")} ({GEMINI_TTS_VOICES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTtsVoiceFilter("favorites")}
                  className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                    ttsVoiceFilter === "favorites"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>⭐</span> {t("ttsFilterFavorites")} ({favoriteVoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTtsVoiceFilter("male")}
                  className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                    ttsVoiceFilter === "male"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>👨</span> {t("ttsFilterMale")} ({GEMINI_TTS_VOICES.filter(v => v.gender === "Male").length})
                </button>
                <button
                  type="button"
                  onClick={() => setTtsVoiceFilter("female")}
                  className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                    ttsVoiceFilter === "female"
                      ? "bg-pink-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>👩</span> {t("ttsFilterFemale")} ({GEMINI_TTS_VOICES.filter(v => v.gender === "Female").length})
                </button>
              </div>
            </div>

            {/* Search Input for Quick Finding */}
            <div className="relative">
              <input
                type="text"
                value={ttsVoiceSearch}
                onChange={e => setTtsVoiceSearch(e.target.value)}
                placeholder={t("ttsSearchVoicePlaceholder")}
                className="w-full pl-7 pr-7 py-1 text-xs bg-slate-50 dark:bg-slate-800/80 border pg-border rounded-md outline-none dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">🔍</span>
              {ttsVoiceSearch && (
                <button
                  type="button"
                  onClick={() => setTtsVoiceSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown + Star Toggle Button */}
            <div className="flex gap-1.5 items-center">
              <select
                value={ttsVoice}
                onChange={e => setTtsVoice(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white"
              >
                {displayVoices.length === 0 ? (
                  <option disabled value="">{t("ttsNoMatchingVoices")}</option>
                ) : (
                  displayVoices.map(v => {
                    const isFav = favoriteVoices.includes(v.id);
                    return (
                      <option key={v.id} value={v.id}>
                        {isFav ? "⭐ " : ""}{v.id} — {v.gender === "Male" ? "👨" : "👩"} {v.gender} · {v.tone}
                      </option>
                    );
                  })
                )}
              </select>

              {/* Star Button for Active Voice */}
              <button
                type="button"
                onClick={() => toggleFavoriteVoice(ttsVoice)}
                title={favoriteVoices.includes(ttsVoice) ? t("ttsFavoriteToggleRemove") : t("ttsFavoriteToggleAdd")}
                className={`px-2.5 py-1.5 rounded-md border text-sm transition-all flex items-center justify-center shrink-0 ${
                  favoriteVoices.includes(ttsVoice)
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-[var(--pg-warning)] shadow-xs"
                    : "bg-white dark:bg-slate-700 pg-border text-slate-400 hover:text-[var(--pg-warning)] hover:border-amber-300"
                }`}
              >
                {favoriteVoices.includes(ttsVoice) ? "⭐" : "☆"}
              </button>
            </div>

            {/* Info kartu voice yang dipilih */}
            {(() => {
              const selected = GEMINI_TTS_VOICES.find(v => v.id === ttsVoice);
              if (!selected) return null;
              const isFav = favoriteVoices.includes(selected.id);
              return (
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border pg-border space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold pg-text-heading flex items-center gap-1">
                        {isFav && <span className="text-[var(--pg-warning)]">⭐</span>}
                        {selected.id}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {selected.gender === "Male" ? "👨 Pria" : "👩 Wanita"}
                      </span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        · {selected.tone}
                      </span>
                    </div>
                    {isRecommendedForChannel && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        ✨ {t("ttsRecommendedForChannel")}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] pg-text-muted">🎯 {selected.bestFor}</p>
                </div>
              );
            })()}
          </div>

         {/* Model Selector */}
         <div>
           <label className="block text-xs font-medium pg-text-sub mb-1">{t("ttsModelLabel")}</label>
           <select value={ttsModel} onChange={e => setTtsModel(e.target.value)}
             className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white">
             {GEMINI_TTS_MODELS.map(m => (
               <option key={m.id} value={m.id}>{m.label}</option>
             ))}
           </select>
         </div>

         {/* Pitch Preset Dropdown */}
         <div>
           <label className="block text-xs font-medium pg-text-sub mb-1">{t("ttsPitchLabel")}</label>
           <select value={ttsPitch} onChange={e => setTtsPitch(e.target.value as typeof ttsPitch)}
             className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white">
             {TTS_PITCH_PRESETS.map(p => (
               <option key={p.id} value={p.id}>{p.label}</option>
             ))}
           </select>
         </div>
       </div>

       {/* Speed Slider + Style Instruction */}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
         <div>
           <div className="flex items-center justify-between mb-1">
             <label className="text-xs font-medium pg-text-sub">{t("ttsSpeedLabel")}</label>
             <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{ttsSpeed.toFixed(2)}×</span>
           </div>
           <input type="range" min={0.25} max={2.0} step={0.05} value={ttsSpeed}
             onChange={e => setTtsSpeed(parseFloat(e.target.value))}
             className="w-full accent-indigo-500" />
           <div className="flex justify-between text-[10px] pg-text-muted mt-0.5">
             <span>0.25×</span><span>1.0×</span><span>2.0×</span>
           </div>
         </div>
         <div>
           <label className="block text-xs font-medium pg-text-sub mb-1">{t("ttsStyleLabel")}</label>
           <input value={ttsStyleInstruction} onChange={e => setTtsStyleInstruction(e.target.value)}
             placeholder={t("ttsStylePlaceholder")}
             className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white" />
         </div>
       </div>

        {/* ── Voice Preview Panel ── */}
        <div className="rounded-xl p-4 bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 mb-0.5">
              {t("ttsPreviewTitle")}
            </h4>
            <p className="text-[11px] text-indigo-600/70 dark:text-indigo-400/70">{t("ttsPreviewDesc")}</p>
          </div>
          <div className="flex gap-2 items-start">
            <textarea
              value={ttsPreviewText}
              onChange={e => setTtsPreviewText(e.target.value)}
              placeholder={t("ttsPreviewPlaceholder")}
              rows={2}
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-600 rounded-lg outline-none dark:text-white resize-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
            />
            <button
              type="button"
              onClick={generatePreview}
              disabled={!ttsPreviewText.trim() || ttsPreviewResult?.status === "generating"}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              <span>🎧</span>
              {ttsPreviewResult?.status === "generating" ? t("ttsPreviewGenerating") : t("ttsPreviewButton")}
            </button>
          </div>
          {ttsPreviewResult?.status === "done" && ttsPreviewResult.audioBase64 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">🔊 {t("ttsPreviewPlay")}</p>
              <audio
                controls
                className="w-full h-8"
                src={`data:${ttsPreviewResult.mimeType || "audio/wav"};base64,${ttsPreviewResult.audioBase64}`}
              />
            </div>
          )}
          {ttsPreviewResult?.status === "error" && (
            <p className="text-[11px] text-[var(--pg-danger)] dark:text-red-400">⚠️ {ttsPreviewResult.errorMessage}</p>
          )}
        </div>

       {/* Per-Scene TTS List */}
       <div className="space-y-2.5">
         {scenes.filter(s => s.narasi !== "—" && !s.isDiegetic).map(scene => {
           const result = ttsResults[scene.id];
           const audioSrc = result?.audioBase64 ? `data:${result.mimeType || "audio/wav"};base64,${result.audioBase64}` : null;
           return (
             <div key={scene.id} className="rounded-lg p-3 pg-surface-dim border pg-border space-y-2">
               <div className="flex items-center justify-between gap-2">
                 <div className="flex items-center gap-2 flex-1 min-w-0">
                   <span className="text-xs font-bold pg-text-heading shrink-0">{scene.sceneNumber}</span>
                   <span className="text-xs pg-text-muted truncate">{scene.narasi.slice(0, 55)}…</span>
                 </div>
                 <div className="flex items-center gap-1.5 shrink-0">
                   {/* Durasi audio di kanan nama scene */}
                   {result?.durationSec !== undefined && (
                     <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                       {Math.floor(result.durationSec / 60)}:{String(Math.round(result.durationSec % 60)).padStart(2, "0")}
                     </span>
                   )}
                   {result?.status === "done" && (
                     <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">✅</span>
                   )}
                   {result?.status === "error" && (
                     <span className="text-[10px] font-semibold text-[var(--pg-danger)]" title={result.errorMessage}>❌</span>
                   )}
                   <button type="button" onClick={() => generateSceneTts(scene)}
                     disabled={result?.status === "generating"}
                     className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 disabled:opacity-40 transition-colors">
                     {result?.status === "generating" ? t("ttsGenerating") : t("ttsGenerateScene")}
                   </button>
                 </div>
               </div>
               {audioSrc && (
                 <audio controls className="w-full h-8" src={audioSrc}
                   onLoadedMetadata={(e) => {
                     const dur = (e.currentTarget as HTMLAudioElement).duration;
                     if (isFinite(dur)) {
                       setTtsResults(prev => ({
                         ...prev,
                         [scene.id]: { ...prev[scene.id]!, durationSec: dur }
                       }));
                     }
                   }}
                 />
               )}
             </div>
           );
         })}
       </div>

       {scenes.filter(s => s.narasi !== "—" && !s.isDiegetic).length === 0 && (
         <p className="text-sm pg-text-muted text-center py-4">{t("noNarrationToCopy")}</p>
       )}
     </div>
   )}
 </div>
 )}

 {activeTab === "htmlBlog" && (htmlBlog || blogPack.html) && (
   <div className="space-y-6">
     {/* ── Top Header & Action Bar ── */}
     <div className="glass-panel rounded-xl p-6 space-y-4">
       <div className="flex flex-wrap items-center justify-between gap-3">
         <div>
           <div className="flex items-center gap-2">
             <h2 className="font-bold text-lg pg-text-heading">📝 HTML Blog & Publishing Pack</h2>
           </div>
           <p className="text-xs pg-text-muted mt-1">
             {locale === "id"
               ? "Paket lengkap penerbitan blog: artikel HTML SEO, data visual terstruktur, metadata, dan prompt gambar."
               : "Complete blog publishing pack: SEO HTML article, structured visual data, metadata, and image prompts."}
           </p>
         </div>

         {/* Badges for detected dynamic elements */}
         <div className="flex flex-wrap items-center gap-2">
           {blogPack.hasTable && (
             <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
               📊 {locale === "id" ? "Tabel Data" : "Data Table"}
             </span>
           )}
           {blogPack.hasSvgChart && (
             <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
               📈 {locale === "id" ? "Diagram SVG" : "SVG Chart"}
             </span>
           )}
           {blogPack.hasInteractiveCalculator && (
             <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
               ⚡ {locale === "id" ? "Kalkulator Interaktif" : "Interactive Calculator"}
             </span>
           )}
         </div>

         {/* Action buttons */}
         <div className="flex items-center gap-2">
           <button
             onClick={handleDownloadHtml}
             className="text-xs px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
             title={locale === "id" ? "Unduh file .html siap upload" : "Download .html file"}
           >
             📥 {locale === "id" ? "Unduh .HTML" : "Download .HTML"}
           </button>
           <button
             onClick={() => copy("blog", blogPack.html || htmlBlog)}
             className="text-xs px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
           >
             {copiedId === "blog" ? "✓ " + t("copied") : "📋 " + (locale === "id" ? "Salin HTML Artikel" : t("copyHtml"))}
           </button>
         </div>
       </div>

       {/* View Mode Tabs */}
       <div className="flex items-center gap-1 border-b pg-border pb-2">
         <button
           onClick={() => setBlogPreviewMode("interactive")}
           className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
             blogPreviewMode === "interactive"
               ? "bg-emerald-600 text-white shadow-sm"
               : "pg-surface-dim pg-text-muted hover:pg-text-heading"
           }`}
         >
           ⚡ {locale === "id" ? "Live Interaktif (Iframe)" : "Interactive Live Preview"}
         </button>
         <button
           onClick={() => setBlogPreviewMode("standard")}
           className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
             blogPreviewMode === "standard"
               ? "bg-emerald-600 text-white shadow-sm"
               : "pg-surface-dim pg-text-muted hover:pg-text-heading"
           }`}
         >
           👁️ {locale === "id" ? "Tampilan Bersih" : "Clean Rendered"}
         </button>
         <button
           onClick={() => setBlogPreviewMode("code")}
           className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
             blogPreviewMode === "code"
               ? "bg-emerald-600 text-white shadow-sm"
               : "pg-surface-dim pg-text-muted hover:pg-text-heading"
           }`}
         >
           💻 {locale === "id" ? "Kode Sumber HTML" : "HTML Source Code"}
         </button>
       </div>

       {/* Main Article Preview Container */}
       {blogPreviewMode === "interactive" && (
         <div className="rounded-lg border pg-border overflow-hidden bg-slate-950">
           <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
             <span>⚡ Sandboxed Live Preview (Kalkulator &amp; grafik dinamis aktif berjalan)</span>
             <span>100% Client-Side Safe</span>
           </div>
           <iframe
             srcDoc={buildBlogIframeDoc(blogPack.html || htmlBlog)}
             sandbox="allow-scripts"
             className="w-full h-[650px] border-none bg-[#090d16]"
             title="Interactive Blog Preview"
           />
         </div>
       )}

       {blogPreviewMode === "standard" && (
         <div
           className="pg-surface p-6 rounded-lg border pg-border shadow-inner overflow-y-auto max-h-[65vh] prose dark:prose-invert max-w-none text-sm"
           dangerouslySetInnerHTML={{
             __html: sanitizeHtml(blogPack.html || htmlBlog, BLOG_SANITIZE_OPTIONS),
           }}
         />
       )}

       {blogPreviewMode === "code" && (
         <div className="relative">
           <pre className="pg-surface p-4 rounded-lg border pg-border font-mono text-xs overflow-x-auto max-h-[60vh] text-slate-200">
             {blogPack.html || htmlBlog}
           </pre>
           <button
             onClick={() => copy("rawBlogCode", blogPack.html || htmlBlog)}
             className="absolute top-3 right-3 text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 shadow-sm"
           >
             {copiedId === "rawBlogCode" ? "✓ " + t("copied") : "📋 " + (locale === "id" ? "Salin Kode" : "Copy Code")}
           </button>
         </div>
       )}
     </div>

     {/* ── Metadata & Media Prompts Cards ── */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       {/* SEO Meta Box */}
       {blogPack.metaDescription && (
         <div className="glass-panel rounded-xl p-5 space-y-3">
           <div className="flex items-center justify-between">
             <h3 className="text-sm font-semibold pg-text-heading flex items-center gap-1.5">
               🔍 {locale === "id" ? "Metadata SEO Blog" : "Blog SEO Metadata"}
             </h3>
             <button
               onClick={() => copy("blogMetaDesc", blogPack.metaDescription)}
               className="text-xs px-2.5 py-1 pg-surface-dim pg-text-heading rounded hover:bg-slate-700 transition-colors"
             >
               {copiedId === "blogMetaDesc" ? "✓ " + t("copied") : "📋 " + (locale === "id" ? "Salin" : "Copy")}
             </button>
           </div>
           <div>
             <div className="flex justify-between items-center text-xs pg-text-muted mb-1">
               <span>Meta Description (Google Snippet)</span>
               <span className={`text-[11px] font-mono ${blogPack.metaDescription.length > 160 ? "text-amber-400" : "text-emerald-400"}`}>
                 {blogPack.metaDescription.length}/160 char
               </span>
             </div>
             <p className="text-xs pg-surface p-3 rounded-lg border pg-border pg-text-heading leading-relaxed">
               {blogPack.metaDescription}
             </p>
           </div>
           {blogPack.tags.length > 0 && (
             <div>
               <span className="text-xs pg-text-muted block mb-1.5">{locale === "id" ? "Kategori / Label Tags" : "Category / Label Tags"}</span>
               <div className="flex flex-wrap gap-1.5">
                 {blogPack.tags.map((tag: string, idx: number) => (
                   <span key={idx} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                     #{tag}
                   </span>
                 ))}
               </div>
             </div>
           )}
         </div>
       )}

       {/* 16:9 Thumbnail Prompt */}
       {blogPack.thumbnailPrompt && (
         <div className="glass-panel rounded-xl p-5 space-y-3">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <h3 className="text-sm font-semibold pg-text-heading flex items-center gap-1.5">
                 🖼️ {locale === "id" ? "Prompt Thumbnail Banner (16:9)" : "16:9 Banner Thumbnail Prompt"}
               </h3>
               <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">16:9 Horizontal</span>
             </div>
             <button
               onClick={() => copy("blogThumb", blogPack.thumbnailPrompt)}
               className="text-xs px-2.5 py-1 pg-surface-dim pg-text-heading rounded hover:bg-slate-700 transition-colors"
             >
               {copiedId === "blogThumb" ? "✓ " + t("copied") : "📋 " + (locale === "id" ? "Salin Prompt" : "Copy Prompt")}
             </button>
           </div>
           <p className="text-xs pg-surface p-3 rounded-lg border pg-border font-mono text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
             {blogPack.thumbnailPrompt}
           </p>
         </div>
       )}

       {/* In-Article Supporting Images */}
       {blogPack.supportingImagePrompts.length > 0 && (
         <div className="glass-panel rounded-xl p-5 space-y-3 md:col-span-2">
           <div className="flex items-center justify-between">
             <h3 className="text-sm font-semibold pg-text-heading flex items-center gap-1.5">
               🎨 {locale === "id" ? "Prompt Gambar Pendukung Isi Artikel" : "In-Article Supporting Image Prompts"} ({blogPack.supportingImagePrompts.length})
             </h3>
             <button
               onClick={() => copy("allSupportImg", blogPack.supportingImagePrompts.join("\n\n"))}
               className="text-xs px-2.5 py-1 pg-surface-dim pg-text-heading rounded hover:bg-slate-700 transition-colors"
             >
               {copiedId === "allSupportImg" ? "✓ " + t("copied") : "📋 " + (locale === "id" ? "Salin Semua" : "Copy All")}
             </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {blogPack.supportingImagePrompts.map((prompt: string, idx: number) => (
               <div key={idx} className="pg-surface p-3 rounded-lg border pg-border space-y-2">
                 <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                   <span>Ilustrasi #{idx + 1}</span>
                   <button
                     onClick={() => copy(`supportImg_${idx}`, prompt)}
                     className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                   >
                     {copiedId === `supportImg_${idx}` ? "✓" : "📋 " + (locale === "id" ? "Salin" : "Copy")}
                   </button>
                 </div>
                 <p className="text-xs font-mono text-slate-300 leading-relaxed">{prompt}</p>
               </div>
             ))}
           </div>
         </div>
       )}

       {/* Affiliate Recommendations */}
       {blogPack.affiliateCallouts.length > 0 && (
         <div className="glass-panel rounded-xl p-5 space-y-3 md:col-span-2">
           <div className="flex items-center justify-between">
             <h3 className="text-sm font-semibold pg-text-heading flex items-center gap-1.5">
               🛒 {locale === "id" ? "Rekomendasi Produk Afiliasi Blog" : "Blog Affiliate Recommendations"}
             </h3>
             <button
               onClick={() => copy("blogAffiliate", blogPack.affiliateCallouts.join("\n"))}
               className="text-xs px-2.5 py-1 pg-surface-dim pg-text-heading rounded hover:bg-slate-700 transition-colors"
             >
               {copiedId === "blogAffiliate" ? "✓ " + t("copied") : "📋 " + (locale === "id" ? "Salin" : "Copy")}
             </button>
           </div>
           <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
             {blogPack.affiliateCallouts.map((aff: string, idx: number) => (
               <li key={idx} className="pg-surface p-2.5 rounded-lg border pg-border text-slate-300 flex items-start gap-2">
                 <span className="text-emerald-400 font-bold">•</span>
                 <span>{aff}</span>
               </li>
             ))}
           </ul>
         </div>
       )}
     </div>
   </div>
 )}

 {/* ── Full Video Studio Tab ── */}
 {activeTab === "fullVideo" && (
 <div className="space-y-5">
 {!planFeatures.fullVideoStudio ? (
 <div className="glass-panel rounded-xl p-8 border border-amber-200/60 dark:border-amber-800/60 text-center space-y-4">
 <div className="text-4xl">🔒</div>
 <h3 className="text-lg font-bold pg-text-heading">{tVideo("timelineTitle")}</h3>
 <p className="text-sm pg-text-muted max-w-sm mx-auto">{tVideo("featureNotAvailable")}</p>
 <Link href="/dashboard/billing" className="inline-block px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
 {tVideo("upgradePlan")}
 </Link>
 </div>
 ) : (
 <div className="glass-panel rounded-xl p-6 border pg-border space-y-5">
 <VideoTimelineTab
 timeline={currentTimeline}
 onExportManifest={handleExportManifest}
 onSceneClick={(n) => scrollToScene(n)}
 canUploadToDrive={planFeatures.googleDriveUpload}
 aspectRatio={ar}
 />
 </div>
 )}
 </div>
 )}

  {/* 🚀 1-Tombol Auto Upload & Publish Banner */}
  <div className="glass-panel rounded-2xl p-5 border border-indigo-500/30 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🚀</span>
        <h3 className="text-base font-bold pg-text-heading flex items-center gap-2">
          <span>1-Tombol Auto Upload & Publish</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-xs">
            Multi-Platform
          </span>
        </h3>
      </div>
      <p className="text-xs pg-text-sub max-w-xl">
        Upload video (dari Google Drive channel atau langsung dari PC) dan otomatis publikasikan ke YouTube, Instagram & Facebook dengan judul, deskripsi, dan hashtag hasil Parse Engine.
      </p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => setDrivePackageModalOpen(true)}
        className="px-4 py-2.5 rounded-xl border pg-border bg-[var(--pg-surface)] hover:bg-[var(--pg-surface-dim)] text-xs font-semibold pg-text-heading transition-colors"
      >
        ☁️ Backup Drive Saja
      </button>
      <button
        type="button"
        onClick={() => setAutoPublishModalOpen(true)}
        disabled={!scenes.length}
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
      >
        <span>🚀</span>
        <span>Auto Upload Sekarang</span>
      </button>
    </div>
  </div>

 {/* Save Draft Panel */}
 <div className="glass-panel rounded-xl p-5 space-y-3">
 <h3 className="text-sm font-semibold pg-text-heading">💾 {t("saveDraft")}</h3>
 <input value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder={t("draftTitlePlaceholder")} className={cls} />
 <button onClick={handleSaveDraft} disabled={saving || !scenes.length} className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
 {saving ? t("saving") : t("saveDraftButton")}
 </button>
 {saveMsg && <p className="text-xs pg-text-muted">{saveMsg}</p>}
 </div>

 <DrivePackageUploadModal
 isOpen={drivePackageModalOpen}
 onClose={() => setDrivePackageModalOpen(false)}
 locale={locale}
 channelName={currentChannel?.channelName || "Default Channel"}
 defaultTitle={draftTitle}
 scenes={scenes}
 caption={caption}
 hashtags={hashtags}
 multiPlatformSeo={multiPlatformSeo}
 thumbnailData={thumbnailData}
 isFunnel={!!funnelPackData}
 funnelPackData={funnelPackData}
 activeSegmentId={activeFunnelSegment}
 onSelectSegment={(seg) => switchFunnelSegment(seg)}
 />

 <AutoPublishModal
 isOpen={autoPublishModalOpen}
 onClose={() => setAutoPublishModalOpen(false)}
 channelId={selectedChannelId || currentChannel?.id || ""}
 channelName={currentChannel?.channelName || "Default Channel"}
 content={{
   title: draftTitle,
   projectTitle: draftTitle,
   scenes,
   caption,
   hashtags,
   multiPlatformSeo,
   aspectRatio: ar,
 }}
 isFunnel={!!funnelPackData}
 funnelPackData={funnelPackData}
 activeSegmentId={activeFunnelSegment}
 />
 </>
 )}
 </div>
 );
}
