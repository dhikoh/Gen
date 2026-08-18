import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const body = await req.json();
    const identifierStr = typeof body.identifier === 'string' ? body.identifier.toLowerCase() : 'unknown';
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`forgot_pw_${ip}_${identifierStr}`, 3, 60 * 15); // 3 requests per 15 minutes
    if (!isAllowed) {
      return NextResponse.json({ error: t("authRateLimit") }, { status: 429 });
    }
    const parsedData = forgotPasswordSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
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

      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const locale = cookieStore.get('NEXT_LOCALE')?.value || 'id';
      const resetUrl = `${process.env.NEXTAUTH_URL}/${locale}/auth/reset-password?token=${token}`;
      
      const { getTranslations } = await import("next-intl/server");
      const tEmail = await getTranslations({ locale, namespace: 'Emails' });

      await sendEmail({
        to: user.email,
        subject: tEmail('resetSubject'),
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
            <h2>${tEmail('resetSubject')}</h2>
            <p>${tEmail('resetGreeting')}</p>
            <p>${tEmail('resetInstruction')}</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">${tEmail('resetButton')}</a>
            <p>${tEmail('resetIgnore')}</p>
            <p>${tEmail('resetExpiry')}</p>
          </div>
        `
      });
    }

    // Always return success
    return NextResponse.json({ success: true, message: t("resetLinkSent") }, { status: 200 });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
