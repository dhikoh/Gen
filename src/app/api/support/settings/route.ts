import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
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
