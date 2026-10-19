import { describe, it, expect } from "vitest";

describe("Used Titles Directory & Draft Title Integration (#91)", () => {
  describe("Title Sanitization & Clean Function", () => {
    function sanitizeTitle(raw: string): string {
      return raw
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .trim()
        .substring(0, 500);
    }

    it("strips control characters and trims leading/trailing whitespace", () => {
      const dirty = "  \u0000\u0007\t  Judul Video Keren 2026 \u001F  ";
      expect(sanitizeTitle(dirty)).toBe("Judul Video Keren 2026");
    });

    it("truncates titles exceeding 500 characters safely", () => {
      const longTitle = "A".repeat(600);
      const cleaned = sanitizeTitle(longTitle);
      expect(cleaned.length).toBe(500);
      expect(cleaned).toBe("A".repeat(500));
    });

    it("returns empty string for pure control character strings", () => {
      const onlyControl = "\u0000\u0001\u0002   \t\n";
      expect(sanitizeTitle(onlyControl)).toBe("");
    });
  });

  describe("Chronological Date Sorting (Newest First)", () => {
    interface TitleItem {
      id: string;
      title: string;
      type: string;
      createdAt: Date;
    }

    it("strictly orders merged titles from newest to oldest regardless of origin table", () => {
      const olderUsedTitle: TitleItem = {
        id: "ut-old",
        title: "Judul Lama 1 Bulan Lalu",
        type: "VIDEO",
        createdAt: new Date("2026-09-01T10:00:00Z"),
      };

      const newerDraftTitle: TitleItem = {
        id: "d-new",
        title: "Judul Baru Dibuat Hari Ini",
        type: "VIDEO",
        createdAt: new Date("2026-10-04T12:00:00Z"),
      };

      const middleUsedTitle: TitleItem = {
        id: "ut-mid",
        title: "Judul Pertengahan Minggu Lalu",
        type: "VIDEO",
        createdAt: new Date("2026-09-25T08:00:00Z"),
      };

      // Raw merged before sort
      const merged: TitleItem[] = [olderUsedTitle, middleUsedTitle, newerDraftTitle];

      // Sort descending by createdAt
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      expect(merged[0].id).toBe("d-new");
      expect(merged[0].title).toBe("Judul Baru Dibuat Hari Ini");
      expect(merged[1].id).toBe("ut-mid");
      expect(merged[2].id).toBe("ut-old");
    });
  });

  describe("UsedTitlesDirectory Search & Filtering Engine", () => {
    const sampleTitles = [
      { id: "1", title: "Cara Cepat Buat AI Video 2026", type: "VIDEO", createdAt: "2026-10-04T10:00:00Z" },
      { id: "2", title: "Rahasia Prompt Midjourney V6.1 Ultra Realistis", type: "IMAGE", createdAt: "2026-10-03T11:00:00Z" },
      { id: "3", title: "Tutorial Automasi Naskah YouTube Shorts", type: "VIDEO", createdAt: "2026-10-02T12:00:00Z" },
      { id: "4", title: "Belajar Prompt Engineering dari Nol", type: "VIDEO", createdAt: "2026-10-01T09:00:00Z" },
    ];

    it("filters titles case-insensitively by keyword", () => {
      const query = "prompt";
      const filtered = sampleTitles.filter((t) =>
        t.title.toLowerCase().includes(query.trim().toLowerCase())
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.map((f) => f.id)).toEqual(["2", "4"]);
    });

    it("filters titles with leading and trailing whitespace in query", () => {
      const query = "   youtube shorts   ";
      const filtered = sampleTitles.filter((t) =>
        t.title.toLowerCase().includes(query.trim().toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("3");
    });

    it("returns full list when search query is empty", () => {
      const query = "";
      const filtered = sampleTitles.filter((t) =>
        t.title.toLowerCase().includes(query.trim().toLowerCase())
      );
      expect(filtered).toHaveLength(4);
    });

    it("returns empty list when query matches nothing", () => {
      const query = "xyz-tidak-ada-keyword";
      const filtered = sampleTitles.filter((t) =>
        t.title.toLowerCase().includes(query.trim().toLowerCase())
      );
      expect(filtered).toHaveLength(0);
    });
  });

  describe("Deduplication & Authority Resolution", () => {
    it("deduplicates identical titles case-insensitively and keeps primary authoritative record", () => {
      const usedTitles = [
        { id: "ut-1", title: "Kisah Sukses Kreator AI", type: "VIDEO", createdAt: new Date("2026-09-20") },
      ];
      const draftTitles = [
        { id: "d-1", title: "kisah sukses kreator ai", type: "VIDEO", createdAt: new Date("2026-10-04") },
        { id: "d-2", title: "Judul Unik Lainnya", type: "VIDEO", createdAt: new Date("2026-10-04") },
      ];

      const seen = new Map<string, { id: string; title: string; createdAt: Date }>();

      for (const ut of usedTitles) {
        const key = ut.title.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, { id: ut.id, title: ut.title, createdAt: ut.createdAt });
        }
      }

      for (const d of draftTitles) {
        const key = d.title.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, { id: d.id, title: d.title, createdAt: d.createdAt });
        }
      }

      const merged = Array.from(seen.values());
      expect(merged).toHaveLength(2);
      // The authoritative UsedTitle id is preserved for the duplicate title
      const duplicateResolution = merged.find((m) => m.title.toLowerCase() === "kisah sukses kreator ai");
      expect(duplicateResolution?.id).toBe("ut-1");
    });
  });
});
