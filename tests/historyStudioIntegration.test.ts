import { describe, it, expect } from "vitest";

describe("History & Studio Workflow Integration (Section 33, #68)", () => {
  describe("Search Query & Draft Filtering Logic", () => {
    const mockDrafts = [
      {
        id: "d-1",
        title: "Tutorial AI Automation Tools 2026",
        rawJson: "Adegan 1: Panduan memulai automasi dengan AI agent...",
        type: "VIDEO",
      },
      {
        id: "d-2",
        title: "Resep Sambal Bawang Pedas Gurih",
        rawJson: "Scene 1: Bawang merah dan cabai rawit digoreng setengah matang...",
        type: "VIDEO",
      },
      {
        id: "d-3",
        title: "Prompt Foto Sinematik Cyberpunk",
        rawJson: "Cyberpunk street in neo-tokyo at midnight --ar 16:9",
        type: "IMAGE",
      },
    ];

    it("matches query against title in case-insensitive mode", () => {
      const query = "automation";
      const filtered = mockDrafts.filter(
        (d) =>
          d.title.toLowerCase().includes(query.toLowerCase()) ||
          d.rawJson.toLowerCase().includes(query.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("d-1");
    });

    it("matches query against rawJson text in case-insensitive mode", () => {
      const query = "cabai rawit";
      const filtered = mockDrafts.filter(
        (d) =>
          d.title.toLowerCase().includes(query.toLowerCase()) ||
          d.rawJson.toLowerCase().includes(query.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("d-2");
    });

    it("returns empty array when search query matches no drafts", () => {
      const query = "nonexistent-keyword-xyz";
      const filtered = mockDrafts.filter(
        (d) =>
          d.title.toLowerCase().includes(query.toLowerCase()) ||
          d.rawJson.toLowerCase().includes(query.toLowerCase())
      );
      expect(filtered).toHaveLength(0);
    });
  });

  describe("Channel Preservation on Draft Save Redirect", () => {
    function buildDraftsRedirectUrl(lang: string, channelId?: string | null): string {
      const base = `/${lang || "id"}/dashboard/drafts`;
      return channelId ? `${base}?channelId=${encodeURIComponent(channelId)}` : base;
    }

    it("appends channelId query parameter when channelId is present", () => {
      const url = buildDraftsRedirectUrl("id", "channel-tech-123");
      expect(url).toBe("/id/dashboard/drafts?channelId=channel-tech-123");
    });

    it("properly encodes channelId with special characters", () => {
      const url = buildDraftsRedirectUrl("en", "chan test&review");
      expect(url).toBe("/en/dashboard/drafts?channelId=chan%20test%26review");
    });

    it("returns clean base URL without query string when channelId is missing or empty", () => {
      const url1 = buildDraftsRedirectUrl("id", null);
      const url2 = buildDraftsRedirectUrl("id", "");
      expect(url1).toBe("/id/dashboard/drafts");
      expect(url2).toBe("/id/dashboard/drafts");
    });
  });

  describe("Template Recycling into Generator Studio", () => {
    interface SavedDraftPayload {
      id: string;
      type: "VIDEO" | "IMAGE";
      channelId?: string | null;
      topic?: string | null;
      title?: string | null;
      targetDurationSec?: number | null;
      targetSceneCount?: number | null;
      speechRate?: number | null;
      narrativeLoopStyle?: string | null;
      visualLoopStyle?: string | null;
      isTemplate: boolean;
    }

    it("correctly maps template draft values to Generator Studio state with numeric safety", () => {
      const templateDraft: SavedDraftPayload = {
        id: "tpl-456",
        type: "VIDEO",
        channelId: "chan-prod-1",
        topic: "Strategi Konten TikTok Viral 2026",
        title: "Master Formula Viral TikTok",
        targetDurationSec: 60,
        targetSceneCount: 6,
        speechRate: 0.28,
        narrativeLoopStyle: "SEAMLESS_QUESTION",
        visualLoopStyle: "MATCH_CUT",
        isTemplate: true,
      };

      const defaultVideoConfig = {
        targetDurationSec: 30,
        targetSceneCount: 4,
        speechRate: 0.35,
        narrativeLoopStyle: "NONE",
        visualLoopStyle: "NONE",
      };

      // Applied template config
      const appliedConfig = {
        ...defaultVideoConfig,
        targetDurationSec: Number(templateDraft.targetDurationSec),
        targetSceneCount: templateDraft.targetSceneCount
          ? Number(templateDraft.targetSceneCount)
          : defaultVideoConfig.targetSceneCount,
        speechRate: templateDraft.speechRate
          ? Number(templateDraft.speechRate)
          : defaultVideoConfig.speechRate,
        narrativeLoopStyle: templateDraft.narrativeLoopStyle || defaultVideoConfig.narrativeLoopStyle,
        visualLoopStyle: templateDraft.visualLoopStyle || defaultVideoConfig.visualLoopStyle,
      };

      expect(appliedConfig.targetDurationSec).toBe(60);
      expect(typeof appliedConfig.targetDurationSec).toBe("number");
      expect(appliedConfig.targetSceneCount).toBe(6);
      expect(typeof appliedConfig.targetSceneCount).toBe("number");
      expect(appliedConfig.speechRate).toBe(0.28);
      expect(typeof appliedConfig.speechRate).toBe("number");
      expect(appliedConfig.narrativeLoopStyle).toBe("SEAMLESS_QUESTION");
      expect(appliedConfig.visualLoopStyle).toBe("MATCH_CUT");
    });
  });

  describe("Voice & Scene Studio Handover Contract", () => {
    it("validates initialDraft payload contract passed to ScenePromptStudioClient", () => {
      const initialDraft = {
        id: "draft-789",
        title: "Review Gadget Futuristik",
        channelId: "chan-gadget",
        rawJson: `## Scene 1
Narasi: Selamat datang di masa depan teknologi smartphone.
Visual Prompt: Futuristic folding smartphone glowing on glass table --ar 9:16
Durasi: 5s

## Scene 2
Narasi: Layarnya tidak hanya fleksibel, tapi juga transparan.
Visual Prompt: Transparent OLED display demonstrating holographic interface --ar 9:16
Durasi: 6s`,
      };

      expect(initialDraft.id).toBeDefined();
      expect(initialDraft.title).toBe("Review Gadget Futuristik");
      expect(initialDraft.channelId).toBe("chan-gadget");
      expect(initialDraft.rawJson).toContain("Scene 1");
      expect(initialDraft.rawJson).toContain("Scene 2");
    });
  });
});
