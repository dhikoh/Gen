import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { z } from "zod";
import { getApiTranslator } from "@/lib/apiI18n";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "PASSWORD_TOO_SHORT"),
  newPassword: z.string().min(8, "PASSWORD_TOO_SHORT"),
});

export async function PUT(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = changePasswordSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsedData.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: t("invalidCredentials") }, { status: 401 });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
