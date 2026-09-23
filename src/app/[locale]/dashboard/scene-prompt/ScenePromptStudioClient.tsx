"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import sanitizeHtml from "sanitize-html";
import { extractAudioCues, cleanParsedValue, parseVoiceGuidelines, extractTitles, extractChosenTitle, extractThumbnailData, extractCaption, extractHashtags, extractHtmlBlog, extractAffiliateRecommendations } from "@/lib/parsers";
import type { ThumbnailData, AffiliateRecommendation } from "@/lib/parsers";
import { GEMINI_TTS_VOICES, GEMINI_TTS_MODELS, DEFAULT_TTS_VOICE, DEFAULT_TTS_MODEL, TTS_PITCH_PRESETS, DEFAULT_TTS_PITCH, type TtsPitchPresetId } from "@/lib/ttsVoices";
import { buildOverlayVisualCopyText, buildBatchExportText, type SceneForExport } from "@/lib/sceneExportFormat";

interface Scene {
  id: number;
  sceneNumber: string;
  narasi: string;
  teksOverlay?: string;
  visual: string;
  durasi: string;
  bgmCues?: string[];
  sfxCues?: string[];
  isDiegetic?: boolean;
  voiceGuidelines?: {
    sampleContext?: string;
    directorsNote?: string;
    traits?: string;
  };
}
interface Channel { id: string; channelName: string; niche?: string | null; }
interface Props {
  channels: Channel[];
  locale: string;
  planFeatures: { textToSpeechStudio: boolean };
}

interface TtsResult {
  status: "idle" | "generating" | "done" | "error";
  audioBase64?: string;
  mimeType?: string;
  errorMessage?: string;
  durationSec?: number; // durasi audio, dibaca dari onLoadedMetadata
}

function parseScenes(text: string): Scene[] {
  if (!text.trim()) return [];
  const splitter = /(?:^|\r?\n)(?:##\s*|###\s*|\*\*\s*)?(?:Scene|Adegan|Bagian)\s*([a-zA-Z0-9_\-]+)(?:\s*\*\*)?(?=\r?\n|$)/gi;
  const parts = text.split(splitter);
  const scenes: Scene[] = [];
  const delimiters = "(?:Teks\\s*Overlay|Text\\s*Overlay|Overlay|Panduan\\s*Suara|Voice\\s*Guidelines|Visual\\s*Prompt|Visual|Deskripsi\\s*Visual|Prompt|Durasi|Time|Duration)";

  if (parts.length > 1) {
    let count = 1;
    for (let i = 1; i < parts.length; i += 2) {
      const sceneNum = parts[i], content = parts[i + 1] || "";
      const stop = /(?:^|\r?\n)(?:##\s*)?(?:TOTAL\s*DURASI|TOTAL|RINGKASAN|THUMBNAIL|ARTIKEL|HASHTAG|CAPTION|JUDUL\s*TERPILIH|HTML\s*BLOG|REKOMENDASI)/i;
      const m = content.match(stop);
      const c = m ? content.slice(0, m.index) : content;
      const nar = c.match(new RegExp(`(?:Narasi|Dialog|Voice\\s*Over|VO|Audio)\\s*:\\s*([\\s\\S]*?)(?=(?:${delimiters})\\s*:|##|$)`, "i"));
      const overlay = c.match(new RegExp(`(?:Teks\\s*Overlay|Text\\s*Overlay|Overlay)\\s*:\\s*([\\s\\S]*?)(?=(?:${delimiters})\\s*:|##|$)`, "i"));
      const vis = c.match(new RegExp(`(?:Visual\\s*Prompt|Visual|Deskripsi\\s*Visual|Prompt)\\s*:\\s*([\\s\\S]*?)(?=(?:${delimiters})\\s*:|##|$)`, "i"));
      const dur = c.match(new RegExp(`(?:Durasi|Time|Duration)\\s*:\\s*([\\s\\S]*?)(?=(?:${delimiters})\\s*:|##|$)`, "i"));
      const voi = c.match(new RegExp(`(?:Panduan\\s*Suara|Voice\\s*Guidelines)\\s*:\\s*([\\s\\S]*?)(?=(?:${delimiters})\\s*:|##|$)`, "i"));
      const narVal = nar ? cleanParsedValue(nar[1]) : "";
      const overlayVal = overlay ? cleanParsedValue(overlay[1]).replace(/^["']|["']$/g, "").trim() : "";
      const visVal = vis ? cleanParsedValue(vis[1]) : "";
      const durVal = dur ? cleanParsedValue(dur[1]) : "5s";
      if (narVal || visVal || overlayVal) {
        const audio = extractAudioCues(narVal);
        scenes.push({
          id: count,
          sceneNumber: isNaN(Number(sceneNum)) ? sceneNum : `Scene ${sceneNum}`,
          narasi: audio.cleanNarasi || "—",
          teksOverlay: overlayVal || undefined,
          visual: visVal || "—",
          durasi: durVal,
          bgmCues: audio.bgmCues,
          sfxCues: audio.sfxCues,
          isDiegetic: audio.isDiegetic,
          voiceGuidelines: voi ? parseVoiceGuidelines(cleanParsedValue(voi[1])) : undefined,
        });
        count++;
      }
    }
  }
  if (!scenes.length) {
    const audio = extractAudioCues(text);
    scenes.push({
      id: 1,
      sceneNumber: "Scene 1",
      narasi: audio.cleanNarasi.slice(0, 120) || (audio.isDiegetic ? "—" : text.slice(0, 120)),
      visual: text,
      durasi: "15s",
      bgmCues: audio.bgmCues,
      sfxCues: audio.sfxCues,
      isDiegetic: audio.isDiegetic,
    });
  }
  return scenes;
}

export default function ScenePromptStudioClient({ channels, planFeatures }: Props) {
 const t = useTranslations("ScenePromptStudio");
 const [rawText, setRawText] = useState("");
 const [scenes, setScenes] = useState<Scene[]>([]);
 const [caption, setCaption] = useState("");
 const [hashtags, setHashtags] = useState("");
 const [thumbnailData, setThumbnailData] = useState<ThumbnailData | null>(null);
 const [parsedTitles, setParsedTitles] = useState<string[]>([]);
 const [draftTitle, setDraftTitle] = useState("");
 const [selectedChannelId, setSelectedChannelId] = useState(channels[0]?.id || "");
 const [ar, setAr] = useState("9:16");
 const [thumbAr, setThumbAr] = useState<"16:9" | "9:16">("16:9");
 const [sref, setSref] = useState("");
 const [cref, setCref] = useState("");
 const [copiedId, setCopiedId] = useState<string | null>(null);
 const [saving, setSaving] = useState(false);
 const [saveMsg, setSaveMsg] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<"scenes"|"thumbnail"|"platform"|"voiceStudio"|"htmlBlog">("scenes");
 const [markedTitles, setMarkedTitles] = useState<string[]>([]);
 const [htmlBlog, setHtmlBlog] = useState("");
 const [affiliateRecs, setAffiliateRecs] = useState<AffiliateRecommendation[]>([]);

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
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("promptgen_favorite_voices");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [ttsVoiceFilter, setTtsVoiceFilter] = useState<"all" | "favorites" | "male" | "female">("all");
  const [ttsVoiceSearch, setTtsVoiceSearch] = useState("");

  const toggleFavoriteVoice = useCallback((voiceId: string) => {
    setFavoriteVoices(prev => {
      const next = prev.includes(voiceId) ? prev.filter(id => id !== voiceId) : [...prev, voiceId];
      try {
        localStorage.setItem("promptgen_favorite_voices", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

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
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<number>>(new Set());

 // ── TTS Functions (Fitur 1) ──
 const buildTtsInputText = useCallback((scene: Scene) => {
   let text = scene.narasi || "";
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
   URL.revokeObjectURL(url);
   toast.success(t("ttsZipDownloaded"));
 }, [scenes, ttsResults, draftTitle, t]);

  // ── Preview satu teks pendek dengan settings saat ini ──
  const generatePreview = useCallback(async () => {
    const text = ttsPreviewText.trim();
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
   const text = buildOverlayVisualCopyText(scene as SceneForExport);
   if (!text) { toast.error(t("generalError")); return; }
   navigator.clipboard.writeText(text).then(() => {
     setCopiedId(`ov-vis-${scene.id}`);
     setTimeout(() => setCopiedId(null), 2000);
     toast.success(t("copyOverlayVisualSuccess"));
   });
 }, [t]);

 const handleCopyBatchExport = useCallback(() => {
   const selected = scenes.filter(s => selectedSceneIds.has(s.id));
   if (!selected.length) { toast.error(t("selectAtLeastOneScene")); return; }
   const text = buildBatchExportText(selected as SceneForExport[]);
   navigator.clipboard.writeText(text).then(() => {
     setCopiedId("batch-export");
     setTimeout(() => setCopiedId(null), 2000);
     toast.success(t("batchExportCopied"));
   });
 }, [scenes, selectedSceneIds, t]);

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

  // Server-Side Sync & LocalStorage Persistence
  useEffect(() => {
    let ignore = false;

    // 1. Local Storage load (deferred to avoid cascading render during effect mount)
    const saved = localStorage.getItem("scenePromptState");
    const savedFavorites = localStorage.getItem("promptgen_favorite_voices");
    if (savedFavorites) {
      try {
        const favs = JSON.parse(savedFavorites);
        if (Array.isArray(favs) && favs.length > 0) setFavoriteVoices(favs);
      } catch {}
    }
    if (saved) {
      try {
        const p = JSON.parse(saved);
        queueMicrotask(() => {
          if (!ignore) {
            if (p.rawText) setRawText(p.rawText);
            if (p.selectedChannelId) setSelectedChannelId(p.selectedChannelId);
            if (p.ar) setAr(p.ar);
            if (p.sref) setSref(p.sref);
            if (p.cref) setCref(p.cref);
            if (p.draftTitle) setDraftTitle(p.draftTitle);
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
        });
      } catch {}
    }

    // 2. Server load (overrides local)
    fetch("/api/user/preferences")
      .then(res => res.json())
      .then(data => {
        if (!ignore && data.success && data.generatorPreferences?.scenePromptState) {
          const p = data.generatorPreferences.scenePromptState;
          if (p.rawText) setRawText(p.rawText);
          if (p.selectedChannelId) setSelectedChannelId(p.selectedChannelId);
          if (p.ar) setAr(p.ar);
          if (p.sref) setSref(p.sref);
          if (p.cref) setCref(p.cref);
          if (p.draftTitle) setDraftTitle(p.draftTitle);
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
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
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
    localStorage.setItem("scenePromptState", JSON.stringify(stateObj));

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
  ]);

 // sref/cref are manual inputs — no channel default sync needed

 const copy = useCallback((id: string, text: string) => {
 navigator.clipboard.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); });
 }, []);

 const handleParse = async () => {
 if (!rawText.trim()) return;
 const parsed = parseScenes(rawText);
 setScenes(parsed);
 setSelectedSceneIds(new Set(parsed.map(s => s.id))); // auto-select semua scene
 setTtsResults({}); // reset TTS results
 setCaption(extractCaption(rawText));
 setHashtags(extractHashtags(rawText));
 setThumbnailData(extractThumbnailData(rawText));
 const titles = extractTitles(rawText);
 setParsedTitles(titles);
 const chosen = extractChosenTitle(rawText) || titles[0] || "";
 setDraftTitle(chosen || t("defaultDraftTitle"));
 setAffiliateRecs(extractAffiliateRecommendations(rawText));
 try {
 await fetch("/api/parsed-outputs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawInput: rawText, parsedResult: parsed }) });
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
 .map(s => s.narasi.trim());

 if (!validNarrations.length) {
 toast.error(t("noNarrationToCopy"));
 return;
 }

 const fullNarrationText = validNarrations.join("\n\n");
 copy("all-narration", fullNarrationText);
 toast.success(t("allNarasiCopied"));
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
  const htmlBlogContent = extractHtmlBlog(rawText);
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
  }),
  });
  const data = await res.json();
  setSaveMsg(res.ok ? t("draftSaved") : (data.error || t("draftError")));
  } catch { setSaveMsg(t("draftError")); } finally { setSaving(false); setTimeout(() => setSaveMsg(null), 4000); }
  };

 const cls = "w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white";
 const btn = (active?: boolean) => `px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${active ? "bg-blue-600 text-white border-blue-600" : "pg-surface pg-border pg-text-sub hover:pg-surface-dim"}`;

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
 <select value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)} className={cls}>
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
 <textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder={t("pastePlaceholder")} rows={8} className={`${cls} resize-none font-mono text-xs`} />
 <div className="flex items-center gap-3">
 <button onClick={handleParse} disabled={!rawText.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
 ⚡ {t("parseButton")}
 </button>
 {scenes.length > 0 && <span className="text-xs pg-text-muted">{scenes.length} {t("scenesFound")}</span>}
 </div>
 </div>

 {scenes.length > 0 && (
 <>
 <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 custom-scrollbar">
 {(["scenes","thumbnail","platform","voiceStudio","htmlBlog"] as const).map(tab => {
 if (tab === "htmlBlog" && !htmlBlog) return null;
 return (
 <button key={tab} onClick={() => setActiveTab(tab)} className={btn(activeTab === tab)}>
 {tab === "scenes" ? `🎬 ${t("sceneViewerTab")}` : tab === "thumbnail" ? `🖼️ ${t("thumbnailTab")}` : tab === "htmlBlog" ? `📝 HTML Blog` : tab === "voiceStudio" ? `🎙️ ${t("voiceStudioTab")}` : `📱 ${t("platformTab")}`}
 </button>
 );
 })}
 </div>

 {affiliateRecs.length > 0 && (
 <div className="glass-panel rounded-xl p-5 border border-emerald-200 dark:border-emerald-800 shadow-sm">
 <h2 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2">
 🛒 Rekomendasi Produk Affiliate
 <span className="text-[10px] font-normal bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
 {affiliateRecs.length} produk
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
  const isActiveDraft = title === draftTitle;
  const isMarked = markedTitles.includes(title);
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
       <button onClick={() => copy(`t-${i}`, title)} className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">{copiedId === `t-${i}` ? "✓" : "Copy"}</button>
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
    {/* Scene Viewer Actions Toolbar */}
    <div className="flex flex-wrap items-center justify-between gap-3 glass-panel rounded-xl px-4 py-3 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
      <div className="flex items-center gap-2">
        {/* Select All Checkbox */}
        <input
          type="checkbox"
          checked={selectedSceneIds.size === scenes.length && scenes.length > 0}
          onChange={toggleAllScenes}
          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-blue-600"
          title={t("selectAllScenes")}
        />
        <span className="text-sm font-bold pg-text-heading flex items-center gap-1.5">
          <span>🎬</span> {t("sceneViewerTab")}
        </span>
        <span className="text-xs pg-surface-dim px-2.5 py-0.5 rounded-full pg-text-muted font-medium">
          {selectedSceneIds.size}/{scenes.length} {t("scenesFound")}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleCopyBatchExport}
          disabled={selectedSceneIds.size === 0}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-40"
          title={t("copyBatchExport")}
        >
          <span>📦</span>
          {copiedId === "batch-export" ? `✓ ${t("batchExportCopied")}` : t("copyBatchExport")}
        </button>
        <button
          type="button"
          onClick={copyAllNarration}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm active:scale-95"
          title={t("copyAllNarasi")}
        >
          <span>🎤</span>
          {copiedId === "all-narration" ? `✓ ${t("allNarasiCopied")}` : t("copyAllNarasi")}
        </button>
      </div>
    </div>

  {scenes.map(scene => (
  <div key={scene.id} className="glass-panel rounded-xl p-5 space-y-3">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={selectedSceneIds.has(scene.id)}
        onChange={() => toggleScene(scene.id)}
        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 accent-blue-600"
      />
      <h3 className="font-bold pg-text-heading">{scene.sceneNumber}</h3>
      {scene.isDiegetic && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center gap-1">
          <span>🔇</span> Diegetic (Tanpa VO)
        </span>
      )}
    </div>
    <span className="text-xs pg-surface-dim px-2 py-1 rounded pg-text-muted font-medium">{scene.durasi}</span>
  </div>

  {/* Narasi (jika ada spoken voiceover) */}
  {scene.narasi !== "—" && (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold pg-text-muted uppercase">🎤 {t("narasi")}</span>
        <button onClick={() => copy(`nar-${scene.id}`, scene.narasi)} className="text-xs text-blue-500 hover:underline">{copiedId === `nar-${scene.id}` ? "✓" : t("copy")}</button>
      </div>
      <p className="text-sm pg-text-sub leading-relaxed">{scene.narasi}</p>
    </div>
  )}

  {/* Teks Overlay Layar */}
  {scene.teksOverlay && (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <span>💬</span> Teks Overlay Layar
        </span>
        <button onClick={() => copy(`ov-${scene.id}`, scene.teksOverlay!)} className="text-xs text-amber-600 dark:text-amber-400 hover:underline">{copiedId === `ov-${scene.id}` ? "✓" : t("copy")}</button>
      </div>
      <p className="text-sm font-medium pg-text-heading italic">&ldquo;{scene.teksOverlay}&rdquo;</p>
    </div>
  )}

  {/* Audio Cues (SFX & BGM) — Selalu tampil jika ada cue */}
  {(scene.bgmCues?.length || scene.sfxCues?.length) ? (
    <div className="flex flex-wrap gap-1.5 pt-0.5">
      {scene.bgmCues?.map((c, i) => (
        <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full flex items-center gap-1">
          <span>🎵</span> {c}
        </span>
      ))}
      {scene.sfxCues?.map((c, i) => (
        <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full flex items-center gap-1">
          <span>🔊</span> {c}
        </span>
      ))}
    </div>
  ) : null}

  {/* Panduan Suara / Voice Guidelines */}
  {scene.voiceGuidelines && (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
      {scene.voiceGuidelines.sampleContext && <p>📍 {scene.voiceGuidelines.sampleContext}</p>}
      {scene.voiceGuidelines.directorsNote && <p>🎬 {scene.voiceGuidelines.directorsNote}</p>}
      {scene.voiceGuidelines.traits && <p>🎙️ {scene.voiceGuidelines.traits}</p>}
    </div>
  )}

  {/* Visual Prompt */}
  {scene.visual !== "—" && (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold pg-text-muted uppercase">🎨 {t("visualPrompt")}</span>
        <button onClick={() => copy(`vis-${scene.id}`, buildVisualPrompt(scene.visual))} className="text-xs text-blue-500 hover:underline">{copiedId === `vis-${scene.id}` ? "✓" : t("copy")}</button>
      </div>
      <p className="text-xs font-mono pg-text-sub pg-surface-dim rounded p-2 leading-relaxed">{buildVisualPrompt(scene.visual)}</p>
    </div>
  )}

  {/* Copy Overlay + Visual (Fitur 2) */}
  {(scene.teksOverlay || (scene.visual && scene.visual !== "—")) && (
    <button
      type="button"
      onClick={() => handleCopyOverlayVisual(scene)}
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 pg-text-sub hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-fit"
    >
      <span>📋</span>
      {copiedId === `ov-vis-${scene.id}` ? `✓ ${t("copyOverlayVisualSuccess")}` : t("copyOverlayVisual")}
    </button>
  )}
  </div>
  ))}
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
                      <button
                        type="button"
                        onClick={() => copy("o1p", buildThumbnailPrompt(thumbnailData.opsi1Prompt))}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {copiedId === "o1p" ? "✓" : t("copyPromptWithParams")}
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
                  onClick={() => copy("o1p-full", buildThumbnailPrompt(thumbnailData.opsi1Prompt))}
                  className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>📋</span>
                  {copiedId === "o1p-full" ? t("promptWithParamsCopied") : t("copyPromptWithParams")}
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
                      <button
                        type="button"
                        onClick={() => copy("o2p", buildThumbnailPrompt(thumbnailData.opsi2Prompt))}
                        className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        {copiedId === "o2p" ? "✓" : t("copyPromptWithParams")}
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
                  onClick={() => copy("o2p-full", buildThumbnailPrompt(thumbnailData.opsi2Prompt))}
                  className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>📋</span>
                  {copiedId === "o2p-full" ? t("promptWithParamsCopied") : t("copyPromptWithParams")}
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

 {/* Platform Content */}
 {activeTab === "platform" && (
 <div className="space-y-6">
 <div className="glass-panel rounded-xl p-6 space-y-4">
 <h2 className="font-bold pg-text-heading">📱 {t("platformContent")}</h2>
 {caption && (
 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-xs font-semibold pg-text-muted">Caption</span>
 <button onClick={() => copy("cap", caption)} className="text-xs text-blue-500 hover:underline">{copiedId === "cap" ? "✓ Copied" : "Copy"}</button>
 </div>
 <p className="text-sm pg-text-sub pg-surface-dim rounded p-3 whitespace-pre-wrap">{caption}</p>
 </div>
 )}
 {hashtags && (
 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-xs font-semibold pg-text-muted">Hashtags</span>
 <button onClick={() => copy("htg", hashtags)} className="text-xs text-blue-500 hover:underline">{copiedId === "htg" ? "✓ Copied" : "Copy"}</button>
 </div>
 <p className="text-sm pg-text-sub pg-surface-dim rounded p-3">{hashtags}</p>
 </div>
 )}
 </div>

 </div>
 )}

 {/* ── Voice Studio Tab ── */}
 {activeTab === "voiceStudio" && (
 <div className="space-y-5">
   {!planFeatures.textToSpeechStudio ? (
     <div className="glass-panel rounded-xl p-8 border border-amber-200/60 dark:border-amber-800/60 text-center space-y-4">
       <div className="text-4xl">🔒</div>
       <h3 className="text-lg font-bold pg-text-heading">{t("voiceStudioTitle")}</h3>
       <p className="text-sm pg-text-muted max-w-sm mx-auto">{t("voiceStudioLocked")}</p>
       <a href="/dashboard/billing" className="inline-block px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
         {t("voiceStudioUpgrade")}
       </a>
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
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-500 shadow-xs"
                    : "bg-white dark:bg-slate-700 pg-border text-slate-400 hover:text-amber-500 hover:border-amber-300"
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
                        {isFav && <span className="text-amber-500">⭐</span>}
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
            <p className="text-[11px] text-red-500 dark:text-red-400">⚠️ {ttsPreviewResult.errorMessage}</p>
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
                     <span className="text-[10px] font-semibold text-red-500" title={result.errorMessage}>❌</span>
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

 {activeTab === "htmlBlog" && htmlBlog && (

 <div className="glass-panel rounded-xl p-6 space-y-4">
 <div className="flex items-center justify-between mb-4">
 <h2 className="font-bold pg-text-heading">📝 HTML Blog Article</h2>
 <button onClick={() => copy("blog", htmlBlog)} className="text-xs px-4 py-1.5 pg-surface-dim pg-text-heading rounded transition-colors shadow-sm">
 {copiedId === "blog" ? "✓ Copied!" : "Copy HTML"}
 </button>
 </div>
  {/* P0-1 Security Fix: sanitizeHtml prevents XSS from user-pasted AI output */}
 <div className="pg-surface p-6 rounded-lg border pg-border shadow-inner overflow-y-auto max-h-[60vh] prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlBlog, { allowedTags: ['h1','h2','h3','h4','h5','h6','p','ul','ol','li','strong','em','b','i','a','br','hr','blockquote','pre','code'], allowedAttributes: { a: ['href', 'target', 'rel'] } }) }} />
 </div>
 )}

 {/* Save Draft Panel */}
 <div className="glass-panel rounded-xl p-5 space-y-3">
 <h3 className="text-sm font-semibold pg-text-heading">💾 {t("saveDraft")}</h3>
 <input value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder={t("draftTitlePlaceholder")} className={cls} />
 <button onClick={handleSaveDraft} disabled={saving || !scenes.length} className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
 {saving ? t("saving") : t("saveDraftButton")}
 </button>
 {saveMsg && <p className="text-xs pg-text-muted">{saveMsg}</p>}
 </div>
 </>
 )}
 </div>
 );
}
