import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getBaseEmailTemplate, escapeHtml } from "@/lib/emailTemplates";
import { notifyUser } from "@/lib/notifications";
import { logEmailDelivery } from "@/lib/emailLog";
import { NotificationType } from "@prisma/client";

export async function POST(req: Request) {
  return handleCron(req);
}

export async function GET(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret") || authHeader.replace(/^Bearer\s+/i, "").trim();

  const expectedSecret = process.env.CRON_SECRET || "promptgen_cron_internal_secret";
  if (secret !== expectedSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  const now = new Date();
  const dayInMs = 24 * 60 * 60 * 1000;
  const in8Days = new Date(now.getTime() + 8 * dayInMs);
  const yesterday = new Date(now.getTime() - dayInMs);

  try {
    // Cari user dengan langganan aktif yang akan habis dalam 7 hari atau baru saja habis kemarin
    const users = await prisma.user.findMany({
      where: {
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: {
          gte: yesterday,
          lte: in8Days,
        },
      },
      include: {
        currentPlan: true,
      },
    });

    let processed = 0;
    let sent = 0;
    let skipped = 0;

    for (const user of users) {
      if (!user.subscriptionExpiresAt) continue;
      processed++;

      const msDiff = user.subscriptionExpiresAt.getTime() - now.getTime();
      const daysLeft = Math.ceil(msDiff / dayInMs);

      // Cek apakah sudah pernah dikirimi email pengingat dalam 20 jam terakhir
      const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
      const recentLog = await prisma.emailLog.findFirst({
        where: {
          userId: user.id,
          templateType: "SUBSCRIPTION_REMINDER",
          createdAt: { gte: twentyHoursAgo },
        },
      });

      if (recentLog) {
        skipped++;
        continue;
      }

      const planName = user.currentPlan?.name || "Paket Langganan";
      const isExpired = daysLeft <= 0;
      const subject = isExpired
        ? `[Prompt Gen] Langganan ${planName} Anda Telah Berakhir`
        : `[Prompt Gen] Pengingat: Langganan ${planName} Anda Berakhir dalam ${daysLeft} Hari`;

      const bodyHtml = getBaseEmailTemplate(
        `
        <p>Halo <strong>${escapeHtml(user.name)}</strong>,</p>
        <p>${
          isExpired
            ? `Masa aktif langganan <strong>${escapeHtml(planName)}</strong> Anda telah berakhir hari ini. Beberapa channel mungkin akan terkunci secara otomatis.`
            : `Masa aktif langganan <strong>${escapeHtml(planName)}</strong> Anda akan segera berakhir dalam <strong>${daysLeft} hari</strong>.`
        }</p>
        <p>Untuk memastikan alur kreasi naskah dan akses seluruh channel Anda tetap berjalan lancar tanpa gangguan, silakan lakukan perpanjangan paket langganan Anda.</p>
        <div class="button-container">
          <a href="${process.env.NEXTAUTH_URL || "https://promptgen.com"}/id/dashboard/pricing" class="button">
            ${isExpired ? "Aktifkan Kembali Langganan &rarr;" : "Perpanjang Sekarang &rarr;"}
          </a>
        </div>
        `,
        subject
      );

      const emailResult = await sendEmail({
        to: user.email,
        subject,
        html: bodyHtml,
      });

      await logEmailDelivery({
        userId: user.id,
        recipient: user.email,
        subject,
        templateType: "SUBSCRIPTION_REMINDER",
        status: emailResult.success ? "SUCCESS" : "FAILED",
        error: emailResult.error,
      });

      // Tambahkan notifikasi in-app
      await notifyUser(
        user.id,
        isExpired
          ? NotificationType.SUBSCRIPTION_EXPIRED
          : NotificationType.SUBSCRIPTION_EXPIRING_SOON,
        subject,
        isExpired
          ? `Masa aktif paket ${planName} Anda telah berakhir. Perpanjang sekarang untuk membuka kunci channel.`
          : `Paket ${planName} Anda akan berakhir dalam ${daysLeft} hari. Perpanjang untuk mempertahankan channel aktif.`,
        "/dashboard/pricing"
      );

      sent++;
    }

    return NextResponse.json({
      success: true,
      processed,
      sent,
      skipped,
      timestamp: now.toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error("CRON subscription-reminders error:", error);
    return NextResponse.json({ error: "Failed to run reminder cron" }, { status: 500 });
  }
}
