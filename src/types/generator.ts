/**
 * Type definitions for Generator Form & Channel State Snapshots.
 * Provides a single centralized interface for channel state persistence,
 * user preferences synchronization (/api/user/preferences), and ContentArchetype models.
 */

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
  videoConfig?: GeneratorVideoConfigSnapshot;
  imageConfig?: GeneratorImageConfigSnapshot;
  step?: 1 | 2;
  generatedPrompt?: string;
  aiResultJson?: string;
  manualTitle?: string;
  [key: string]: unknown;
}
