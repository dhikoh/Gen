import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { DraftType } from "@prisma/client";
import { getApiTranslator } from "@/lib/apiI18n";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`drafts_export_${session.user.id}_${ip}`, 10, 60);
    if (!isAllowed) return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });

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
      // Fallback historis: Draft yang punya title untuk data sebelum migrasi
      prisma.draft.findMany({
        where: {
          ...whereClause,
          title: { not: null },
        },
        select: { id: true, title: true, type: true, createdAt: true, channelId: true, userId: true },
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Deduplicate & Auto-heal: UsedTitle is authoritative; historical Draft titles are migrated into UsedTitle
    const seenTitles = new Map<string, { id: string; title: string; type: string; createdAt: Date }>();

    for (const ut of usedTitles) {
      const key = ut.title.trim().toLowerCase();
      if (!seenTitles.has(key)) {
        seenTitles.set(key, {
          id: ut.id,
          title: ut.title,
          type: ut.type,
          createdAt: ut.createdAt,
        });
      }
    }

    for (const d of draftTitles) {
      if (!d.title || !d.title.trim()) continue;
      const cleanTitle = d.title.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().substring(0, 500);
      if (!cleanTitle) continue;
      const key = cleanTitle.toLowerCase();
      if (!seenTitles.has(key)) {
        // Auto-heal / Auto-migrate: Daftarkan ke UsedTitle permanen agar ID valid untuk aksi edit & hapus
        if (d.channelId && d.userId) {
          try {
            const createdUt = await prisma.usedTitle.upsert({
              where: {
                channelId_type_title: {
                  channelId: d.channelId,
                  type: d.type,
                  title: cleanTitle,
                },
              },
              create: {
                userId: d.userId,
                channelId: d.channelId,
                type: d.type,
                title: cleanTitle,
                createdAt: d.createdAt,
              },
              update: {},
            });
            seenTitles.set(key, {
              id: createdUt.id,
              title: createdUt.title,
              type: createdUt.type,
              createdAt: createdUt.createdAt,
            });
            continue;
          } catch {
            // Abaikan jika error dan gunakan record draft fallback
          }
        }

        seenTitles.set(key, {
          id: d.id,
          title: cleanTitle,
          type: d.type,
          createdAt: d.createdAt,
        });
      }
    }

    const merged = Array.from(seenTitles.values());
    // Urutkan kronologis secara tegas: terbaru paling atas (descending)
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
