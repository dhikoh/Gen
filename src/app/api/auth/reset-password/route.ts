import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { applyRateLimit } from "@/lib/rateLimit";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const body = await req.json();
    const tokenStr = typeof body.token === 'string' ? body.token.substring(0, 15) : 'unknown';
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`reset_pw_${ip}_${tokenStr}`, 5, 60 * 15);
    if (!isAllowed) {
      return NextResponse.json({ error: t("authRateLimit") }, { status: 429 });
    }
    const parsedData = resetPasswordSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { token, newPassword } = parsedData.data;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash }
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: t("invalidToken") }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      });

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      });

      // Invalidate other unused tokens for this user
      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
          id: { not: resetToken.id }
        },
        data: { usedAt: new Date() }
      });
    });

    return NextResponse.json({ success: true, message: t("passwordChanged") }, { status: 200 });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
