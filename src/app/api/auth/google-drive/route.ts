import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Google Drive not configured" }, { status: 503 });
  }

  // CSRF protection: random token disimpan di httpOnly cookie
  // JANGAN pakai userId sebagai state — userId bisa ditebak
  const csrfToken = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("gdrive_csrf", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 menit cukup untuk flow OAuth
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: csrfToken, // random token, BUKAN userId
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
