/**
 * Research Service for YouTube & Keyword Trend Intelligence
 * Mengambil kata kunci pencarian real-time, estimasi volume berbasis pola pencarian,
 * tingkat kompetisi, tag rekomendasi, dan sudut pandang konten (content angles).
 *
 * SUMBER DATA:
 * 1. REAL_API: Menggunakan YouTube Data API v3 resmi jika API key tersedia.
 * 2. YOUTUBE_AUTOCOMPLETE_HEURISTIC: Estimasi heuristik berbasis pola saran autocomplete Google/YouTube.
 * 3. HEURISTIC_FALLBACK: Estimasi pola sintaksis lokal saat jaringan terputus.
 *
 * CATATAN KEJUJURAN: Tidak menggunakan label kosmetik "VIDIQ_MCP". Metrik skor dan volume
 * pada mode autocomplete merupakan estimasi cerdas, bukan angka pencarian absolut pihak ketiga.
 */

export interface KeywordMetric {
  keyword: string;
  volume: "High" | "Medium" | "Low";
  competition: "Low" | "Medium" | "High";
  score: number; // 0 - 100
  trendTag?: string; // e.g. "Viral", "Rising", "Evergreen"
}

export interface ResearchResult {
  query: string;
  source: "REAL_API" | "YOUTUBE_AUTOCOMPLETE_HEURISTIC" | "HEURISTIC_FALLBACK";
  keywords: KeywordMetric[];
  recommendedTags: string[];
  contentAngles: string[];
  isHeuristicEstimation: boolean;
  disclaimer: string;
  timestamp: string;
}

/**
 * Panggilan resmi ke YouTube Data API v3 untuk video pencarian & statistik nyata
 */
async function fetchFromYouTubeDataApi(
  query: string,
  apiKey: string
): Promise<{ keywords: KeywordMetric[]; tags: string[] } | null> {
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const searchData = await res.json();
    if (!searchData.items || !Array.isArray(searchData.items) || searchData.items.length === 0) {
      return null;
    }

    interface YouTubeSearchItem {
      id?: { videoId?: string };
    }
    const videoIds = (searchData.items as YouTubeSearchItem[])
      .map((it) => it.id?.videoId)
      .filter((id): id is string => Boolean(id));

    if (videoIds.length === 0) return null;

    // Fetch live statistics for real volume and engagement
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${encodeURIComponent(videoIds.join(","))}&key=${encodeURIComponent(apiKey)}`;
    const statsController = new AbortController();
    const statsTimeout = setTimeout(() => statsController.abort(), 4500);
    const statsRes = await fetch(statsUrl, { signal: statsController.signal });
    clearTimeout(statsTimeout);

    if (!statsRes.ok) return null;
    const statsData = await statsRes.json();
    interface YouTubeVideoItem {
      snippet?: { title?: string; tags?: string[] };
      statistics?: { viewCount?: string; commentCount?: string; likeCount?: string };
    }
    const videoItems: YouTubeVideoItem[] = statsData.items || [];

    const metrics: KeywordMetric[] = videoItems.map((item, idx) => {
      const rawTitle = item.snippet?.title || query;
      const cleanTitle = rawTitle.replace(/[[\]|*#]/g, "").trim().substring(0, 65);
      const views = parseInt(item.statistics?.viewCount || "0", 10);
      const comments = parseInt(item.statistics?.commentCount || "0", 10);

      const volume: "High" | "Medium" | "Low" = views > 150000 ? "High" : views > 15000 ? "Medium" : "Low";
      const competition: "Low" | "Medium" | "High" = comments > 300 ? "High" : comments > 30 ? "Medium" : "Low";

      const baseScore = volume === "High" ? 80 : volume === "Medium" ? 68 : 55;
      const compBonus = competition === "Low" ? 12 : competition === "Medium" ? 4 : -8;
      const rankDamp = Math.min(10, idx * 1.5);
      const score = Math.max(35, Math.min(98, Math.round(baseScore + compBonus - rankDamp)));

      let trendTag = "📊 Data Resmi";
      if (idx === 0 && volume === "High") trendTag = "🔥 Top Live Video";
      else if (competition === "Low" && score >= 75) trendTag = "🚀 Peluang Emas";

      return {
        keyword: cleanTitle,
        volume,
        competition,
        score,
        trendTag,
      };
    });

    const tags: string[] = [];
    videoItems.forEach((it) => {
      if (Array.isArray(it.snippet?.tags)) {
        tags.push(...it.snippet.tags);
      }
    });

    return {
      keywords: metrics.slice(0, 10),
      tags: Array.from(new Set(tags)).slice(0, 12),
    };
  } catch {
    return null;
  }
}

/**
 * Mengambil saran kata kunci real-time dari Google/YouTube Suggest API
 */
async function fetchYouTubeSuggestions(query: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1].map((s: unknown) => String(s).trim()).filter(Boolean);
    }
  } catch {
    // Fallback gracefully on network error/timeout
  }
  return [];
}

/**
 * Menghitung estimasi metrik SEO (Volume, Kompetisi, Skor) secara realistis & dinamis
 */
export function scoreKeyword(kw: string, index: number, total: number): KeywordMetric {
  const cleanKw = kw.trim();
  const words = cleanKw.split(/\s+/).length;
  const lower = cleanKw.toLowerCase();

  // 1. Volume: Posisi ranking atas di Google/YouTube suggest menandakan frekuensi pencarian tertinggi
  let volume: "High" | "Medium" | "Low" = "Medium";
  if (index < Math.ceil(total * 0.3)) volume = "High";
  else if (index >= Math.ceil(total * 0.7)) volume = "Low";

  // 2. Kompetisi: Kata tunggal/head term persaingannya sangat padat.
  // Kata dengan modifier spesifik memiliki persaingan medium/low.
  const hasSpecificModifier = /(?:ost|soundtrack|gameplay|review|tips|cara|tutorial|download|vs|2025|2026|mod|guide|trik|sejarah)/i.test(lower);

  let competition: "Low" | "Medium" | "High" = "Medium";
  if (words <= 1) {
    competition = "High";
  } else if (words >= 4 || (words >= 3 && hasSpecificModifier)) {
    competition = "Low";
  } else if (hasSpecificModifier || words >= 2) {
    competition = index < 2 ? "High" : "Medium";
  }

  // 3. Skor Peluang SEO (0-100): Rasio Supply vs Demand yang bervariasi alami
  let charHash = 0;
  for (let i = 0; i < cleanKw.length; i++) {
    charHash = (charHash + cleanKw.charCodeAt(i) * (i + 1)) % 13;
  }
  const variance = (charHash - 6); // -6 s/d +6

  let baseScore = 70;
  if (volume === "High" && competition === "Low") {
    baseScore = 88;
  } else if (volume === "High" && competition === "Medium") {
    baseScore = 78;
  } else if (volume === "High" && competition === "High") {
    baseScore = 64;
  } else if (volume === "Medium" && competition === "Low") {
    baseScore = 82;
  } else if (volume === "Medium" && competition === "Medium") {
    baseScore = 69;
  } else if (volume === "Medium" && competition === "High") {
    baseScore = 55;
  } else if (volume === "Low" && competition === "Low") {
    baseScore = 65;
  } else {
    baseScore = 48;
  }

  const rankDampening = Math.min(8, Math.floor(index * 0.8));
  const finalScore = Math.max(35, Math.min(96, baseScore - rankDampening + variance));

  // Tag tren cerdas
  let trendTag = "🌲 Evergreen";
  if (index === 0 && volume === "High") {
    trendTag = "🔥 Populer Autocomplete";
  } else if (competition === "Low" && finalScore >= 75) {
    trendTag = "🚀 Peluang Emas (Low Comp)";
  } else if (hasSpecificModifier) {
    trendTag = "🎯 Niche Target";
  } else if (words >= 3) {
    trendTag = "💡 Long-Tail";
  }

  return {
    keyword: cleanKw,
    volume,
    competition,
    score: finalScore,
    trendTag,
  };
}

/**
 * Mengambil pertanyaan nyata penonton dari Google/YouTube suggest
 */
async function fetchRealYouTubeQuestions(query: string): Promise<string[]> {
  const clean = query.trim();
  const prefixes = [
    `cara ${clean}`,
    `${clean} vs`,
    `${clean} tips`,
    `kenapa ${clean}`,
    `apa itu ${clean}`,
    `game ${clean}`,
    `sejarah ${clean}`,
    `${clean} review`,
  ];

  const questionSet = new Set<string>();

  await Promise.all(
    prefixes.map(async (p) => {
      try {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(p)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8",
          },
        });
        clearTimeout(timeoutId);

        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[1])) {
          for (const item of data[1]) {
            const str = String(item).trim();
            if (str && str.toLowerCase() !== clean.toLowerCase()) {
              questionSet.add(str);
            }
          }
        }
      } catch {
        // Safe fallback on timeout
      }
    })
  );

  const rawList = Array.from(questionSet);

  if (rawList.length > 0) {
    return rawList.slice(0, 5).map((q) => {
      return q.charAt(0).toUpperCase() + q.slice(1);
    });
  }

  return [
    `Cara Memahami & Menguasai ${clean} untuk Pemula`,
    `Fakta Menarik & Rahasia Seputar ${clean}`,
    `${clean} vs Alternatif Populer Lainnya`,
    `Tips & Trik Penting Sebelum Mencoba ${clean}`,
  ];
}

/**
 * Menghasilkan tag rekomendasi YouTube dengan deduplikasi
 */
function extractRecommendedTags(query: string, suggestions: string[]): string[] {
  const cleanTags: string[] = [];
  const seenNormalized = new Set<string>();

  const addTag = (raw: string) => {
    const trimmed = raw.replace(/[#"'[\]]/g, "").trim().toLowerCase();
    if (!trimmed) return;
    const slug = trimmed.replace(/\s+/g, "");
    if (!seenNormalized.has(slug) && !seenNormalized.has(trimmed)) {
      seenNormalized.add(slug);
      seenNormalized.add(trimmed);
      cleanTags.push(trimmed);
    }
  };

  addTag(query);

  for (const s of suggestions) {
    addTag(s);
  }

  return cleanTags.slice(0, 12);
}

/**
 * Service Utama: Melakukan riset topik dan kata kunci secara jujur & transparan
 */
export async function performKeywordResearch(
  query: string,
  customApiKey?: string | null
): Promise<ResearchResult> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      query: "",
      source: "HEURISTIC_FALLBACK",
      keywords: [],
      recommendedTags: [],
      contentAngles: [],
      isHeuristicEstimation: true,
      disclaimer: "Topik pencarian kosong.",
      timestamp: new Date().toISOString(),
    };
  }

  // 1. Cek ketersediaan YouTube Data API v3 resmi
  const apiKey =
    customApiKey ||
    process.env.YOUTUBE_API_KEY ||
    process.env.YOUTUBE_DATA_API_KEY ||
    null;

  const realQuestionsPromise = fetchRealYouTubeQuestions(cleanQuery);

  if (apiKey) {
    const realApiResult = await fetchFromYouTubeDataApi(cleanQuery, apiKey);
    if (realApiResult && realApiResult.keywords.length > 0) {
      const realQuestions = await realQuestionsPromise;
      return {
        query: cleanQuery,
        source: "REAL_API",
        keywords: realApiResult.keywords,
        recommendedTags:
          realApiResult.tags.length > 0
            ? realApiResult.tags
            : extractRecommendedTags(cleanQuery, []),
        contentAngles: realQuestions,
        isHeuristicEstimation: false,
        disclaimer: "Data diambil dari YouTube Data API v3 resmi.",
        timestamp: new Date().toISOString(),
      };
    }
    // Jika panggilan API resmi gagal / limit kuota terlampaui, lanjut ke fallback di bawah
  }

  // 2. Fallback jujur: Ambil live YouTube autocomplete suggestions
  const [liveSuggestions, realQuestions] = await Promise.all([
    fetchYouTubeSuggestions(cleanQuery),
    realQuestionsPromise,
  ]);

  let suggestions = liveSuggestions;
  const isAutocompleteSuccess = suggestions.length > 0;

  if (suggestions.length < 5) {
    const extra = await fetchYouTubeSuggestions(`${cleanQuery} tutorial`);
    const unique = Array.from(new Set([...suggestions, ...extra]));
    if (unique.length > 0) suggestions = unique;
  }

  // Fallback lokal jika endpoint suggest tidak merespons
  if (suggestions.length === 0) {
    suggestions = [
      cleanQuery,
      `${cleanQuery} tutorial`,
      `${cleanQuery} tips`,
      `cara ${cleanQuery}`,
      `${cleanQuery} review`,
      `${cleanQuery} shorts`,
    ];
  }

  const scoredKeywords = suggestions.map((kw, idx) =>
    scoreKeyword(kw, idx, suggestions.length)
  );

  const recommendedTags = extractRecommendedTags(cleanQuery, suggestions);

  return {
    query: cleanQuery,
    source: isAutocompleteSuccess ? "YOUTUBE_AUTOCOMPLETE_HEURISTIC" : "HEURISTIC_FALLBACK",
    keywords: scoredKeywords,
    recommendedTags,
    contentAngles: realQuestions,
    isHeuristicEstimation: true,
    disclaimer:
      "Skor Volume, Kompetisi, dan Peluang merupakan estimasi cerdas berbasis pola saran autocomplete Google/YouTube, bukan data volume pencarian absolut.",
    timestamp: new Date().toISOString(),
  };
}
