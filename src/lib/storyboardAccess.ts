import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { hasFeature } from "@/lib/planFeatures";
import { requireActiveSubscription } from "@/lib/subscription";

export type StoryboardErrorCode =
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "SUBSCRIPTION_INACTIVE"
  | "FEATURE_LOCKED"
  | "DRAFT_NOT_FOUND"
  | "INVALID_INPUT"
  | "FILE_TOO_LARGE"
  | "INVALID_IMAGE"
  | "TOO_MANY_PANELS"
  | "QUOTA_EXCEEDED"
  | "STORAGE_ERROR"
  | "SERVER_ERROR";

export function storyboardError(status: number, errorCode: StoryboardErrorCode): NextResponse {
  return NextResponse.json({ error: errorCode, errorCode }, { status });
}

export type StoryboardAccess =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Cek berurutan: login → langganan aktif → fitur storyboardStudio ada di paket (superadmin selalu boleh).
 * Dipakai oleh semua route yang MENULIS data storyboard.
 */
export async function checkStoryboardAccess(): Promise<StoryboardAccess> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { ok: false, response: storyboardError(401, "UNAUTHORIZED") };

  try {
    await requireActiveSubscription(userId);
  } catch {
    return { ok: false, response: storyboardError(403, "SUBSCRIPTION_INACTIVE") };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, currentPlan: { select: { features: true } } },
  });
  if (!dbUser) return { ok: false, response: storyboardError(401, "UNAUTHORIZED") };

  const isSuperadmin = dbUser.role === "SUPERADMIN";
  const rawFeatures = (dbUser.currentPlan?.features as Record<string, boolean>) ?? {};
  if (!hasFeature(rawFeatures, "storyboardStudio", isSuperadmin)) {
    return { ok: false, response: storyboardError(403, "FEATURE_LOCKED") };
  }
  return { ok: true, userId };
}
