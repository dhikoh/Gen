import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import { NotificationType, PlanCode } from "@prisma/client";
import { z } from "zod";

const announcementSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi"),
  message: z.string().trim().min(1, "Pesan pengumuman wajib diisi"),
  link: z.string().trim().optional().or(z.literal("")),
  target: z.enum(["ALL", "PLAN", "USER"]),
  targetPlanCode: z.nativeEnum(PlanCode).optional(),
  targetUserId: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const limitRes = await applyRateLimit(ip, 10, 60);
  if (!limitRes) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba beberapa saat lagi." },
      { status: 429 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Akses ditolak. Khusus Superadmin." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = announcementSchema.parse(body);

    let recipientUserIds: string[] = [];

    if (parsed.target === "ALL") {
      const users = await prisma.user.findMany({ select: { id: true } });
      recipientUserIds = users.map((u) => u.id);
    } else if (parsed.target === "PLAN" && parsed.targetPlanCode) {
      const users = await prisma.user.findMany({
        where: { currentPlan: { code: parsed.targetPlanCode } },
        select: { id: true },
      });
      recipientUserIds = users.map((u) => u.id);
    } else if (parsed.target === "USER" && parsed.targetUserId) {
      const user = await prisma.user.findUnique({
        where: { id: parsed.targetUserId },
        select: { id: true },
      });
      if (user) recipientUserIds = [user.id];
    }

    if (recipientUserIds.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada pengguna penerima yang ditemukan untuk kriteria ini." },
        { status: 400 }
      );
    }

    const notificationsData = recipientUserIds.map((userId) => ({
      userId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: parsed.title,
      message: parsed.message,
      link: parsed.link && parsed.link.length > 0 ? parsed.link : null,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    return NextResponse.json({
      success: true,
      recipientCount: recipientUserIds.length,
      message: `Pengumuman berhasil dikirim ke ${recipientUserIds.length} pengguna.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }
    console.error("POST /api/admin/announcements error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim pengumuman sistem." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  try {
    const announcements = await prisma.notification.findMany({
      where: { type: NotificationType.SYSTEM_ANNOUNCEMENT },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        message: true,
        link: true,
        createdAt: true,
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error("GET /api/admin/announcements error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar pengumuman." },
      { status: 500 }
    );
  }
}
