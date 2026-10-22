import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { encryptSecret, googleDriveAad } from "@/lib/crypto";
import { logAdminAction } from "@/lib/auditLog";

function getPublicRedirectUrl(path: string, req: Request): URL {
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
  if (redirectUri) {
    try {
      const parsed = new URL(redirectUri);
      return new URL(path, parsed.origin);
    } catch {}
  }
  if (process.env.NEXTAUTH_URL) {
    return new URL(path, process.env.NEXTAUTH_URL.replace(/\/$/, ""));
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) {
    return new URL(path, `${proto}://${host}`);
  }
  return new URL(path, req.url);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value || "id";
  const locale = ["id", "en"].includes(localeCookie) ? localeCookie : "id";
  const redirectBase = `/${locale}/dashboard/settings`;

  const csrfToken = cookieStore.get("gdrive_csrf")?.value;
  // Hapus cookie CSRF segera (one-time use)
  cookieStore.delete("gdrive_csrf");

  if (errorParam) {
    return NextResponse.redirect(
      getPublicRedirectUrl(`${redirectBase}?gdrive=error&reason=${encodeURIComponent(errorParam)}`, req)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      getPublicRedirectUrl(`${redirectBase}?gdrive=error&reason=missing_code`, req)
    );
  }

  // Verifikasi CSRF token
  if (!csrfToken || csrfToken !== state) {
    return NextResponse.redirect(
      getPublicRedirectUrl(`${redirectBase}?gdrive=error&reason=csrf_mismatch`, req)
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(getPublicRedirectUrl(`/${locale}/auth`, req));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      getPublicRedirectUrl(`${redirectBase}?gdrive=error&reason=not_configured`, req)
    );
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[GoogleDrive OAuth Callback] Exchange error:", errText);
      return NextResponse.redirect(
        getPublicRedirectUrl(`${redirectBase}?gdrive=error&reason=exchange_failed`, req)
      );
    }

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;
    const scope = tokenData.scope || "https://www.googleapis.com/auth/drive.file";

    if (!accessToken) {
      return NextResponse.redirect(
        getPublicRedirectUrl(`${redirectBase}?gdrive=error&reason=missing_token`, req)
      );
    }

    const aad = googleDriveAad(session.user.id);
    const encryptedAccess = encryptSecret(accessToken, aad);

    let encryptedRefresh = "";
    if (refreshToken) {
      encryptedRefresh = encryptSecret(refreshToken, aad);
    } else {
      const existing = await prisma.userGoogleDriveToken.findUnique({
        where: { userId: session.user.id },
      });
      if (existing?.encryptedRefresh) {
        encryptedRefresh = existing.encryptedRefresh;
      }
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.userGoogleDriveToken.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        encryptedAccess,
        encryptedRefresh: encryptedRefresh || "",
        expiresAt,
        scopes: scope,
      },
      update: {
        encryptedAccess,
        ...(encryptedRefresh ? { encryptedRefresh } : {}),
        expiresAt,
        scopes: scope,
      },
    });

    await logAdminAction({
      actorId: session.user.id,
      action: "GOOGLE_DRIVE_CONNECTED",
      targetType: "UserGoogleDriveToken",
      targetId: session.user.id,
    });

    return NextResponse.redirect(
      getPublicRedirectUrl(`${redirectBase}?gdrive=connected`, req)
    );
  } catch (error) {
    console.error("[GoogleDrive OAuth Callback] Unexpected error:", error);
    return NextResponse.redirect(
      getPublicRedirectUrl(`${redirectBase}?gdrive=error&reason=server_error`, req)
    );
  }
}
