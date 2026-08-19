import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const planUpdateSchema = z.object({
  id: z.string(),
  priceMonthly: z.number().min(0),
  maxChannels: z.number().min(1),
  isActive: z.boolean(),
  features: z.record(z.string(), z.boolean()).optional()
});

export async function GET() {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`admin_plans_${session.user.id}_${ip}`, 20, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = planUpdateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { id, priceMonthly, maxChannels, isActive, features } = parsedData.data;

    const dataToUpdate: Prisma.PlanUpdateInput = {
      priceMonthly,
      maxChannels,
      isActive
    };
    if (features !== undefined) {
      dataToUpdate.features = features as Prisma.InputJsonValue;
    }

    const updated = await prisma.plan.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, plan: updated }, { status: 200 });
  } catch (error) {
    console.error("Admin Plans API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
