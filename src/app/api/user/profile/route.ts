import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100)
});

export async function PUT(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`user_profile_put_${session.user.id}_${ip}`, 10, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = profileSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsedData.data.name }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`user_profile_del_${session.user.id}_${ip}`, 5, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const body = await req.json();
    const password = body.password;
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password konfirmasi wajib diisi." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
    }

    // Dynamic import bcrypt to maintain fast bundle
    const bcrypt = await import("bcrypt");
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Password salah. Penghapusan akun dibatalkan." }, { status: 400 });
    }

    // If SUPERADMIN, ensure at least one other superadmin remains
    if (user.role === "SUPERADMIN") {
      const superadminCount = await prisma.user.count({ where: { role: "SUPERADMIN" } });
      if (superadminCount <= 1) {
        return NextResponse.json(
          { error: "Tidak dapat menghapus satu-satunya akun SUPERADMIN pada platform." },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ success: true, message: "Akun berhasil dihapus." }, { status: 200 });
  } catch (error) {
    console.error("DELETE user/profile error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
