import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const body = await req.json();
    const { channelId, type, titles } = body;

    if (!channelId || !type || (type !== "VIDEO" && type !== "IMAGE") || !Array.isArray(titles)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (titles.length > 200) {
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

    // Fetch existing titles to dedupe
    const existingDrafts = await prisma.draft.findMany({
      where: { channelId, type },
      select: { title: true }
    });
    
    const existingTitlesSet = new Set(
      existingDrafts.filter(d => d.title).map(d => d.title!.trim().toLowerCase())
    );

    let importedCount = 0;
    const newTitlesSet = new Set<string>();

    for (const rawTitle of titles) {
      const title = rawTitle.toString().trim();
      if (!title) continue;
      
      const lowerTitle = title.toLowerCase();
      if (!existingTitlesSet.has(lowerTitle) && !newTitlesSet.has(lowerTitle)) {
        newTitlesSet.add(lowerTitle);
        
        await prisma.draft.create({
          data: {
            userId: session.user.id,
            channelId: channelId,
            type: type,
            title: title,
            rawJson: JSON.stringify({ judul_konten: title }),
            parsedData: { judul_konten: title },
            wordCount: 0,
            estimatedDurationSec: 0
          }
        });
        importedCount++;
      }
    }

    return NextResponse.json({ success: true, importedCount }, { status: 200 });

  } catch (error) {
    console.error("Import titles error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
