import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getClientIp, applyDualRateLimit } from "@/lib/rateLimit";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { getBaseEmailTemplate, escapeHtml } from "@/lib/emailTemplates";
import { logEmailDelivery } from "@/lib/emailLog";

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    const body = await req.json();
    const parsedData = forgotPasswordSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }

    const { identifier } = parsedData.data;
    const normIdentifier = identifier.trim().toLowerCase();
    const ip = getClientIp(req);

    // Dual rate limit: IP bucket (max 10 requests / 15 min), identifier bucket (max 3 requests / 15 min)
    const isAllowed = await applyDualRateLimit(
      "forgot_password",
      ip,
      normIdentifier,
      3,
      15 * 60
    );

    if (!isAllowed) {
      return NextResponse.json({ error: t("authRateLimit") }, { status: 429 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { emailLower: normIdentifier },
          { usernameLower: normIdentifier },
          { email: { equals: identifier, mode: "insensitive" } },
          { username: { equals: identifier, mode: "insensitive" } }
        ]
      }
    });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
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
      const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";
      const resetUrl = `${process.env.NEXTAUTH_URL}/${locale}/auth/reset-password?token=${token}`;
      
      const { getTranslations } = await import("next-intl/server");
      const tEmail = await getTranslations({ locale, namespace: "Emails" });

      const emailResult = await sendEmail({
        to: user.email,
        subject: tEmail("resetSubject"),
        html: getBaseEmailTemplate(`
          <h2>${tEmail("resetSubject")}</h2>
          <p>${tEmail("resetGreeting")}</p>
          <p>${tEmail("resetInstruction")}</p>
          <div class="button-container">
            <a href="${escapeHtml(resetUrl)}" class="button">${tEmail("resetButton")}</a>
          </div>
          <p>${tEmail("resetIgnore")}</p>
          <p>${tEmail("resetExpiry")}</p>
        `, tEmail("resetSubject"))
      });

      await logEmailDelivery({
        recipient: user.email,
        templateName: "PASSWORD_RESET",
        status: emailResult.success ? "DELIVERED" : "FAILED",
        errorDetails: emailResult.error
      });
    }

    // Always return success to prevent username enumeration
    return NextResponse.json({ success: true, message: t("resetLinkSent") }, { status: 200 });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
