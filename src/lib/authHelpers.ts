import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

/**
 * Standard Server-Component Route Protection Guard for Layouts.
 * Ensures session exists, registration status is approved, and user role matches requirement.
 */
export async function requireRole(allowedRoles: Role | Role[], locale: string = "id") {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(`/${locale}/auth`);
  }

  // Enforce registration approval status
  const userObj = session.user as any;
  if (userObj.registrationStatus && userObj.registrationStatus !== "APPROVED") {
    redirect(`/${locale}/auth`);
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.user.role as Role)) {
    // If regular user attempts to access admin layout, redirect to user dashboard
    if (session.user.role === "USER") {
      redirect(`/${locale}/dashboard`);
    }
    redirect(`/${locale}/auth`);
  }

  return session;
}
