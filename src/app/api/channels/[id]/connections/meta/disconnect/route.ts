import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { disconnectChannelMeta } from "@/lib/channelSocial";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(
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

  const success = await disconnectChannelMeta(channelId, session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Failed to disconnect or channel not found" }, { status: 400 });
  }

  await logAdminAction({
    actorId: session.user.id,
    action: "SYSTEM_SETTING_UPDATED",
    targetType: "ChannelSocialConnection_Meta",
    targetId: channelId,
  });

  return NextResponse.json({ success: true, message: "Meta disconnected successfully" });
}
