import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { performKeywordResearch } from "@/lib/researchService";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import { getApiTranslator } from "@/lib/apiI18n";

export async function GET(req: NextRequest) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`research_trends_${session.user.id}_${ip}`, 20, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    let query = searchParams.get("query")?.trim() || "";
    const channelId = searchParams.get("channelId")?.trim();

    // Jika query kosong tetapi channelId dipilih, gunakan niche channel
    if (!query && channelId) {
      const channel = await prisma.profileChannel.findUnique({
        where: { id: channelId },
        select: { niche: true, channelName: true, userId: true },
      });
      if (channel && channel.userId === session.user.id) {
        query = channel.niche || channel.channelName || "";
      }
    }

    if (!query) {
      return NextResponse.json({
        success: true,
        data: {
          query: "",
          source: "HEURISTIC_FALLBACK",
          keywords: [],
          recommendedTags: [],
          contentAngles: [],
          isHeuristicEstimation: true,
          disclaimer: "Topik pencarian kosong.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Limit maximum query length to prevent abuse
    if (query.length > 200) {
      query = query.substring(0, 200);
    }

    const result = await performKeywordResearch(query);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: t("systemError") },
      { status: 500 }
    );
  }
}
