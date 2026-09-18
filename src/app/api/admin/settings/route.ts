import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import { logAdminAction } from "@/lib/auditLog";

const settingsSchema = z.object({
  heroTitle: z.string().min(1),
  heroSubtitle: z.string().min(1),
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankAccountName: z.string().optional(),
  csMode: z.enum(["DIRECT_WHATSAPP", "DIRECT_EMAIL", "TICKET"]).optional(),
  csWhatsappNumber: z.string().nullable().optional(),
  csEmail: z.string().nullable().optional(),
  csOperatingHours: z.string().nullable().optional(),
  csWidgetEnabled: z.boolean().optional(),
  rateLimitRequests: z.number().min(1).optional(),
  rateLimitWindowMs: z.number().min(1000).optional(),
});

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`admin_settings_get_${session.user.id}_${ip}`, 60, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Admin Settings GET API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`admin_settings_put_${session.user.id}_${ip}`, 20, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = settingsSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const updated = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      update: {
        heroTitle: parsedData.data.heroTitle,
        heroSubtitle: parsedData.data.heroSubtitle,
        bankName: parsedData.data.bankName,
        bankAccountNo: parsedData.data.bankAccountNo,
        bankAccountName: parsedData.data.bankAccountName,
        csMode: parsedData.data.csMode,
        csWhatsappNumber: parsedData.data.csWhatsappNumber,
        csEmail: parsedData.data.csEmail,
        csOperatingHours: parsedData.data.csOperatingHours,
        csWidgetEnabled: parsedData.data.csWidgetEnabled,
        rateLimitRequests: parsedData.data.rateLimitRequests,
        rateLimitWindowMs: parsedData.data.rateLimitWindowMs,
      },
      create: {
        id: "singleton",
        heroTitle: parsedData.data.heroTitle,
        heroSubtitle: parsedData.data.heroSubtitle,
        bankName: parsedData.data.bankName,
        bankAccountNo: parsedData.data.bankAccountNo,
        bankAccountName: parsedData.data.bankAccountName,
        csMode: parsedData.data.csMode || "TICKET",
        csWhatsappNumber: parsedData.data.csWhatsappNumber,
        csEmail: parsedData.data.csEmail,
        csOperatingHours: parsedData.data.csOperatingHours,
        csWidgetEnabled: parsedData.data.csWidgetEnabled ?? true,
        rateLimitRequests: parsedData.data.rateLimitRequests ?? 30,
        rateLimitWindowMs: parsedData.data.rateLimitWindowMs ?? 60000,
      }
    });

    await logAdminAction({
      adminId: session.user.id,
      action: "UPDATE_APP_SETTINGS",
      targetType: "SETTINGS",
      targetId: "singleton",
      metadata: { updatedFields: Object.keys(parsedData.data) }
    });

    return NextResponse.json({ success: true, settings: updated }, { status: 200 });

  } catch (error) {
    console.error("Admin Settings API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
