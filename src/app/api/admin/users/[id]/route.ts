import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcrypt";

const updateUserSchema = z.object({
  action: z.enum(["UPDATE_ROLE", "ADD_DAYS", "UPDATE_PLAN", "RESET_PASSWORD"]),
  role: z.enum(["USER", "SUPERADMIN"]).optional(),
  daysToAdd: z.number().optional(),
  planId: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const { id } = await params;
    if (session.user.id === id) {
      return NextResponse.json({ error: t("cantDeleteSelf") }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
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
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

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
    if (!session || session.user.role !== "SUPERADMIN") return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    if (body.action === "UPDATE_PROFILE") {
      const parsedData = updateProfileSchema.safeParse(body);
      if (!parsedData.success) {
        return NextResponse.json({ error: t("invalidData") }, { status: 400 });
      }

      const { name, username, email, phoneNumber, dateOfBirth } = parsedData.data;

      // Unique check
      const existingUser = await prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
            ...(username ? [{ username: { equals: username, mode: 'insensitive' as const } }] : []),
            ...(phoneNumber ? [{ phoneNumber }] : [])
          ]
        }
      });

      if (existingUser) {
        if (email && existingUser.email.toLowerCase() === email.toLowerCase()) {
          return NextResponse.json({ error: t("emailUsed") }, { status: 409 });
        }
        if (username && existingUser.username.toLowerCase() === username.toLowerCase()) {
          return NextResponse.json({ error: t("usernameUsed") }, { status: 409 });
        }
        return NextResponse.json({ error: t("phoneUsed") }, { status: 409 });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(username && { username }),
          ...(email && { email }),
          ...(phoneNumber !== undefined && { phoneNumber: phoneNumber || null }),
          ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        },
        select: SAFE_USER_SELECT
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
      
      return NextResponse.json({ success: true, message: t("daysAdded").replace("{days}", daysToAdd.toString()), user: updatedUser });
    }

    if (action === "UPDATE_PLAN" && planId) {
      await prisma.user.update({
        where: { id },
        data: {
          currentPlanId: planId,
          subscriptionStatus: "ACTIVE", 
        }
      });

      // Validasi exp, jika null maka set 30 hari default
      if (!targetUser.subscriptionExpiresAt || targetUser.subscriptionExpiresAt < new Date()) {
         await prisma.user.update({
            where: { id },
            data: { subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
         });
      }

      const { enforceChannelLimits } = await import("@/lib/channelLockLogic");
      await enforceChannelLimits(id);
      
      const updatedUser = await prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT });
      return NextResponse.json({ success: true, message: t("planUpdated"), user: updatedUser });
    }

    if (action === "RESET_PASSWORD" && newPassword) {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      const updatedUser = await prisma.user.update({ where: { id }, data: { passwordHash }, select: SAFE_USER_SELECT });
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
