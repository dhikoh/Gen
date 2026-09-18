import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { z } from "zod";
import { getClientIp, applyDualRateLimit } from "@/lib/rateLimit";
import { notifyAllSuperadmins } from "@/lib/notifications";

const registerSchema = z.object({
  name: z.string().trim().min(1, "NAME_REQUIRED"),
  username: z.string().trim().min(3, "USERNAME_TOO_SHORT").regex(/^[a-zA-Z0-9_.-]+$/, "USERNAME_INVALID"),
  email: z.string().trim().toLowerCase().email("EMAIL_INVALID"),
  phoneNumber: z.string().optional().nullable().or(z.literal("")),
  dateOfBirth: z.string().optional().nullable().or(z.literal("")),
  password: z.string().min(8, "PASSWORD_TOO_SHORT"),
  // Step 2 Data
  channelName: z.string().trim().min(1, "CHANNEL_REQUIRED"),
  niche: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  cta1: z.string().optional().nullable(),
  cta2: z.string().optional().nullable(),
  visualAesthetic: z.string().optional().nullable(),
  audioBGM: z.boolean().default(true),
  audioSFX: z.boolean().default(true),
  audioVO: z.boolean().default(true),
  socialLinks: z.record(z.string(), z.string()).optional().nullable(),
});

// Fix 2.8: Map Zod error codes to i18n keys so EN users receive English messages
const ZOD_ERROR_MAP: Record<string, string> = {
  NAME_REQUIRED: "NAME_REQUIRED",
  USERNAME_TOO_SHORT: "USERNAME_TOO_SHORT",
  USERNAME_INVALID: "USERNAME_INVALID",
  EMAIL_INVALID: "EMAIL_INVALID",
  PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
  CHANNEL_REQUIRED: "CHANNEL_REQUIRED",
};

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    const cookieStore = await cookies();
    const userLocale = cookieStore.get('NEXT_LOCALE')?.value || 'id';
    
    const body = await req.json();
    const emailStr = typeof body.email === 'string' ? body.email.toLowerCase().trim() : 'unknown';
    const ip = getClientIp(req);
    const isAllowed = await applyDualRateLimit("register", ip, emailStr, 10, 60 * 60); // 10 per hour dual bucket
    if (!isAllowed) {
      return NextResponse.json({ error: t("registerRateLimit") }, { status: 429 });
    }
    const parsedData = registerSchema.safeParse(body);

    if (!parsedData.success) {
      const rawCode = parsedData.error.issues[0]?.message || "invalidData";
      const i18nKey = ZOD_ERROR_MAP[rawCode] || "invalidData";
      // Try translating; fall back to rawCode if key not found
      const translatedMsg = t(i18nKey as Parameters<typeof t>[0]) || rawCode;
      console.warn("Register Zod validation error:", parsedData.error.flatten());
      return NextResponse.json({ error: translatedMsg }, { status: 400 });
    }

    const {
      name, username, email, phoneNumber, dateOfBirth, password,
      channelName, niche, description, cta1, cta2, visualAesthetic,
      audioBGM, audioSFX, audioVO, socialLinks
    } = parsedData.data;

    const emailLower = email.toLowerCase().trim();
    const usernameLower = username.toLowerCase().trim();
    const phoneNormalized = phoneNumber ? phoneNumber.trim().replace(/[^\d+]/g, '') : null;

    // Case-insensitive & normalized uniqueness check (P0-8)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { emailLower },
          { usernameLower },
          ...(phoneNormalized ? [{ phoneNormalized }] : []),
          { email: { equals: email, mode: "insensitive" } },
          { username: { equals: username, mode: "insensitive" } },
          ...(phoneNumber ? [{ phoneNumber }] : [])
        ]
      }
    });

    if (existingUser) {
      if ((existingUser.emailLower && existingUser.emailLower === emailLower) || existingUser.email.toLowerCase() === emailLower) {
        return NextResponse.json({ error: t("emailUsed") }, { status: 409 });
      }
      if ((existingUser.usernameLower && existingUser.usernameLower === usernameLower) || existingUser.username.toLowerCase() === usernameLower) {
        return NextResponse.json({ error: t("usernameUsed") }, { status: 409 });
      }
      return NextResponse.json({ error: t("phoneUsed") }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Atomic transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          username,
          usernameLower,
          email,
          emailLower,
          phoneNumber: phoneNumber || null,
          phoneNormalized,
          passwordHash,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          role: "USER",
          registrationStatus: "PENDING_APPROVAL",
          subscriptionStatus: "INACTIVE",
          subscriptionExpiresAt: null,
          currentPlanId: null,
          hasUsedTrial: false,
          preferredLocale: userLocale
        }
      });

      await tx.profileChannel.create({
        data: {
          userId: user.id,
          channelName,
          niche,
          description,
          cta1,
          cta2,
          visualAesthetic,
          audioBGM,
          audioSFX,
          audioVO,
          socialLinks: socialLinks || {},
          isLocked: false // Initially not locked, but depends on limits checking
        }
      });

      return user;
    });

    await notifyAllSuperadmins(
      "NEW_PENDING_REGISTRATION",
      "newPendingRegistrationTitle",
      "newPendingRegistrationMsg",
      "/admin/registrations",
      { name: newUser.name, email: newUser.email }
    );

    return NextResponse.json({ success: true, message: t("accountPendingApproval") }, { status: 201 });

  } catch (error: unknown) {
    console.error("Register error:", error);
    const errObj = error as { code?: string };
    if (errObj && errObj.code === 'P2002') {
      return NextResponse.json({ error: t("emailUsed") + " / " + t("usernameUsed") }, { status: 409 });
    }
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
