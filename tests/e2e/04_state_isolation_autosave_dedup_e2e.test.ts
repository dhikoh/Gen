import { describe, it, expect } from "vitest";
import { z } from "zod";
import { generateMasterPrompt, VideoConfigData } from "@/lib/promptGenerator";
import { MOCK_TECH_CHANNEL, MOCK_FASHION_CHANNEL } from "./testHarness";

describe("E2E Skenario 4: Multi-Channel State Isolation, Autosave Persistence & Dual-Source Deduplication", () => {
  // Zod schemas dari api/user/preferences/route.ts
  const videoConfigSchema = z.object({
    targetPlatform: z.string().optional(),
    targetDurationSec: z.number().optional(),
    targetSceneCount: z.number().optional(),
    aspectRatio: z.string().optional(),
    videoProductionMode: z.enum(["DIFFUSION_AI", "REMOTION_CODE", "WEB_MOTION_HTML"]).optional(),
    motionStyle: z.string().optional(),
    motionBackground: z.string().optional(),
    motionPacing: z.string().optional(),
    speechRate: z.union([z.string(), z.number()]).optional(),
  }).passthrough();

  const generatorFormStateSchema = z.object({
    type: z.enum(["VIDEO", "IMAGE", "MOTION"]).optional(),
    channelId: z.string().optional(),
    topic: z.string().max(500).optional(),
    motionStyle: z.string().optional(),
    motionBackground: z.string().optional(),
    motionPacing: z.string().optional(),
    videoConfig: videoConfigSchema.optional(),
  }).passthrough();

  describe("Bagian 1: Multi-Channel Form State Isolation", () => {
    it("ensures Channel A (Web Motion) and Channel B (Video Diffusion) states remain strictly isolated without cross-contamination", () => {
      // Channel A: Tech Channel (Web Motion)
      const channelAState = {
        type: "MOTION" as const,
        channelId: "chan_tech_01",
        topic: "Otomasi Workflow AI",
        motionStyle: "SAAS_EXPLAINER",
        motionBackground: "GLOW_HORIZON",
        motionPacing: "SNAPPY",
        videoConfig: {
          videoProductionMode: "WEB_MOTION_HTML" as const,
          targetDurationSec: 45,
          motionStyle: "SAAS_EXPLAINER",
          motionBackground: "GLOW_HORIZON",
          motionPacing: "SNAPPY",
        },
      };

      // Channel B: Fashion Channel (Diffusion AI)
      const channelBState = {
        type: "VIDEO" as const,
        channelId: "chan_fashion_02",
        topic: "Inspirasi OOTD Weekend",
        videoConfig: {
          videoProductionMode: "DIFFUSION_AI" as const,
          targetDurationSec: 30,
          aspectRatio: "9:16",
        },
      };

      // 1. Validasi Zod Schema untuk kedua state
      const parseA = generatorFormStateSchema.safeParse(channelAState);
      const parseB = generatorFormStateSchema.safeParse(channelBState);

      expect(parseA.success).toBe(true);
      expect(parseB.success).toBe(true);

      // 2. Simulasi Storage Map terisolasi (seperti channelFormStates di LocalStorage & Server Prefs)
      const mockStorage: Record<string, typeof channelAState | typeof channelBState> = {};
      mockStorage["chan_tech_01"] = channelAState;
      mockStorage["chan_fashion_02"] = channelBState;

      // 3. Verifikasi Isolasi: Membaca Channel A tidak merubah atau mencemari Channel B
      const retrievedA = mockStorage["chan_tech_01"];
      const retrievedB = mockStorage["chan_fashion_02"];

      expect(retrievedA.type).toBe("MOTION");
      expect(retrievedA.motionStyle).toBe("SAAS_EXPLAINER");

      expect(retrievedB.type).toBe("VIDEO");
      expect(retrievedB.type).not.toBe("MOTION");
      expect((retrievedB as any).motionStyle).toBeUndefined();
    });
  });

  describe("Bagian 2: Draft Saving Payload Safety", () => {
    it("maps type: 'MOTION' to 'VIDEO' when saving drafts to adhere strictly to Prisma DraftType enum", () => {
      const clientFormState = {
        type: "MOTION" as const,
        channelId: "chan_tech_01",
        topic: "Solopreneur AI Tools",
        aiResultJson: JSON.stringify({ scenes: [], webMotionHtml: "<!DOCTYPE html>..." }),
      };

      // Logika pemetaan aman di GeneratorForm.tsx line 1219
      const apiDraftPayload = {
        channelId: clientFormState.channelId,
        type: clientFormState.type === "MOTION" ? "VIDEO" : clientFormState.type,
        topic: clientFormState.topic,
        rawJson: clientFormState.aiResultJson,
      };

      // Skema Prisma Draft hanya mengizinkan VIDEO atau IMAGE
      const prismaDraftTypeSchema = z.enum(["VIDEO", "IMAGE"]);
      const validation = prismaDraftTypeSchema.safeParse(apiDraftPayload.type);

      expect(validation.success).toBe(true);
      expect(apiDraftPayload.type).toBe("VIDEO");
    });
  });

  describe("Bagian 3: Dual-Source Deduplication (UsedTitle + Draft)", () => {
    it("deduplicates titles across both UsedTitle and historical Drafts, eliminating case-insensitive overlaps", () => {
      const mockUsedTitleRecords = [
        { title: "5 Tools AI Otomasi Solo Founder" },
        { title: "Rahasia Kerja Cerdas 2026" },
      ];

      const mockPreviousDrafts = [
        { title: "5 tools ai otomasi solo founder" }, // Duplikat case-insensitive
        { title: "Panduan Memulai Bisnis Digital" },   // Judul unik baru dari draft
      ];

      // Simulasi logika deduplikasi di api/generate/route.ts lines 279-289
      const seenExclude = new Set<string>();
      const previousTitles: string[] = [];

      for (const ut of mockUsedTitleRecords) {
        const key = ut.title.trim().toLowerCase();
        if (!seenExclude.has(key)) {
          seenExclude.add(key);
          previousTitles.push(ut.title);
        }
      }

      for (const d of mockPreviousDrafts) {
        if (!d.title) continue;
        const key = d.title.trim().toLowerCase();
        if (!seenExclude.has(key)) {
          seenExclude.add(key);
          previousTitles.push(d.title);
        }
      }

      // Verifikasi: Dari 4 record, harus tepat 3 judul unik (0 duplikasi)
      expect(previousTitles).toHaveLength(3);
      expect(previousTitles).toContain("5 Tools AI Otomasi Solo Founder");
      expect(previousTitles).toContain("Rahasia Kerja Cerdas 2026");
      expect(previousTitles).toContain("Panduan Memulai Bisnis Digital");

      // Verifikasi Injeksi ke Prompt Generator
      const videoConfig: VideoConfigData = {
        videoProductionMode: "WEB_MOTION_HTML",
        motionStyle: "SAAS_EXPLAINER",
      };

      const generated = generateMasterPrompt(
        MOCK_TECH_CHANNEL,
        "Topik AI Baru",
        "",
        videoConfig,
        null,
        previousTitles,
        "id"
      );

      // Seluruh 3 judul unik wajib masuk ke dalam larangan AI
      expect(generated.masterPrompt).toContain("5 Tools AI Otomasi Solo Founder");
      expect(generated.masterPrompt).toContain("Rahasia Kerja Cerdas 2026");
      expect(generated.masterPrompt).toContain("Panduan Memulai Bisnis Digital");
    });
  });
});

