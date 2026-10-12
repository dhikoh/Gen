"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  ART_STYLE_KEYS,
  assignFilesToScenes,
  buildPanelPrompt,
  buildStyleBiblePrompt,
  parseCameraSetting,
  type ArtStyleKey,
  type StoryboardScene,
  type StyleBible,
} from "@/lib/storyboardPromptBuilder";

export interface StoryboardPanelView {
  id: string;
  sceneNumber: number;
  width: number;
  height: number;
  updatedAt: string;
}

interface StoryboardSectionProps {
  draftId: string;
  locale: string;
  locked: boolean;
  topic: string;
  aspectRatio: string;
  cameraMovementEnabled: boolean;
  scenes: StoryboardScene[];
  initialStyleBible: StyleBible;
  panels: StoryboardPanelView[];
}

type BulkItem = { file: File; sceneNumber: number | null };

const ERROR_KEYS: Record<string, string> = {
  UNAUTHORIZED: "error_UNAUTHORIZED",
  RATE_LIMITED: "error_RATE_LIMITED",
  SUBSCRIPTION_INACTIVE: "error_SUBSCRIPTION_INACTIVE",
  FEATURE_LOCKED: "error_FEATURE_LOCKED",
  DRAFT_NOT_FOUND: "error_DRAFT_NOT_FOUND",
  INVALID_INPUT: "error_INVALID_INPUT",
  FILE_TOO_LARGE: "error_FILE_TOO_LARGE",
  INVALID_IMAGE: "error_INVALID_IMAGE",
  TOO_MANY_PANELS: "error_TOO_MANY_PANELS",
  QUOTA_EXCEEDED: "error_QUOTA_EXCEEDED",
  STORAGE_ERROR: "error_STORAGE_ERROR",
  SERVER_ERROR: "error_SERVER_ERROR",
};

function readErrorCode(data: unknown): string {
  if (typeof data === "object" && data !== null && "errorCode" in data) {
    const code = (data as { errorCode?: unknown }).errorCode;
    if (typeof code === "string") return code;
  }
  return "SERVER_ERROR";
}

const inputCls =
  "w-full px-3.5 py-2 text-sm pg-surface-dim border pg-border rounded-lg outline-none pg-text-heading focus:border-[var(--pg-brand)] focus:ring-2 focus:ring-[var(--pg-brand-light)] transition-all";
const primaryBtn =
  "px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border bg-[var(--pg-brand)] text-white border-[var(--pg-brand)] shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all";
const secondaryBtn =
  "px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border pg-surface pg-border pg-text-sub hover:pg-text-heading disabled:opacity-50 disabled:cursor-not-allowed transition-all";

export default function StoryboardSection({
  draftId,
  locale,
  locked,
  topic,
  aspectRatio,
  cameraMovementEnabled,
  scenes,
  initialStyleBible,
  panels,
}: StoryboardSectionProps) {
  const t = useTranslations("Storyboard");
  const router = useRouter();

  const [bible, setBible] = useState<StyleBible>(initialStyleBible);
  const [savingBible, setSavingBible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [bulk, setBulk] = useState<BulkItem[] | null>(null);

  const singleInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const pendingSceneRef = useRef<number>(0);

  const panelByScene = new Map(panels.map((p) => [p.sceneNumber, p]));
  const total = scenes.length;

  if (locked) {
    return (
      <div className="glass-panel shadow-lg rounded-xl p-6 space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">🎞️ {t("title")}</h2>
        <p className="text-sm font-semibold pg-text-heading">{t("lockedTitle")}</p>
        <p className="text-sm pg-text-muted">{t("lockedBody")}</p>
        <Link href={`/${locale}/dashboard/pricing`} className={`${primaryBtn} inline-block`}>
          {t("upgradeCta")}
        </Link>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="glass-panel shadow-lg rounded-xl p-6 space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">🎞️ {t("title")}</h2>
        <p className="text-sm pg-text-muted">{t("noScenes")}</p>
      </div>
    );
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch {
      toast.error(t("error_SERVER_ERROR"));
    }
  }

  function errorMessage(code: string): string {
    return t(ERROR_KEYS[code] ?? "error_SERVER_ERROR");
  }

  async function saveBible() {
    setSavingBible(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/storyboard`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleBible: bible }),
      });
      if (res.ok) {
        toast.success(t("styleBibleSaved"));
      } else {
        const data: unknown = await res.json().catch(() => null);
        toast.error(errorMessage(readErrorCode(data)));
      }
    } catch {
      toast.error(t("error_SERVER_ERROR"));
    } finally {
      setSavingBible(false);
    }
  }

  async function uploadOne(file: File, sceneNumber: number): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("sceneNumber", String(sceneNumber));
    try {
      const res = await fetch(`/api/drafts/${draftId}/storyboard/panels`, { method: "POST", body: fd });
      if (res.ok) return null;
      const data: unknown = await res.json().catch(() => null);
      return readErrorCode(data);
    } catch {
      return "SERVER_ERROR";
    }
  }

  async function handleSingleChosen(file: File | undefined) {
    const sceneNumber = pendingSceneRef.current;
    if (!file || sceneNumber < 1) return;
    setBusy(true);
    const errCode = await uploadOne(file, sceneNumber);
    setBusy(false);
    if (errCode) {
      toast.error(errorMessage(errCode));
    } else {
      toast.success(t("panelUploaded"));
      router.refresh();
    }
  }

  async function handleDelete(panelId: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/storyboard/panels/${panelId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("panelDeleted"));
        router.refresh();
      } else {
        const data: unknown = await res.json().catch(() => null);
        toast.error(errorMessage(readErrorCode(data)));
      }
    } catch {
      toast.error(t("error_SERVER_ERROR"));
    } finally {
      setBusy(false);
    }
  }

  function handleBulkChosen(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const assigned = assignFilesToScenes(
      files.map((f) => f.name),
      total
    );
    // Pasangkan kembali objek File berdasarkan urutan nama yang sudah diurutkan
    const remaining = [...files];
    const items: BulkItem[] = assigned.map((a) => {
      const idx = remaining.findIndex((f) => f.name === a.name);
      const file = remaining.splice(idx, 1)[0];
      return { file, sceneNumber: a.sceneNumber };
    });
    setBulk(items);
  }

  async function confirmBulk() {
    if (!bulk) return;
    const todo = bulk.filter((b): b is { file: File; sceneNumber: number } => b.sceneNumber !== null);
    setBusy(true);
    let ok = 0;
    let failed = 0;
    for (let i = 0; i < todo.length; i++) {
      setProgress({ current: i + 1, total: todo.length });
      const errCode = await uploadOne(todo[i].file, todo[i].sceneNumber);
      if (errCode) {
        failed++;
        toast.error(`${todo[i].file.name}: ${errorMessage(errCode)}`);
      } else {
        ok++;
      }
    }
    setProgress(null);
    setBulk(null);
    setBusy(false);
    toast.success(t("progressDone", { ok, failed }));
    router.refresh();
  }

  const topicText = topic;

  return (
    <div className="glass-panel shadow-lg rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider pg-text-muted">🎞️ {t("title")}</h2>
        <p className="text-sm pg-text-muted mt-1">{t("subtitle")}</p>
      </div>

      {/* 1. Style Bible */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold pg-text-heading">{t("step1Title")}</h3>
        <p className="text-xs pg-text-muted">{t("step1Hint")}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium pg-text-sub mb-1">{t("artStyleLabel")}</label>
            <select
              className={inputCls}
              value={bible.artStyle}
              onChange={(e) => {
                const found = ART_STYLE_KEYS.find((k: ArtStyleKey) => k === e.target.value);
                if (found) setBible({ ...bible, artStyle: found });
              }}
            >
              {ART_STYLE_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(`artStyle_${k}`)}
                </option>
              ))}
            </select>
          </div>
          {bible.artStyle === "custom" && (
            <div>
              <label className="block text-xs font-medium pg-text-sub mb-1">{t("customStyleLabel")}</label>
              <input
                className={inputCls}
                maxLength={300}
                value={bible.customStyle}
                onChange={(e) => setBible({ ...bible, customStyle: e.target.value })}
              />
            </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium pg-text-sub mb-1">{t("charactersLabel")}</label>
            <textarea
              className={inputCls}
              rows={3}
              maxLength={1500}
              placeholder={t("charactersPlaceholder")}
              value={bible.characters}
              onChange={(e) => setBible({ ...bible, characters: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium pg-text-sub mb-1">{t("paletteLabel")}</label>
            <input
              className={inputCls}
              maxLength={300}
              value={bible.palette}
              onChange={(e) => setBible({ ...bible, palette: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium pg-text-sub mb-1">{t("locationsLabel")}</label>
            <input
              className={inputCls}
              maxLength={800}
              value={bible.locations}
              onChange={(e) => setBible({ ...bible, locations: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium pg-text-sub mb-1">{t("extraRulesLabel")}</label>
            <input
              className={inputCls}
              maxLength={600}
              value={bible.extraRules}
              onChange={(e) => setBible({ ...bible, extraRules: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={primaryBtn} disabled={savingBible} onClick={saveBible}>
            {t("saveStyleBible")}
          </button>
          <button
            type="button"
            className={secondaryBtn}
            onClick={() => copyText(buildStyleBiblePrompt(bible, aspectRatio, topicText))}
          >
            {t("copyStyleBiblePrompt")}
          </button>
        </div>
      </div>

      {/* 2. Panel per scene */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold pg-text-heading">{t("step2Title")}</h3>
        <p className="text-xs pg-text-muted">{t("step2Hint")}</p>
        <p className="text-[11px] pg-text-muted">{t("usageNote")}</p>

        {/* Unggah banyak */}
        <div className="rounded-xl border pg-border p-3 space-y-2">
          <p className="text-xs font-semibold pg-text-heading">{t("bulkTitle")}</p>
          <p className="text-xs pg-text-muted">{t("bulkHint")}</p>
          <input
            ref={bulkInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              handleBulkChosen(e.target.files);
              e.target.value = "";
            }}
          />
          {!bulk && (
            <button type="button" className={secondaryBtn} disabled={busy} onClick={() => bulkInputRef.current?.click()}>
              {t("bulkChoose")}
            </button>
          )}
          {bulk && (
            <div className="space-y-2">
              <p className="text-xs font-semibold pg-text-heading">{t("bulkPreviewTitle")}</p>
              <ul className="text-xs pg-text-sub space-y-1 max-h-48 overflow-auto">
                {bulk.map((b, i) => (
                  <li key={`${b.file.name}-${i}`}>
                    {b.file.name} →{" "}
                    {b.sceneNumber !== null ? t("sceneLabel", { n: b.sceneNumber }) : t("bulkSkipped")}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button type="button" className={primaryBtn} disabled={busy} onClick={confirmBulk}>
                  {t("bulkConfirm")}
                </button>
                <button type="button" className={secondaryBtn} disabled={busy} onClick={() => setBulk(null)}>
                  {t("bulkCancel")}
                </button>
              </div>
            </div>
          )}
          {progress && (
            <p className="text-xs pg-text-sub">{t("uploading", { current: progress.current, total: progress.total })}</p>
          )}
        </div>

        {/* Input tersembunyi untuk unggah per scene */}
        <input
          ref={singleInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            void handleSingleChosen(f);
          }}
        />

        <div className="space-y-4">
          {scenes.map((scene) => {
            const panel = panelByScene.get(scene.index);
            const cam = parseCameraSetting(scene.settingKamera);
            const panelPrompt = buildPanelPrompt(scene, total, { aspectRatio, cameraMovementEnabled });
            return (
              <div key={scene.index} className="rounded-xl border pg-border p-4 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
                <div className="space-y-2 min-w-0">
                  <p className="text-sm font-bold pg-text-heading">{t("sceneLabel", { n: scene.index })}</p>
                  {cam && (
                    <p className="text-xs pg-text-sub">
                      🎥 {t("cameraLabel")}: {scene.settingKamera}
                    </p>
                  )}
                  {scene.context && <p className="text-xs pg-text-muted">{scene.context}</p>}
                  <pre className="text-[11px] whitespace-pre-wrap pg-surface-dim border pg-border rounded-lg p-2 pg-text-sub max-h-40 overflow-auto">
                    {panelPrompt}
                  </pre>
                  <button type="button" className={secondaryBtn} onClick={() => copyText(panelPrompt)}>
                    {t("copyPanelPrompt")}
                  </button>
                </div>

                <div className="space-y-2">
                  {panel ? (
                    <a href={`/api/storyboard/panels/${panel.id}?v=${encodeURIComponent(panel.updatedAt)}`} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={`/api/storyboard/panels/${panel.id}?size=thumb&v=${encodeURIComponent(panel.updatedAt)}`}
                        alt={t("sceneLabel", { n: scene.index })}
                        width={panel.width}
                        height={panel.height}
                        unoptimized
                        className="w-full h-auto rounded-lg border pg-border"
                      />
                    </a>
                  ) : (
                    <div className="w-full aspect-[9/16] max-h-64 rounded-lg border border-dashed pg-border flex items-center justify-center text-xs pg-text-muted text-center p-2">
                      {t("noPanelYet")}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={secondaryBtn}
                      disabled={busy}
                      onClick={() => {
                        pendingSceneRef.current = scene.index;
                        singleInputRef.current?.click();
                      }}
                    >
                      {panel ? t("replacePanel") : t("uploadPanel")}
                    </button>
                    {panel && (
                      <button type="button" className={secondaryBtn} disabled={busy} onClick={() => handleDelete(panel.id)}>
                        {t("deletePanel")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {panels.length > 0 && (
          <a href={`/api/drafts/${draftId}/storyboard/export`} className={`${secondaryBtn} inline-block`}>
            {t("exportZip")}
          </a>
        )}
      </div>
    </div>
  );
}
