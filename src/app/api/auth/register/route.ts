import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";
import { notifyAllSuperadmins } from "@/lib/notifications";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(8, "Phone number is too short").optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Step 2 Data
  channelName: z.string().min(1, "Channel name is required"),
  niche: z.string().optional(),
  description: z.string().optional(),
  cta1: z.string().optional(),
  cta2: z.string().optional(),
  visualAesthetic: z.string().optional(),
  audioBGM: z.boolean().default(true),
  audioSFX: z.boolean().default(true),
  audioVO: z.boolean().default(true),
  socialLinks: z.object({
    tiktok: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    facebook: z.string().optional(),
    website: z.string().optional()
  }).optional(),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    const cookieStore = await cookies();
    const userLocale = cookieStore.get('NEXT_LOCALE')?.value || 'id';
    
    const body = await req.json();
    const emailStr = typeof body.email === 'string' ? body.email.toLowerCase() : 'unknown';
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`register_${ip}_${emailStr}`, 5, 60 * 60); // 5 registers per hour per IP+email
    if (!isAllowed) {
      return NextResponse.json({ error: t("registerRateLimit") }, { status: 429 });
    }
    const parsedData = registerSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData"), details: parsedData.error.flatten() }, { status: 400 });
    }

    const {
      name, username, email, phoneNumber, dateOfBirth, password,
      channelName, niche, description, cta1, cta2, visualAesthetic,
      audioBGM, audioSFX, audioVO, socialLinks
    } = parsedData.data;

    // Case-insensitive check
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { username: { equals: username, mode: "insensitive" } },
          ...(phoneNumber ? [{ phoneNumber }] : [])
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json({ error: t("emailUsed") }, { status: 409 });
      }
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
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
          email,
          phoneNumber: phoneNumber || null,
          passwordHash,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          role: "USER",
          registrationStatus: "PENDING_APPROVAL",
          subscriptionStatus: "INACTIVE",
          currentPlanId: null,
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
      "Pendaftaran User Baru",
      `User ${newUser.name} (${newUser.email}) mendaftar dan menunggu persetujuan admin.`,
      "/admin/registrations"
    );

    return NextResponse.json({ success: true, message: t("accountPendingApproval") }, { status: 201 });

  } catch (error: any) {
    console.error("Register error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: t("emailUsed") + " / " + t("usernameUsed") }, { status: 409 });
    }
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
