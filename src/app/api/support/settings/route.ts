// @deprecated Use /api/cs/contact-info instead. This endpoint is kept for backward compatibility.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    const isAllowed = await applyRateLimit(`cs_settings_${ip}`, 20, 60);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" }
    });

    return NextResponse.json({
      csMode: settings?.csMode || "TICKET",
      csWhatsappNumber: settings?.csWhatsappNumber || null,
      csEmail: settings?.csEmail || null,
      csOperatingHours: settings?.csOperatingHours || null,
      csWidgetEnabled: settings?.csWidgetEnabled ?? true,
    });
  } catch (error) {
    console.error("GET /api/support/settings error:", error);
    return NextResponse.json({ error: "Failed to fetch CS settings" }, { status: 500 });
  }
}
