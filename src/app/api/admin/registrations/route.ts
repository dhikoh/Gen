import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
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
        registrationStatus: statusParam as any
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

    // Atomic update with WHERE guard for idempotency
    const updateResult = await prisma.user.updateMany({
      where: {
        id: userId,
        registrationStatus: "PENDING_APPROVAL"
      },
      data: {
        registrationStatus: newStatus,
        approvedAt: action === "APPROVE" ? new Date() : null
      }
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: t("registrationAlreadyProcessed") }, { status: 400 });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT
    });

    await notifyUser(
      targetUser.id,
      action === "APPROVE" ? "REGISTRATION_APPROVED" : "REGISTRATION_REJECTED",
      action === "APPROVE" ? "Pendaftaran Disetujui" : "Pendaftaran Ditolak",
      action === "APPROVE"
        ? "Akun Anda telah disetujui oleh admin. Silakan masuk untuk menggunakan aplikasi."
        : "Mohon maaf, pendaftaran akun Anda belum disetujui oleh admin.",
      "/auth"
    );

    // Send email notification asynchronously
    if (action === "APPROVE") {
      sendEmail({
        to: targetUser.email,
        subject: "Pendaftaran Disetujui - Prompt Gen",
        html: `<p>Halo ${targetUser.name},</p><p>Pendaftaran akun Anda di <strong>Prompt Gen</strong> telah disetujui oleh admin. Anda sekarang dapat masuk ke dashboard dan mulai menggunakan aplikasi.</p>`
      }).catch(err => console.error("Registration approval email fail:", err));
    } else {
      sendEmail({
        to: targetUser.email,
        subject: "Pendaftaran Ditolak - Prompt Gen",
        html: `<p>Halo ${targetUser.name},</p><p>Mohon maaf, pendaftaran akun Anda di <strong>Prompt Gen</strong> belum dapat disetujui oleh admin saat ini.</p>`
      }).catch(err => console.error("Registration rejection email fail:", err));
    }

    const messageKey = action === "APPROVE" ? "approveRegistrationSuccess" : "rejectRegistrationSuccess";
    return NextResponse.json({ success: true, message: t(messageKey as any), user: updatedUser });

  } catch (error) {
    console.error("POST registration approval error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
