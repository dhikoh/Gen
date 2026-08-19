import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`public_cs_contact_${ip}`, 30, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" }
    });

    return NextResponse.json({
      success: true,
      csMode: settings?.csMode || "TICKET",
      csWhatsappNumber: settings?.csWhatsappNumber || null,
      csEmail: settings?.csEmail || null,
      csOperatingHours: settings?.csOperatingHours || null,
      csWidgetEnabled: settings?.csWidgetEnabled ?? true,
    }, { status: 200 });
  } catch (error) {
    console.error("GET /api/cs/contact-info error:", error);
    return NextResponse.json({ error: "Failed to fetch CS contact info" }, { status: 500 });
  }
}
