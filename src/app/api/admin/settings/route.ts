import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const settingsSchema = z.object({
  heroTitle: z.string().min(1),
  heroSubtitle: z.string().min(1),
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankAccountName: z.string().optional(),
});

export async function PUT(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
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
      },
      create: {
        id: "singleton",
        heroTitle: parsedData.data.heroTitle,
        heroSubtitle: parsedData.data.heroSubtitle,
        bankName: parsedData.data.bankName,
        bankAccountNo: parsedData.data.bankAccountNo,
        bankAccountName: parsedData.data.bankAccountName,
      }
    });

    return NextResponse.json({ success: true, settings: updated }, { status: 200 });

  } catch (error) {
    console.error("Admin Settings API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
