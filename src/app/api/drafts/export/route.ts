import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { DraftType } from "@prisma/client";
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

    const draftType = type as DraftType;

    if (session.user.role !== "SUPERADMIN") {
      if (!channelId) {
        return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
      }
      const channel = await prisma.profileChannel.findUnique({ where: { id: channelId } });
      if (!channel || channel.userId !== session.user.id) {
        return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
      }
    }

    // Fix arsitektur: baca dari UsedTitle (permanen) bukan Draft
    // Tambah fallback: UNION dengan Draft.title untuk data historis sebelum migrasi
    const whereClause = channelId
      ? { channelId, type: draftType }
      : { type: draftType };

    const [usedTitles, draftTitles] = await Promise.all([
      // Sumber utama: UsedTitle (permanen, tidak terhapus bersama draft)
      prisma.usedTitle.findMany({
        where: whereClause,
        select: { id: true, title: true, type: true, createdAt: true },
        orderBy: { createdAt: "desc" }
      }),
      // Fallback historis: Draft yang punya title dan konten nyata (wordCount > 0)
      // untuk data sebelum migrasi, agar tidak ada gap
      prisma.draft.findMany({
        where: {
          ...whereClause,
          title: { not: null },
          wordCount: { gt: 0 }
        },
        select: { id: true, title: true, type: true, createdAt: true },
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Deduplicate: UsedTitle is authoritative, Draft titles fill in historical gaps
    const seenTitles = new Set<string>();
    const merged: Array<{ id: string; title: string | null; type: string; createdAt: Date }> = [];

    for (const ut of usedTitles) {
      const key = ut.title.toLowerCase();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        merged.push(ut);
      }
    }
    for (const d of draftTitles) {
      if (!d.title) continue;
      const key = d.title.toLowerCase();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        merged.push(d);
      }
    }

    if (format === "json") {
      return NextResponse.json({ titles: merged }, { status: 200 });
    }

    // CSV format
    const csvLines = ["title,type,created_at,id"];
    for (const d of merged) {
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
