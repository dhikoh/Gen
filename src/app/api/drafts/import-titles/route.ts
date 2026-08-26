import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { applyRateLimit } from "@/lib/rateLimit";
import { DraftType } from "@prisma/client";

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`import_titles_${session.user.id}_${ip}`, 10, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const body = await req.json();
    const { channelId, type, titles } = body;

    if (!channelId || !type || (type !== "VIDEO" && type !== "IMAGE") || !titles) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let titleList: string[] = [];
    if (Array.isArray(titles)) {
      titleList = titles;
    } else if (typeof titles === "string") {
      const trimmed = titles.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const jsonArr = JSON.parse(trimmed);
          if (Array.isArray(jsonArr)) {
            titleList = jsonArr;
          }
        } catch {
          titleList = trimmed.split("\n");
        }
      } else {
        titleList = trimmed.split("\n");
      }
    }

    if (titleList.length === 0) {
      return NextResponse.json({ error: "No titles provided" }, { status: 400 });
    }

    if (titleList.length > 200) {
      return NextResponse.json({ error: "Max 200 titles per request" }, { status: 400 });
    }

    // Verify channel ownership
    const channel = await prisma.profileChannel.findUnique({ where: { id: channelId } });
    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized for this channel" }, { status: 403 });
    }

    // Active sub check
    const { requireActiveSubscription } = await import("@/lib/subscription");
    const subCheck = await requireActiveSubscription(session.user.id);
    if (!subCheck) {
      return NextResponse.json({ error: t("inactiveSub") }, { status: 403 });
    }

    const draftType = type as DraftType;
    let importedCount = 0;

    for (const rawTitle of titleList) {
      const title = rawTitle.toString().trim();
      if (!title) continue;

      // Fix arsitektur: tulis ke UsedTitle (permanen), bukan Draft
      // Gunakan upsert agar idempotent — tidak error jika judul sudah ada
      const result = await prisma.usedTitle.upsert({
        where: {
          channelId_type_title: {
            channelId,
            type: draftType,
            title,
          },
        },
        create: {
          userId: session.user.id,
          channelId,
          type: draftType,
          title,
        },
        update: {}, // Sudah ada, tidak perlu update apapun
      });

      // Hitung hanya yang baru dibuat (bukan yang sudah ada)
      if (result) importedCount++;
    }

    return NextResponse.json({ success: true, importedCount }, { status: 200 });

  } catch (error) {
    console.error("Import titles error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
