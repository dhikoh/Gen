import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { getChannelConnectionSummary } from "@/lib/channelSocial";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: channelId } = await params;
  if (!channelId) {
    return NextResponse.json({ error: "Missing channelId" }, { status: 400 });
  }

  const summary = await getChannelConnectionSummary(channelId, session.user.id);
  if (!summary) {
    return NextResponse.json({ error: "Channel not found or unauthorized" }, { status: 404 });
  }

  return NextResponse.json(summary);
}
