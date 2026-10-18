import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { applyRateLimit } from "@/lib/rateLimit";
import { revokeGoogleDriveToken } from "@/lib/googleDrive";
import { logAdminAction } from "@/lib/auditLog";
import { getApiTranslator } from "@/lib/apiI18n";

export async function POST() {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  // Rate limit: 5 requests per 60 seconds per user
  const allowed = await applyRateLimit(`gdrive_disconnect_${session.user.id}`, 5, 60);
  if (!allowed) {
    return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
  }

  try {
    await revokeGoogleDriveToken(session.user.id);

    await logAdminAction({
      actorId: session.user.id,
      action: "GOOGLE_DRIVE_DISCONNECTED",
      targetType: "UserGoogleDriveToken",
      targetId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GoogleDrive Disconnect Route] Disconnect failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : t("systemError") },
      { status: 500 }
    );
  }
}
