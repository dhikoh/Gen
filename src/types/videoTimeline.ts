export interface VideoTimelineScene {
  /** Nomor urut scene (1-indexed, dari parseScenes) */
  sceneNumber: number;
  /** Teks narasi untuk TTS */
  narration: string;
  /** Durasi scene dalam detik (dari estimatedDurationSec atau manual) */
  durationSec: number;
  /** Offset kumulatif dari awal video (detik) */
  startOffsetSec: number;
  /** Visual prompt untuk scene ini */
  visualPrompt: string;
  /** Scene context (konteks adegan) */
  sceneContext: string;
  /** Teks overlay jika ada */
  textOverlay: string;
  /** Audio file reference (base64 dari Voice Studio, atau null) */
  audioRef: string | null;
  /** Bab (chapter) jika ada grouping */
  chapter: number | null;
  chapterTitle: string | null;
}

export interface VideoTimeline {
  version: 1;
  totalDurationSec: number;
  scenes: VideoTimelineScene[];
  /** Referensi judul-judul yang sudah dipakai (UsedTitle IDs) */
  usedTitleIds: string[];
  /** Teks judul terpakai — dikirim ke AI agar tidak membahas topik yang sama */
  usedTitleTexts: string[];
  /** Metadata export */
  exportedAt: string;
  draftId: string;
  channelId: string | null;
}
