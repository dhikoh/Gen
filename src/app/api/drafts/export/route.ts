import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { Prisma, DraftType } from "@prisma/client";
import { getApiTranslator } from "@/lib/apiI18n";

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const type = searchParams.get("type");
    const format = searchParams.get("format") || "csv"; // csv or json

    if (!type || (type !== "VIDEO" && type !== "IMAGE")) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    let whereClause: Prisma.DraftWhereInput = { type: type as DraftType };

    if (session.user.role !== "SUPERADMIN") {
      if (!channelId) {
         return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
      }
      const channel = await prisma.profileChannel.findUnique({ where: { id: channelId } });
      if (!channel || channel.userId !== session.user.id) {
         return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
      }
      whereClause.channelId = channelId;
    } else {
       if (channelId) {
          whereClause.channelId = channelId;
       }
    }

    const drafts = await prisma.draft.findMany({
      where: whereClause,
      select: {
        title: true,
        type: true,
        createdAt: true,
        id: true,
      },
      orderBy: { createdAt: "desc" }
    });

    if (format === "json") {
      return NextResponse.json({ titles: drafts }, { status: 200 });
    }

    // CSV format
    const csvLines = ["title,type,created_at,draft_id"];
    for (const d of drafts) {
      // Escape quotes in title
      const titleEscaped = d.title ? `"${d.title.replace(/"/g, '""')}"` : '""';
      csvLines.push(`${titleEscaped},${d.type},${d.createdAt.toISOString()},${d.id}`);
    }

    const csvContent = csvLines.join("\n");
    const filename = `export_titles_${type}_${channelId || 'all'}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error("Export titles error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
