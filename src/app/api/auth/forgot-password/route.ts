import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";
import crypto from "crypto";
// import { sendEmail } from "@/lib/email"; // To be implemented or mocked for now

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`forgot_pw_${ip}`, 3, 60 * 15); // 3 requests per 15 minutes
    if (!isAllowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = forgotPasswordSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: "Input tidak valid" }, { status: 400 });
    }

    const { identifier } = parsedData.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { username: { equals: identifier, mode: "insensitive" } }
        ]
      }
    });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt
        }
      });

      // TODO: Send real email with token
      // e.g. sendEmail(user.email, `Reset Password`, `Link: ${process.env.NEXTAUTH_URL}/id/auth/reset-password?token=${token}`);
      console.log(`[Email Mock] Reset link for ${user.email}: ${process.env.NEXTAUTH_URL}/id/auth/reset-password?token=${token}`);
    }

    // Always return success
    return NextResponse.json({ success: true, message: "Jika akun terdaftar, tautan reset telah dikirim ke email." }, { status: 200 });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
