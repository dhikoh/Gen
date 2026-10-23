import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/db";

const BASE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
];

const CHANNEL_SCOPES = [
  ...BASE_SCOPES,
  "https://www.googleapis.com/auth/youtube.upload",
];

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");

  if (channelId) {
    const channel = await prisma.profileChannel.findFirst({
      where: { id: channelId, userId: session.user.id },
    });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found or unauthorized" }, { status: 404 });
    }
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Google Drive not configured" }, { status: 503 });
  }

  // CSRF protection: random token disimpan di httpOnly cookie
  const csrfToken = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("gdrive_csrf", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 menit cukup untuk flow OAuth
    path: "/",
  });

  if (channelId) {
    cookieStore.set("gdrive_channel_id", channelId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
  } else {
    cookieStore.delete("gdrive_channel_id");
  }

  const scopes = channelId ? CHANNEL_SCOPES : BASE_SCOPES;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: csrfToken,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
