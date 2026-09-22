import { describe, it, expect, vi, beforeEach } from "vitest";
import { callGeminiTts, validateGeminiApiKey } from "@/lib/geminiTts";

describe("geminiTts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("callGeminiTts", () => {
    it("returns a valid WAV buffer on success", async () => {
      // PCM data minimal (4 bytes)
      const fakePcm = Buffer.from([0, 1, 2, 3]).toString("base64");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: fakePcm,
                      mimeType: "audio/L16;rate=24000",
                    },
                  },
                ],
              },
            },
          ],
        }),
      }) as unknown as typeof fetch;

      const result = await callGeminiTts(
        "fake-key",
        "halo dunia",
        "Kore",
        "gemini-2.5-flash-preview-tts"
      );
      expect(result.success).toBe(true);
      // WAV header dimulai dengan "RIFF"
      expect(result.audioBuffer?.subarray(0, 4).toString()).toBe("RIFF");
      // WAV buffer harus lebih besar dari header 44 byte
      expect(result.audioBuffer!.length).toBeGreaterThan(44);
    });

    it("classifies 429 as RATE_LIMITED", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: "quota exceeded" } }),
      }) as unknown as typeof fetch;

      const result = await callGeminiTts(
        "fake-key",
        "teks",
        "Kore",
        "gemini-2.5-flash-preview-tts"
      );
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("RATE_LIMITED");
    });

    it("classifies 403 as INVALID_KEY", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: "permission denied" } }),
      }) as unknown as typeof fetch;

      const result = await callGeminiTts(
        "bad-key",
        "teks",
        "Kore",
        "gemini-2.5-flash-preview-tts"
      );
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("INVALID_KEY");
    });

    it("retries once on UNKNOWN error (500)", async () => {
      let callCount = 0;
      const fakePcm = Buffer.from([0, 1, 2, 3]).toString("base64");
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // First attempt: 500 error
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: { message: "internal error" } }),
          };
        }
        // Retry: success
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    { inlineData: { data: fakePcm, mimeType: "audio/L16;rate=24000" } },
                  ],
                },
              },
            ],
          }),
        };
      }) as unknown as typeof fetch;

      const result = await callGeminiTts(
        "fake-key",
        "teks",
        "Kore",
        "gemini-2.5-flash-preview-tts"
      );
      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });

    it("does NOT retry on RATE_LIMITED (429)", async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: false,
          status: 429,
          json: async () => ({ error: { message: "quota" } }),
        };
      }) as unknown as typeof fetch;

      const result = await callGeminiTts(
        "fake-key",
        "teks",
        "Kore",
        "gemini-2.5-flash-preview-tts"
      );
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("RATE_LIMITED");
      expect(callCount).toBe(1); // no retry
    });
  });

  describe("validateGeminiApiKey", () => {
    it("returns valid:true on 200 response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ models: [] }),
      }) as unknown as typeof fetch;

      const result = await validateGeminiApiKey("valid-key");
      expect(result.valid).toBe(true);
    });

    it("returns valid:false with message on 403", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: "API key not valid" } }),
      }) as unknown as typeof fetch;

      const result = await validateGeminiApiKey("bad-key");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("API key not valid");
    });

    it("returns valid:false on network error", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      const result = await validateGeminiApiKey("any-key");
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Network failure");
    });
  });
});
