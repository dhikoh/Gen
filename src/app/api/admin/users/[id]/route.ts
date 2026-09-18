import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcrypt";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import { logAdminAction } from "@/lib/auditLog";

const updateUserSchema = z.object({
  action: z.enum(["UPDATE_ROLE", "ADD_DAYS", "UPDATE_PLAN", "RESET_PASSWORD"]),
  role: z.enum(["USER", "SUPERADMIN"]).optional(),
  daysToAdd: z.number().optional(),
  planId: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    if (session.user.role !== "SUPERADMIN") return NextResponse.json({ error: t("forbidden") }, { status: 403 });

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`admin_users_del_${session.user.id}_${ip}`, 20, 60);
    if (!isAllowed) return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });

    const { id } = await params;
    if (session.user.id === id) {
      return NextResponse.json({ error: t("cantDeleteSelf") }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { email: true, username: true } });
    if (!target) return NextResponse.json({ error: t("userNotFound") }, { status: 404 });

    await prisma.user.delete({ where: { id } });

    await logAdminAction({
      adminId: session.user.id,
      action: "DELETE_USER",
      targetType: "USER",
      targetId: id,
      metadata: { targetEmail: target.email, targetUsername: target.username }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: t("failDeleteUser") }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    if (session.user.role !== "SUPERADMIN") return NextResponse.json({ error: t("forbidden") }, { status: 403 });

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`admin_users_get_detail_${session.user.id}_${ip}`, 60, 60);
    if (!isAllowed) return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });

    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...SAFE_USER_SELECT,
        currentPlan: true,
        channels: {
          select: {
            id: true,
            channelName: true,
            isLocked: true,
            usageCount: true,
            lastUsedAt: true,
          },
          orderBy: { createdAt: "desc" }
        },
        invoices: {
          select: {
            id: true,
            status: true,
            amount: true,
            method: true,
            createdAt: true,
            reviewedAt: true,
            plan: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 5
        },
      }
    });

    if (!user) {
      return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
    }

    const videoDraftCount = await prisma.draft.count({
      where: { channel: { userId }, type: "VIDEO" }
    });
    
    const imageDraftCount = await prisma.draft.count({
      where: { channel: { userId }, type: "IMAGE" }
    });

    return NextResponse.json({ user, stats: { videoDraftCount, imageDraftCount } }, { status: 200 });
  } catch (error) {
    console.error("Admin User GET API error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().min(8).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    if (session.user.role !== "SUPERADMIN") return NextResponse.json({ error: t("forbidden") }, { status: 403 });

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`admin_users_patch_${session.user.id}_${ip}`, 30, 60);
    if (!isAllowed) return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });

    const { id } = await params;
    const body = await req.json();

    if (body.action === "UPDATE_PROFILE") {
      const parsedData = updateProfileSchema.safeParse(body);
      if (!parsedData.success) {
        return NextResponse.json({ error: t("invalidData") }, { status: 400 });
      }

      const { name, username, email, phoneNumber, dateOfBirth } = parsedData.data;
      const emailLower = email ? email.trim().toLowerCase() : undefined;
      const usernameLower = username ? username.trim().toLowerCase() : undefined;
      const phoneNormalized = phoneNumber ? phoneNumber.replace(/\D/g, "") : undefined;

      // Unique check
      const existingUser = await prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(emailLower ? [{ emailLower }, { email: { equals: email, mode: 'insensitive' as const } }] : []),
            ...(usernameLower ? [{ usernameLower }, { username: { equals: username, mode: 'insensitive' as const } }] : []),
            ...(phoneNormalized ? [{ phoneNormalized }, { phoneNumber }] : [])
          ]
        }
      });

      if (existingUser) {
        if (emailLower && (existingUser.emailLower === emailLower || existingUser.email.toLowerCase() === emailLower)) {
          return NextResponse.json({ error: t("emailUsed") }, { status: 409 });
        }
        if (usernameLower && (existingUser.usernameLower === usernameLower || existingUser.username.toLowerCase() === usernameLower)) {
          return NextResponse.json({ error: t("usernameUsed") }, { status: 409 });
        }
        return NextResponse.json({ error: t("phoneUsed") }, { status: 409 });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(username && { username, usernameLower }),
          ...(email && { email, emailLower }),
          ...(phoneNumber !== undefined && { phoneNumber: phoneNumber || null, phoneNormalized: phoneNormalized || null }),
          ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        },
        select: SAFE_USER_SELECT
      });

      await logAdminAction({
        adminId: session.user.id,
        action: "UPDATE_USER_PROFILE",
        targetType: "USER",
        targetId: id,
        metadata: { updatedFields: Object.keys(parsedData.data) }
      });

      return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
    }

    const parsedData = updateUserSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { action, role, daysToAdd, planId, newPassword } = parsedData.data;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: t("userNotFound") }, { status: 404 });

    if (action === "UPDATE_ROLE" && role) {
      if (session.user.id === id && role === "USER") {
        return NextResponse.json({ error: t("cantRevokeSelf") }, { status: 400 });
      }
      const updatedUser = await prisma.user.update({ where: { id }, data: { role }, select: SAFE_USER_SELECT });

      await logAdminAction({
        adminId: session.user.id,
        action: "UPDATE_USER_ROLE",
        targetType: "USER",
        targetId: id,
        metadata: { oldRole: targetUser.role, newRole: role }
      });

      return NextResponse.json({ success: true, message: t("roleUpdated"), user: updatedUser });
    }

    if (action === "ADD_DAYS" && daysToAdd) {
      const now = new Date();
      const currentExpiry = targetUser.subscriptionExpiresAt;
      let newExpiry = new Date();

      if (currentExpiry && currentExpiry > now) {
        newExpiry = new Date(currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      } else {
        newExpiry = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionExpiresAt: newExpiry
        },
        select: SAFE_USER_SELECT
      });
      
      const { enforceChannelLimits } = await import("@/lib/channelLockLogic");
      await enforceChannelLimits(id);

      await logAdminAction({
        adminId: session.user.id,
        action: "ADD_USER_SUBSCRIPTION_DAYS",
        targetType: "USER",
        targetId: id,
        metadata: { daysAdded: daysToAdd, newExpiry: newExpiry.toISOString() }
      });
      
      return NextResponse.json({ success: true, message: t("daysAdded").replace("{days}", daysToAdd.toString()), user: updatedUser });
    }

    if (action === "UPDATE_PLAN" && planId) {
      const isExpired = !targetUser.subscriptionExpiresAt || targetUser.subscriptionExpiresAt < new Date();
      const newExpiry = isExpired ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : targetUser.subscriptionExpiresAt;

      const updatedUser = await prisma.$transaction(async (tx) => {
        return tx.user.update({
          where: { id },
          data: {
            currentPlanId: planId,
            subscriptionStatus: "ACTIVE",
            ...(isExpired && { subscriptionExpiresAt: newExpiry }),
          },
          select: SAFE_USER_SELECT
        });
      });

      const { enforceChannelLimits } = await import("@/lib/channelLockLogic");
      await enforceChannelLimits(id);

      await logAdminAction({
        adminId: session.user.id,
        action: "UPDATE_USER_PLAN",
        targetType: "USER",
        targetId: id,
        metadata: { oldPlanId: targetUser.currentPlanId, newPlanId: planId }
      });

      return NextResponse.json({ success: true, message: t("planUpdated"), user: updatedUser });
    }

    if (action === "RESET_PASSWORD" && newPassword) {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          mustChangePassword: true,
          passwordChangedAt: new Date()
        },
        select: SAFE_USER_SELECT
      });

      await logAdminAction({
        adminId: session.user.id,
        action: "ADMIN_RESET_PASSWORD",
        targetType: "USER",
        targetId: id,
        metadata: { targetEmail: targetUser.email }
      });

      return NextResponse.json({ success: true, message: t("passwordReset"), user: updatedUser });
    }

    return NextResponse.json({ error: t("unknownAction") }, { status: 400 });

  } catch (error: unknown) {
    console.error("Update user error:", error);
    const errObj = error as { code?: string };
    if (errObj && errObj.code === 'P2002') {
      return NextResponse.json({ error: t("emailUsed") + " / " + t("usernameUsed") }, { status: 409 });
    }
    return NextResponse.json({ error: t("failProcessUserAction") }, { status: 500 });
  }
}
