import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { applyRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireActiveSubscription, SubscriptionInactiveError } from "@/lib/subscription";
import { DraftType } from "@prisma/client";
import { z } from "zod";

const importTitlesSchema = z.object({
  channelId: z.string().min(1),
  type: z.nativeEnum(DraftType),
  titles: z.union([
    z.array(z.string().max(500)).max(1000),
    z.string().max(500_000),
  ]),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`import_titles_${session.user.id}_${ip}`, 10, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    // P1-9: Enforce max payload size (1MB)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
      return NextResponse.json({ error: t("payloadTooLarge") }, { status: 413 });
    }

    const body = await req.json();
    const parsed = importTitlesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { channelId, type, titles } = parsed.data;

    let rawTitleList: string[] = [];
    if (Array.isArray(titles)) {
      rawTitleList = titles;
    } else if (typeof titles === "string") {
      const trimmed = titles.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const jsonArr = JSON.parse(trimmed);
          if (Array.isArray(jsonArr)) {
            rawTitleList = jsonArr.map((item) => String(item));
          } else {
            rawTitleList = trimmed.split("\n");
          }
        } catch {
          rawTitleList = trimmed.split("\n");
        }
      } else {
        rawTitleList = trimmed.split("\n");
      }
    }

    if (rawTitleList.length === 0) {
      return NextResponse.json({ error: t("noTitlesProvided") }, { status: 400 });
    }

    // P1-9: Max 1000 titles per import
    if (rawTitleList.length > 1000) {
      return NextResponse.json({ error: t("maxTitlesExceeded") }, { status: 400 });
    }

    // Verify channel ownership
    const channel = await prisma.profileChannel.findUnique({ where: { id: channelId } });
    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
    }

    // Active sub check (P1-4)
    try {
      await requireActiveSubscription(session.user.id);
    } catch (err: unknown) {
      if (err instanceof SubscriptionInactiveError) {
        return NextResponse.json({ error: t("subscriptionInactive") }, { status: 403 });
      }
      return NextResponse.json({ error: t("inactiveSub") }, { status: 403 });
    }

    const draftType = type as DraftType;
    let importedCount = 0;

    for (const rawTitle of rawTitleList) {
      // P1-9 & P1-15: Sanitize title (strip control chars, trim, truncate to 500 chars)
      const cleanTitle = rawTitle
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .trim()
        .substring(0, 500);

      if (!cleanTitle) continue;

      // Fix arsitektur: tulis ke UsedTitle (permanen), bukan Draft
      // Gunakan upsert agar idempotent — tidak error jika judul sudah ada
      const result = await prisma.usedTitle.upsert({
        where: {
          channelId_type_title: {
            channelId,
            type: draftType,
            title: cleanTitle,
          },
        },
        create: {
          userId: session.user.id,
          channelId,
          type: draftType,
          title: cleanTitle,
        },
        update: {},
      });

      if (result) importedCount++;
    }

    return NextResponse.json({ success: true, importedCount }, { status: 200 });
  } catch (error) {
    console.error("Import titles error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
