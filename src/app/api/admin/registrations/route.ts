import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { RegistrationStatus } from "@prisma/client";
import { getApiTranslator } from "@/lib/apiI18n";
import { getTranslations } from "next-intl/server";
import { sendEmail } from "@/lib/email";
import { notifyUser } from "@/lib/notifications";

export async function GET(req: Request) {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") || "PENDING_APPROVAL";

  try {
    const users = await prisma.user.findMany({
      where: {
        registrationStatus: statusParam as RegistrationStatus
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

  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
  }

  try {
    const { userId, action } = await req.json();

    if (!userId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // Auto-assign DEMO plan for 3 days on approval if user has no plan
    let demoPlanId: string | undefined = undefined;
    let subscriptionExpiresAt: Date | undefined = undefined;

    if (action === "APPROVE") {
      const demoPlan = await prisma.plan.findUnique({ where: { code: "DEMO" } });
      if (demoPlan) {
        demoPlanId = demoPlan.id;
        const ends = new Date();
        ends.setDate(ends.getDate() + 3);
        subscriptionExpiresAt = ends;
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
          subscriptionStatus: "ACTIVE",
          currentPlanId: demoPlanId || targetUser.currentPlanId,
          subscriptionExpiresAt: subscriptionExpiresAt || targetUser.subscriptionExpiresAt,
        } : {})
      }
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: t("registrationAlreadyProcessed") }, { status: 400 });
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

    // Send email notification asynchronously
    if (action === "APPROVE") {
      sendEmail({
        to: targetUser.email,
        subject: emailT("regApproveSubject"),
        html: `<p>${emailT("regApproveBody", { name: targetUser.name })}</p>`
      }).catch(err => console.error("Registration approval email fail:", err));
    } else {
      sendEmail({
        to: targetUser.email,
        subject: emailT("regRejectSubject"),
        html: `<p>${emailT("regRejectBody", { name: targetUser.name })}</p>`
      }).catch(err => console.error("Registration rejection email fail:", err));
    }

    const messageKey = action === "APPROVE" ? "approveRegistrationSuccess" : "rejectRegistrationSuccess";
    return NextResponse.json({ success: true, message: t(messageKey as Parameters<typeof t>[0]), user: updatedUser });

  } catch (error) {
    console.error("POST registration approval error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
