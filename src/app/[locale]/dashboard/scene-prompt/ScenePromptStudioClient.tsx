"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { extractAudioCues, extractVisualAudioHint, cleanParsedValue, parseVoiceGuidelines, extractTitles, extractChosenTitle, extractThumbnailData, extractCaption, extractHashtags, extractHtmlBlog } from "@/lib/parsers";
import type { ThumbnailData } from "@/lib/parsers";

interface Scene { id: number; sceneNumber: string; narasi: string; visual: string; durasi: string; bgmCues?: string[]; sfxCues?: string[]; voiceGuidelines?: { sampleContext?: string; directorsNote?: string; traits?: string }; }
interface Channel { id: string; channelName: string; niche?: string | null; }
interface Props { channels: Channel[]; locale: string; }

function parseScenes(text: string): Scene[] {
  if (!text.trim()) return [];
  const splitter = /(?:^|\r?\n)(?:##\s*|###\s*|\*\*\s*)?(?:Scene|Adegan|Bagian)\s*([a-zA-Z0-9_\-]+)(?:\s*\*\*)?(?=\r?\n|$)/gi;
  const parts = text.split(splitter);
  const scenes: Scene[] = [];
  if (parts.length > 1) {
    let count = 1;
    for (let i = 1; i < parts.length; i += 2) {
      const sceneNum = parts[i], content = parts[i + 1] || "";
      const stop = /(?:^|\r?\n)(?:##\s*)?(?:RINGKASAN|THUMBNAIL|ARTIKEL|HASHTAG|CAPTION|JUDUL\s*TERPILIH)/i;
      const m = content.match(stop);
      const c = m ? content.slice(0, m.index) : content;
      const nar = c.match(/(?:Narasi|Dialog|Voice\s*Over|VO|Audio)\s*:\s*([\s\S]*?)(?=(?:Panduan\s*Suara|Visual\s*Prompt|Visual|Durasi)\s*:|##|$)/i);
      const vis = c.match(/(?:Visual\s*Prompt|Visual|Deskripsi\s*Visual|Prompt)\s*:\s*([\s\S]*?)(?=(?:Panduan\s*Suara|Narasi|Durasi)\s*:|##|$)/i);
      const dur = c.match(/(?:Durasi|Time|Duration)\s*:\s*([\s\S]*?)(?=(?:Narasi|Visual|Panduan)\s*:|##|$)/i);
      const voi = c.match(/(?:Panduan\s*Suara|Voice\s*Guidelines)\s*:\s*([\s\S]*?)(?=(?:Narasi|Visual|Durasi)\s*:|##|$)/i);
      const narVal = nar ? cleanParsedValue(nar[1]) : "";
      const visVal = vis ? cleanParsedValue(vis[1]) : "";
      const durVal = dur ? cleanParsedValue(dur[1]) : "5s";
      if (narVal || visVal) {
        const audio = extractAudioCues(narVal);
        scenes.push({ id: count, sceneNumber: isNaN(Number(sceneNum)) ? sceneNum : `Scene ${sceneNum}`, narasi: audio.cleanNarasi || "—", visual: visVal || "—", durasi: durVal, bgmCues: audio.bgmCues, sfxCues: audio.sfxCues, voiceGuidelines: voi ? parseVoiceGuidelines(cleanParsedValue(voi[1])) : undefined });
        count++;
      }
    }
  }
  if (!scenes.length) {
    const audio = extractAudioCues(text);
    scenes.push({ id: 1, sceneNumber: "Scene 1", narasi: audio.cleanNarasi.slice(0, 120) || text.slice(0, 120), visual: text, durasi: "15s", bgmCues: audio.bgmCues, sfxCues: audio.sfxCues });
  }
  return scenes;
}

export default function ScenePromptStudioClient({ channels, locale }: Props) {
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
  const [sref, setSref] = useState("");
  const [cref, setCref] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"scenes"|"thumbnail"|"platform">("scenes");

  // Server-Side Sync & LocalStorage Persistence
  useEffect(() => {
    // 1. Local Storage load
    const saved = localStorage.getItem("scenePromptState");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.rawText) setRawText(p.rawText);
        if (p.selectedChannelId) setSelectedChannelId(p.selectedChannelId);
        if (p.ar) setAr(p.ar);
        if (p.sref) setSref(p.sref);
        if (p.cref) setCref(p.cref);
        if (p.draftTitle) setDraftTitle(p.draftTitle);
      } catch (e) {}
    }

    // 2. Server load (overrides local)
    fetch("/api/user/preferences")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.generatorPreferences?.scenePromptState) {
          const p = data.generatorPreferences.scenePromptState;
          if (p.rawText) setRawText(p.rawText);
          if (p.selectedChannelId) setSelectedChannelId(p.selectedChannelId);
          if (p.ar) setAr(p.ar);
          if (p.sref) setSref(p.sref);
          if (p.cref) setCref(p.cref);
          if (p.draftTitle) setDraftTitle(p.draftTitle);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const stateObj = { rawText, selectedChannelId, ar, sref, cref, draftTitle };
    localStorage.setItem("scenePromptState", JSON.stringify(stateObj));

    const timeoutId = setTimeout(() => {
      if (rawText || draftTitle || sref || cref) {
        fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenePromptState: stateObj }),
        }).catch(() => {});
      }
    }, 3000); // 3 seconds debounce

    return () => clearTimeout(timeoutId);
  }, [rawText, selectedChannelId, ar, sref, cref, draftTitle]);

  // sref/cref are manual inputs — no channel default sync needed

  const copy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); });
  }, []);

  const handleParse = async () => {
    if (!rawText.trim()) return;
    const parsed = parseScenes(rawText);
    setScenes(parsed);
    setCaption(extractCaption(rawText));
    setHashtags(extractHashtags(rawText));
    setThumbnailData(extractThumbnailData(rawText));
    const titles = extractTitles(rawText);
    setParsedTitles(titles);
    const chosen = extractChosenTitle(rawText) || titles[0] || "";
    setDraftTitle(chosen || t("defaultDraftTitle"));
    try {
      await fetch("/api/parsed-outputs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawInput: rawText, parsedResult: parsed }) });
    } catch {}
  };

  const buildVisualPrompt = (visual: string) => {
    let p = visual.replace(/\s*--ar\s+\S+/gi, "").trim();
    if (p && p !== "—") { p += ` --ar ${ar}`; if (sref) { p += ` --sref ${sref}`; } if (cref) { p += ` --cref ${cref}`; } }
    return p;
  };

  const handleSaveDraft = async () => {
    if (!scenes.length) return;
    setSaving(true); setSaveMsg(null);
    try {
      // Fix 2.4: Extract html_blog from rawText and include in parsedData
      const htmlBlogContent = extractHtmlBlog(rawText);
      const parsedData: Record<string, unknown> = { scenes, caption, hashtags };
      if (thumbnailData) parsedData.thumbnailData = thumbnailData;
      if (htmlBlogContent) parsedData.html_blog = htmlBlogContent;

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannelId || undefined,
          type: "VIDEO",
          title: draftTitle,
          rawJson: JSON.stringify({ scenes, caption, hashtags, thumbnailData }),
          parsedData,
        }),
      });
      const data = await res.json();
      setSaveMsg(res.ok ? t("draftSaved") : (data.error || t("draftError")));
    } catch { setSaveMsg(t("draftError")); } finally { setSaving(false); setTimeout(() => setSaveMsg(null), 4000); }
  };

  const cls = "w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none dark:text-white";
  const btn = (active?: boolean) => `px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("subtitle")}</p>
      </div>

      {/* Input Panel */}
      <div className="glass-panel rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t("channelLabel")}</label>
            <select value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)} className={cls}>
              {channels.map(c => <option key={c.id} value={c.id}>{c.channelName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Aspect Ratio</label>
            <select value={ar} onChange={e => setAr(e.target.value)} className={cls}>
              {["9:16","16:9","1:1","4:5"].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Sref URL</label>
            <input value={sref} onChange={e => setSref(e.target.value)} placeholder="https://..." className={cls} />
          </div>
        </div>
        <textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder={t("pastePlaceholder")} rows={8} className={`${cls} resize-none font-mono text-xs`} />
        <div className="flex items-center gap-3">
          <button onClick={handleParse} disabled={!rawText.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            ⚡ {t("parseButton")}
          </button>
          {scenes.length > 0 && <span className="text-xs text-zinc-500">{scenes.length} {t("scenesFound")}</span>}
        </div>
      </div>

      {scenes.length > 0 && (
        <>
          {/* Tabs */}
          <div className="flex gap-2">
            {(["scenes","thumbnail","platform"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={btn(activeTab === tab)}>
                {tab === "scenes" ? `🎬 ${t("sceneViewerTab")}` : tab === "thumbnail" ? `🖼️ ${t("thumbnailTab")}` : `📱 ${t("platformTab")}`}
              </button>
            ))}
          </div>

          {/* Scene Viewer */}
          {activeTab === "scenes" && (
            <div className="space-y-4">
              {scenes.map(scene => (
                <div key={scene.id} className="glass-panel rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900 dark:text-white">{scene.sceneNumber}</h3>
                    <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-500">{scene.durasi}</span>
                  </div>
                  {scene.narasi !== "—" && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">🎤 {t("narasi")}</span>
                        <button onClick={() => copy(`nar-${scene.id}`, scene.narasi)} className="text-xs text-blue-500 hover:underline">{copiedId === `nar-${scene.id}` ? "✓" : t("copy")}</button>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{scene.narasi}</p>
                      {(scene.bgmCues?.length || scene.sfxCues?.length) ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {scene.bgmCues?.map((c,i) => <span key={i} className="text-[10px] px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">🎵 {c}</span>)}
                          {scene.sfxCues?.map((c,i) => <span key={i} className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">🔊 {c}</span>)}
                        </div>
                      ) : null}
                    </div>
                  )}
                  {scene.voiceGuidelines && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                      {scene.voiceGuidelines.sampleContext && <p>📍 {scene.voiceGuidelines.sampleContext}</p>}
                      {scene.voiceGuidelines.directorsNote && <p>🎬 {scene.voiceGuidelines.directorsNote}</p>}
                      {scene.voiceGuidelines.traits && <p>🎙️ {scene.voiceGuidelines.traits}</p>}
                    </div>
                  )}
                  {scene.visual !== "—" && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">🎨 {t("visualPrompt")}</span>
                        <button onClick={() => copy(`vis-${scene.id}`, buildVisualPrompt(scene.visual))} className="text-xs text-blue-500 hover:underline">{copiedId === `vis-${scene.id}` ? "✓" : t("copy")}</button>
                      </div>
                      <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 rounded p-2 leading-relaxed">{buildVisualPrompt(scene.visual)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Thumbnail Studio */}
          {activeTab === "thumbnail" && thumbnailData && (
            <div className="glass-panel rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-zinc-900 dark:text-white">🖼️ Thumbnail Studio</h2>
              {[
                { label: "SEO Overlay Text", val: thumbnailData.seoText, id: "seo" },
                { label: "Opsi 1 — Prompt", val: thumbnailData.opsi1Prompt, id: "o1p" },
                { label: "Opsi 1 — Teks Overlay", val: thumbnailData.opsi1Overlay, id: "o1o" },
                { label: "Opsi 2 — Prompt", val: thumbnailData.opsi2Prompt, id: "o2p" },
                { label: "Opsi 2 — Teks Overlay", val: thumbnailData.opsi2Overlay, id: "o2o" },
                { label: "Rekomendasi Warna & Elemen", val: thumbnailData.recommendations, id: "rec" },
              ].map(({ label, val, id }) => val ? (
                <div key={id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-500">{label}</span>
                    <button onClick={() => copy(id, val)} className="text-xs text-blue-500 hover:underline">{copiedId === id ? "✓ Copied" : "Copy"}</button>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded p-2">{val}</p>
                </div>
              ) : null)}
              {!thumbnailData.seoText && !thumbnailData.opsi1Prompt && (
                <p className="text-sm text-zinc-400">{t("noThumbnailData")}</p>
              )}
            </div>
          )}
          {activeTab === "thumbnail" && !thumbnailData && (
            <div className="glass-panel rounded-xl p-6 text-center text-zinc-400 text-sm">{t("noThumbnailData")}</div>
          )}

          {/* Platform Content */}
          {activeTab === "platform" && (
            <div className="glass-panel rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-zinc-900 dark:text-white">📱 {t("platformContent")}</h2>
              {caption && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-500">Caption</span>
                    <button onClick={() => copy("cap", caption)} className="text-xs text-blue-500 hover:underline">{copiedId === "cap" ? "✓ Copied" : "Copy"}</button>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded p-3 whitespace-pre-wrap">{caption}</p>
                </div>
              )}
              {hashtags && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-500">Hashtags</span>
                    <button onClick={() => copy("htg", hashtags)} className="text-xs text-blue-500 hover:underline">{copiedId === "htg" ? "✓ Copied" : "Copy"}</button>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded p-3">{hashtags}</p>
                </div>
              )}
              {parsedTitles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 mb-2">{t("titlesFound")}</p>
                  <div className="space-y-1">
                    {parsedTitles.map((title, i) => (
                      <div key={i} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 rounded px-3 py-2">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
                        <button onClick={() => copy(`t-${i}`, title)} className="text-xs text-blue-500 hover:underline ml-2">{copiedId === `t-${i}` ? "✓" : "Copy"}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Save Draft Panel */}
          <div className="glass-panel rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">💾 {t("saveDraft")}</h3>
            <input value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder={t("draftTitlePlaceholder")} className={cls} />
            <button onClick={handleSaveDraft} disabled={saving || !scenes.length} className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {saving ? t("saving") : t("saveDraftButton")}
            </button>
            {saveMsg && <p className="text-xs text-zinc-500">{saveMsg}</p>}
          </div>
        </>
      )}
    </div>
  );
}
