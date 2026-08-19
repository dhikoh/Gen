import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import { formatWaLink } from "@/lib/csContact";

export async function GET(req: NextRequest) {
  // Rate limiting (10 requests per 60s per IP)
  const clientIp = req.headers.get("x-forwarded-for") || "anonymous";
  const allowed = await applyRateLimit(`reg-status:${clientIp}`, 10, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get("identifier")?.trim();

  if (!identifier) {
    return NextResponse.json(
      { error: "Identifier parameter is required" },
      { status: 400 }
    );
  }

  // Fetch settings first
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
  });

  const registrationPendingAlertHours = settings?.registrationPendingAlertHours ?? 24;

  // Search user by email, username, or phone number case-insensitively
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: identifier, mode: "insensitive" } },
        { username: { equals: identifier, mode: "insensitive" } },
        { phoneNumber: { equals: identifier } },
      ],
    },
    select: {
      registrationStatus: true,
      createdAt: true,
    },
  });

  if (!user) {
    // Anti user-enumeration response
    return NextResponse.json({
      status: "UNKNOWN",
      registrationPendingAlertHours,
    });
  }

  const elapsedMs = Date.now() - new Date(user.createdAt).getTime();
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
  const isOverThreshold = elapsedHours >= registrationPendingAlertHours;

  const defaultWaText = `Halo CS Prompt Gen, akun saya (${identifier}) belum disetujui setelah mendaftar.`;
  const waLink = settings?.csWhatsappNumber
    ? formatWaLink(settings.csWhatsappNumber, defaultWaText)
    : null;

  return NextResponse.json({
    status: user.registrationStatus,
    createdAt: user.createdAt,
    elapsedHours,
    isOverThreshold,
    registrationPendingAlertHours,
    waLink,
    csMode: settings?.csMode ?? "TICKET",
    csWidgetEnabled: settings?.csWidgetEnabled ?? true,
  });
}
