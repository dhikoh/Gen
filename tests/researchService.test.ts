import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { performKeywordResearch, scoreKeyword } from "@/lib/researchService";

describe("researchService", () => {
  describe("scoreKeyword", () => {
    it("assigns High volume to top-ranked suggestions and Low volume to bottom suggestions", () => {
      const topKw = scoreKeyword("tutorial prompt ai", 0, 10);
      expect(topKw.volume).toBe("High");

      const bottomKw = scoreKeyword("prompt ai pemula lengkap 2026", 8, 10);
      expect(bottomKw.volume).toBe("Low");
    });

    it("evaluates competition based on specificity and modifiers", () => {
      // Single word has High competition
      const broad = scoreKeyword("ai", 1, 10);
      expect(broad.competition).toBe("High");

      // Long-tail with specific modifier has Low competition
      const longTail = scoreKeyword("cara setting prompt ai video tutorial", 2, 10);
      expect(longTail.competition).toBe("Low");
    });

    it("generates scores within realistic 0-100 range", () => {
      for (let i = 0; i < 10; i++) {
        const item = scoreKeyword(`keyword test number ${i}`, i, 10);
        expect(item.score).toBeGreaterThanOrEqual(0);
        expect(item.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("performKeywordResearch data honesty and disclaimer", () => {
    const originalApiKey = process.env.YOUTUBE_API_KEY;

    beforeEach(() => {
      delete process.env.YOUTUBE_API_KEY;
    });

    afterEach(() => {
      if (originalApiKey) {
        process.env.YOUTUBE_API_KEY = originalApiKey;
      } else {
        delete process.env.YOUTUBE_API_KEY;
      }
      vi.restoreAllMocks();
    });

    it("never returns cosmetic 'VIDIQ_MCP' as source", async () => {
      const result = await performKeywordResearch("prompt ai");
      expect(result.source).not.toBe("VIDIQ_MCP");
      result.keywords.forEach((item) => {
        expect((item as unknown as { source?: string }).source).not.toBe("VIDIQ_MCP");
      });
    });

    it("returns an educational disclaimer stating data is estimated and not validated search volume", async () => {
      const result = await performKeywordResearch("teknologi masa depan");
      expect(result.disclaimer).toBeDefined();
      expect(result.disclaimer.length).toBeGreaterThan(20);
      expect(result.disclaimer.toLowerCase()).toContain("estimasi");
    });

    it("returns YOUTUBE_AUTOCOMPLETE_HEURISTIC or HEURISTIC_FALLBACK when no YouTube API key is provided", async () => {
      delete process.env.YOUTUBE_API_KEY;
      const result = await performKeywordResearch("tutorial nextjs");
      expect(["YOUTUBE_AUTOCOMPLETE_HEURISTIC", "HEURISTIC_FALLBACK"]).toContain(result.source);
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.keywords[0].keyword).toBeDefined();
      expect(["High", "Medium", "Low"]).toContain(result.keywords[0].volume);
      expect(["High", "Medium", "Low"]).toContain(result.keywords[0].competition);
      expect(typeof result.keywords[0].score).toBe("number");
    });

    it("returns REAL_API when YouTube Data API v3 returns results", async () => {
      process.env.YOUTUBE_API_KEY = "dummy_valid_key";

      const mockSearchResponse = {
        items: [
          {
            id: { videoId: "video1" },
            snippet: {
              title: "Tutorial Prompt AI Pemula 2026",
              description: "Belajar prompt generator",
            },
          },
          {
            id: { videoId: "video2" },
            snippet: {
              title: "Cara Buat Script AI Cepat",
              description: "Tips prompt gen praktis",
            },
          },
        ],
      };

      const mockVideosResponse = {
        items: [
          {
            snippet: { title: "Tutorial Prompt AI Pemula 2026", tags: ["ai", "prompt"] },
            statistics: { viewCount: "250000", commentCount: "450", likeCount: "12000" },
          },
          {
            snippet: { title: "Cara Buat Script AI Cepat", tags: ["script", "generator"] },
            statistics: { viewCount: "80000", commentCount: "120", likeCount: "3500" },
          },
        ],
      };

      vi.spyOn(global, "fetch").mockImplementation((url: unknown) => {
        const urlStr = String(url);
        if (urlStr.includes("googleapis.com/youtube/v3/search")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSearchResponse),
          } as Response);
        }
        if (urlStr.includes("googleapis.com/youtube/v3/videos")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockVideosResponse),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(["prompt ai", ["pertanyaan 1", "pertanyaan 2"]]),
        } as Response);
      });

      const result = await performKeywordResearch("prompt ai");
      expect(result.source).toBe("REAL_API");
      expect(result.keywords.length).toBeGreaterThanOrEqual(2);
      expect(result.isHeuristicEstimation).toBe(false);
    });

    it("falls back gracefully when autocomplete fails or errors", async () => {
      vi.spyOn(global, "fetch").mockImplementation(() =>
        Promise.reject(new Error("Network disconnect"))
      );

      const result = await performKeywordResearch("kripto cuan");
      expect(result.source).toBe("HEURISTIC_FALLBACK");
      expect(result.keywords.length).toBeGreaterThan(0);
    });
  });
});
