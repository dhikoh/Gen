import { ProfileChannelData, VideoConfigData } from "@/lib/promptGenerator";
import { PlanFeatureDefinition, KNOWN_PLAN_FEATURES, hasFeature } from "@/lib/planFeatures";

export interface MockUserSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "SUPERADMIN";
  };
  plan?: {
    id: string;
    name: string;
    features: Record<string, boolean>;
  } | null;
}

export const MOCK_SUPERADMIN: MockUserSession = {
  user: {
    id: "usr_superadmin_01",
    email: "superadmin@promptgen.test",
    name: "Chief Admin",
    role: "SUPERADMIN",
  },
  plan: {
    id: "plan_enterprise",
    name: "ENTERPRISE",
    features: KNOWN_PLAN_FEATURES.reduce((acc, feat) => {
      acc[feat.key] = true;
      return acc;
    }, {} as Record<string, boolean>),
  },
};

export const MOCK_PRO_USER: MockUserSession = {
  user: {
    id: "usr_pro_02",
    email: "pro_creator@promptgen.test",
    name: "Pro Content Creator",
    role: "USER",
  },
  plan: {
    id: "plan_pro",
    name: "PRO",
    features: {
      imagePromptStudio: true,
      htmlBlogExport: true,
      cameraMovementPro: true,
      textToSpeechStudio: true,
      youtubeLongStudio: true,
      retentionPacingPro: true,
      storyboardStudio: true,
      fullVideoStudio: true,
      remotionStudio: true,
      webMotionStudio: true,
      googleDriveUpload: true,
    },
  },
};

export const MOCK_FREE_USER: MockUserSession = {
  user: {
    id: "usr_free_03",
    email: "free_user@promptgen.test",
    name: "Free Tier Starter",
    role: "USER",
  },
  plan: {
    id: "plan_free",
    name: "FREE",
    features: {
      imagePromptStudio: true,
      htmlBlogExport: false,
      cameraMovementPro: false,
      textToSpeechStudio: false,
      youtubeLongStudio: false,
      retentionPacingPro: false,
      storyboardStudio: false,
      fullVideoStudio: false,
      remotionStudio: false,
      webMotionStudio: false,
      googleDriveUpload: false,
    },
  },
};

export const MOCK_TECH_CHANNEL: ProfileChannelData = {
  channelName: "Indo Tech Horizon",
  niche: "SaaS & AI Productivity",
  description: "Channel edukasi tutorial tools AI dan software otomasi untuk developer & founder.",
  personaPov: "Orang Pertama (Saya - Ahli Teknologi Praktis)",
  visualAesthetic: "Sleek Dark Cyberpunk with Neon Cyan Accents",
  cta1: "Coba tools otomasi ini gratis lewat link di bio!",
  cta2: "Komen 'PROMPT' untuk dapat template script lengkapnya.",
  audioBGM: true,
  audioSFX: true,
  audioAmbient: true,
  audioVO: true,
  products: [
    { name: "PromptGen AI Lifetime Access", price: 499000, description: "Akses seumur hidup generator script & web motion" },
    { name: "Consultation 1-on-1 Automation", price: 999000, description: "Konsultasi setup workflow AI untuk agensi" },
  ],
  speechRate: 0.35,
  targetPlatform: "TikTok / Reels (9:16)",
};

export const MOCK_FASHION_CHANNEL: ProfileChannelData = {
  channelName: "OOTD Trendy Daily",
  niche: "Fashion & Lifestyle",
  description: "Review outfit lokal dan tips padu padan busana harian modern.",
  personaPov: "Orang Pertama (Aku - Sahabat Belanja)",
  visualAesthetic: "Warm Editorial Minimalist Aesthetic",
  cta1: "Cek keranjang kuning sekarang sebelum kehabisan!",
  audioBGM: true,
  audioSFX: false,
  audioAmbient: true,
  audioVO: true,
  products: [
    { name: "Oversized Blazer Earth Tone", price: 189000, description: "Blazer linen premium sejuk seharian" },
  ],
  speechRate: 0.32,
  targetPlatform: "TikTok / Reels (9:16)",
};

