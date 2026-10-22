/**
 * Type definitions for Generator Form & Channel State Snapshots.
 * Provides a single centralized interface for channel state persistence,
 * user preferences synchronization (/api/user/preferences), and ContentArchetype models.
 */

import type { Scene, ScriptTimingSummary, ThumbnailData, BlogPublishingPack, ThreeTierSeoData, MultiPlatformSeoData } from "@/lib/parsers";

export interface SourceAuditData {
  sourceUrl?: string;
  sourceSnippet?: string;
  keyFacts?: string[];
  angleShift?: string;
  pillarBridge?: string;
  disclaimer?: string;
}

export interface FunnelConfigSnapshot {
  sceneMode: "auto" | "manual";
  short1Scenes?: number;
  short1DurationSec?: number;
  short2Scenes?: number;
  short2DurationSec?: number;
  longScenes?: number;
  longDurationMinutes?: number;
}

export interface FunnelSegment {
  id: "short1" | "short2" | "long";
  label: string;
  aspectRatio: "9:16" | "16:9";
  targetDurationSec: number;
  scenes: Scene[];
  timingSummary: ScriptTimingSummary;
  caption?: string;
  hashtags?: string;
  thumbnailData?: ThumbnailData | null;
  multiPlatformSeo?: MultiPlatformSeoData | null;
}

export interface FunnelPackData {
  isFunnel: true;
  sourceAudit?: SourceAuditData | null;
  segments: {
    short1: FunnelSegment;
    short2: FunnelSegment;
    long: FunnelSegment;
  };
  globalHtmlBlog?: string | null;
  globalBlogPack?: BlogPublishingPack | null;
  threeTierSeo?: ThreeTierSeoData | null;
  multiPlatformSeo?: MultiPlatformSeoData | null;
}

export interface ContentArchetypeIncludedSections {
  hook?: boolean;
  cta?: boolean;
  caption?: boolean;
  thumbnail?: boolean;
  htmlBlog?: boolean;
  [key: string]: boolean | undefined;
}

export interface ContentArchetypeCompositionCategory {
  label: string;
  required?: boolean;
  [key: string]: unknown;
}

export interface GeneratorVideoConfigSnapshot {
  targetPlatform?: string;
  targetDurationSec?: number;
  targetSceneCount?: number;
  aspectRatio?: string;
  narrativeLoopStyle?: string;
  visualLoopStyle?: string;
  pov?: string;
  speechRate?: string | number;
  hookStyle?: string;
  endingStyle?: string;
  selectedProductId?: string | null;
  composition?: {
    education?: number | null;
    entertainment?: number | null;
    marketing?: number | null;
  } | null;
  includeHook?: boolean | null;
  includeCTA?: boolean | null;
  socialCaption?: boolean | null;
  thumbnailIdea?: boolean | null;
  htmlBlog?: boolean | null;
  includeCaption?: boolean | null;
  includeThumbnail?: boolean | null;
  includeHtmlBlog?: boolean | null;
  affiliateAngle?: boolean | null;
  affiliateAngleMode?: "CTA" | "SOFT" | null;
  targetKeywords?: string[] | string | null;
  narrationModeOverride?: string | null;
  videoProductionMode?: "DIFFUSION_AI" | "REMOTION_CODE" | null;
  remotionTheme?: "modern" | "cyberpunk" | "documentary" | "kinetic" | null;
  outputStructure?: "SINGLE" | "FUNNEL_BUNDLE" | null;
  sourceUrl?: string | null;
  sourceSnippet?: string | null;
  funnelConfig?: FunnelConfigSnapshot | null;
  [key: string]: unknown;
}

export interface GeneratorImageConfigSnapshot {
  aspectRatio?: string;
  negativePrompt?: string | null;
  quality?: string;
  cameraType?: string;
  shotType?: string;
  lighting?: string;
  mood?: string;
  colorGrading?: string;
  visualStyle?: string;
  variations?: number;
  [key: string]: unknown;
}

export interface GeneratorFormStateSnapshot {
  type?: "VIDEO" | "IMAGE";
  channelId?: string;
  outputLanguage?: string;
  topic?: string;
  targetKeywords?: string[];
  additionalContext?: string;
  rolePOV?: string;
  customRolePOV?: string;
  toneOfVoice?: string;
  visualStyleKey?: string;
  visualStyleCustom?: string;
  hookStyleType?: string;
  customHookText?: string;
  musicPreference?: boolean;
  sfxPreference?: boolean;
  ambientPreference?: boolean;
  voPreference?: boolean;
  narrationModeOverride?: string | null;
  trendingAudio?: string;
  cameraMovementEnabled?: boolean;
  cameraMovementPresets?: string[];
  cameraMovementCustom?: string;
  cameraMovementProMode?: boolean;
  overlayStyle?: string;
  affiliateAngle?: boolean;
  affiliateAngleMode?: "CTA" | "SOFT";
  affiliateMarketplaces?: string[] | null;
  affiliateCustomUrl?: string | null;
  retentionPacingProMode?: boolean;
  retentionPacingMode?: string;
  storytellingFramework?: string;
  valuePromise3Sec?: string;
  thumbnailStylePreset?: string;
  thumbnailFaceDominance?: boolean;
  targetKeywordsSpecific?: string;
  targetKeywordsGeneral?: string;
  targetKeywordsLongTail?: string;
  audioFadeInOut?: boolean;
  audioBeatSync?: boolean;
  videoProductionMode?: "DIFFUSION_AI" | "REMOTION_CODE";
  remotionTheme?: "modern" | "cyberpunk" | "documentary" | "kinetic";
  outputStructure?: "SINGLE" | "FUNNEL_BUNDLE";
  sourceUrl?: string;
  sourceSnippet?: string;
  showSnippetInput?: boolean;
  funnelSceneMode?: "auto" | "manual";
  short1Scenes?: number;
  short1DurationSec?: number;
  short2Scenes?: number;
  short2DurationSec?: number;
  longScenes?: number;
  longDurationMinutes?: number;
  videoConfig?: GeneratorVideoConfigSnapshot;
  imageConfig?: GeneratorImageConfigSnapshot;
  step?: 1 | 2;
  generatedPrompt?: string;
  aiResultJson?: string;
  manualTitle?: string;
  [key: string]: unknown;
}
