import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
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
      await prisma.user.update({ where: { id }, data: { role } });
      return NextResponse.json({ success: true, message: t("roleUpdated") });
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

      await prisma.user.update({
        where: { id },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionExpiresAt: newExpiry
        }
      });
      
      const { enforceChannelLimits } = await import("@/lib/channelLockLogic");
      await enforceChannelLimits(id);
      
      return NextResponse.json({ success: true, message: t("daysAdded").replace("{days}", daysToAdd.toString()) });
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
      
      return NextResponse.json({ success: true, message: t("planUpdated") });
    }

    if (action === "RESET_PASSWORD" && newPassword) {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id }, data: { passwordHash } });
      return NextResponse.json({ success: true, message: t("passwordReset") });
    }

    return NextResponse.json({ error: t("unknownAction") }, { status: 400 });

  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: t("failProcessUserAction") }, { status: 500 });
  }
}
