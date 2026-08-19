import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { headers } from "next/headers";

/**
 * Standard Server-Component Route Protection Guard for Layouts.
 * Ensures session exists, registration status is approved, and user role matches requirement.
 */
export async function requireRole(allowedRoles: Role | Role[], locale: string = "id", callbackUrl?: string) {
  const session = await getServerSession(authOptions);

  let targetCallbackUrl = callbackUrl;
  if (!targetCallbackUrl) {
    try {
      const headersList = await headers();
      targetCallbackUrl = headersList.get("x-pathname") || headersList.get("next-url") || undefined;
    } catch {
      // Header reading fallback
    }
  }

  const authRedirectPath = targetCallbackUrl 
    ? `/${locale}/auth?callbackUrl=${encodeURIComponent(targetCallbackUrl)}`
    : `/${locale}/auth`;

  if (!session || !session.user) {
    redirect(authRedirectPath);
  }

  // Enforce registration approval status
  const userObj = session.user as any;
  if (userObj.registrationStatus && userObj.registrationStatus !== "APPROVED") {
    redirect(authRedirectPath);
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.user.role as Role)) {
    // If regular user attempts to access admin layout, redirect to user dashboard
    if (session.user.role === "USER") {
      redirect(`/${locale}/dashboard`);
    }
    // If superadmin attempts to access user dashboard layout, redirect to admin layout
    if (session.user.role === "SUPERADMIN") {
      redirect(`/${locale}/admin`);
    }
    redirect(authRedirectPath);
  }

  return session;
}

