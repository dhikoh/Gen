import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { RegistrationStatus } from "@prisma/client";
import { getApiTranslator } from "@/lib/apiI18n";
import { getTranslations } from "next-intl/server";
import { sendEmail } from "@/lib/email";
import { getBaseEmailTemplate, escapeHtml } from "@/lib/emailTemplates";
import { notifyUser } from "@/lib/notifications";
import { enforceChannelLimits } from "@/lib/channelLockLogic";
import { applyRateLimit, getClientIp } from "@/lib/rateLimit";
import { logAdminAction } from "@/lib/auditLog";
import { logEmailDelivery } from "@/lib/emailLog";
import { z } from "zod";

const registrationActionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
});

export async function GET(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }
  if (session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const ip = getClientIp(req);
  const isAllowed = await applyRateLimit(`admin_registrations_${session.user.id}_${ip}`, 60, 60);
  if (!isAllowed) {
    return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status") || "PENDING_APPROVAL";
  const parsedStatus = z.nativeEnum(RegistrationStatus).safeParse(rawStatus);
  const statusParam = parsedStatus.success ? parsedStatus.data : RegistrationStatus.PENDING_APPROVAL;

  try {
    const users = await prisma.user.findMany({
      where: {
        registrationStatus: statusParam
      },
      select: {
        ...SAFE_USER_SELECT,
        registrationStatus: true,
        approvedAt: true,
        channels: {
          select: {
            id: true,
            channelName: true,
            niche: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET registrations error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }
  if (session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("forbidden") }, { status: 403 });
  }

  const ip = getClientIp(req);
  const isAllowed = await applyRateLimit(`admin_registrations_action_${session.user.id}_${ip}`, 30, 60);
  if (!isAllowed) {
    return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = registrationActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }
    const { userId, action } = parsed.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // P0-3: Auto-assign DEMO plan based on demoPlan.trialDays (not hardcoded 3)
    let demoPlanId: string | undefined = undefined;
    let subscriptionExpiresAt: Date | undefined = undefined;
    let grantTrial = false;

    if (action === "APPROVE" && !targetUser.hasUsedTrial) {
      const demoPlan = await prisma.plan.findUnique({ where: { code: "DEMO" } });
      if (demoPlan) {
        demoPlanId = demoPlan.id;
        const ends = new Date();
        const trialDays = demoPlan.trialDays ?? 3;
        ends.setDate(ends.getDate() + trialDays);
        subscriptionExpiresAt = ends;
        grantTrial = true;
      }
    }

    // Atomic update with WHERE guard for idempotency
    const updateResult = await prisma.user.updateMany({
      where: {
        id: userId,
        registrationStatus: "PENDING_APPROVAL"
      },
      data: {
        registrationStatus: newStatus,
        approvedAt: action === "APPROVE" ? new Date() : null,
        ...(action === "APPROVE" ? {
          subscriptionStatus: grantTrial ? "ACTIVE" : targetUser.subscriptionStatus,
          currentPlanId: demoPlanId || targetUser.currentPlanId,
          subscriptionExpiresAt: subscriptionExpiresAt || targetUser.subscriptionExpiresAt,
          hasUsedTrial: grantTrial ? true : targetUser.hasUsedTrial,
        } : {})
      }
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: t("registrationAlreadyProcessed") }, { status: 400 });
    }

    // B-1: Log admin action
    await logAdminAction({
      actorId: session.user.id,
      action: action === "APPROVE" ? "APPROVE_REGISTRATION" : "REJECT_REGISTRATION",
      targetType: "User",
      targetId: userId,
      beforeData: { registrationStatus: targetUser.registrationStatus },
      afterData: { registrationStatus: newStatus, grantTrial },
      ip
    });

    if (action === "APPROVE") {
      await enforceChannelLimits(userId);
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT
    });

    const userLocale = targetUser.preferredLocale || "id";
    const emailT = await getTranslations({ locale: userLocale, namespace: "Emails" });

    await notifyUser(
      targetUser.id,
      action === "APPROVE" ? "REGISTRATION_APPROVED" : "REGISTRATION_REJECTED",
      action === "APPROVE" ? "registrationApprovedTitle" : "registrationRejectedTitle",
      action === "APPROVE" ? "registrationApprovedMsg" : "registrationRejectedMsg",
      "/auth"
    );

    // P0-11: Escape HTML strings inserted into email; P1-12: track email failures
    const safeName = escapeHtml(targetUser.name);
    if (action === "APPROVE") {
      const subject = emailT("regApproveSubject");
      sendEmail({
        to: targetUser.email,
        subject,
        html: getBaseEmailTemplate(`<p>${emailT("regApproveBody", { name: safeName })}</p>`, subject)
      }).then(res => {
        logEmailDelivery({
          userId: targetUser.id,
          recipient: targetUser.email,
          subject,
          templateType: "REGISTRATION_APPROVED",
          status: res.success ? "SUCCESS" : "FAILED",
          error: res.error ? String(res.error) : null
        });
      }).catch(err => {
        console.error("Registration approval email fail:", err);
        logEmailDelivery({
          userId: targetUser.id,
          recipient: targetUser.email,
          subject,
          templateType: "REGISTRATION_APPROVED",
          status: "FAILED",
          error: String(err)
        });
      });
    } else {
      const subject = emailT("regRejectSubject");
      sendEmail({
        to: targetUser.email,
        subject,
        html: getBaseEmailTemplate(`<p>${emailT("regRejectBody", { name: safeName })}</p>`, subject)
      }).then(res => {
        logEmailDelivery({
          userId: targetUser.id,
          recipient: targetUser.email,
          subject,
          templateType: "REGISTRATION_REJECTED",
          status: res.success ? "SUCCESS" : "FAILED",
          error: res.error ? String(res.error) : null
        });
      }).catch(err => {
        console.error("Registration rejection email fail:", err);
        logEmailDelivery({
          userId: targetUser.id,
          recipient: targetUser.email,
          subject,
          templateType: "REGISTRATION_REJECTED",
          status: "FAILED",
          error: String(err)
        });
      });
    }

    const messageKey = action === "APPROVE" ? "approveRegistrationSuccess" : "rejectRegistrationSuccess";
    return NextResponse.json({ success: true, message: t(messageKey as Parameters<typeof t>[0]), user: updatedUser });

  } catch (error) {
    console.error("POST registration approval error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
