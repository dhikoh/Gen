import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { performKeywordResearch } from "@/lib/researchService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
          source: "HEURISTIC",
          keywords: [],
          recommendedTags: [],
          contentAngles: [],
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await performKeywordResearch(query);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data riset tren" },
      { status: 500 }
    );
  }
}
