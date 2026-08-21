import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { applyRateLimit } from "@/lib/rateLimit";
import { Prisma, PlanCode } from "@prisma/client";
import { z } from "zod";

// Fix 2.12: Extended planUpdateSchema to include isPubliclyPurchasable, name, sortOrder
const planUpdateSchema = z.object({
  id: z.string(),
  priceMonthly: z.number().min(0),
  maxChannels: z.number().min(1),
  isActive: z.boolean(),
  isPubliclyPurchasable: z.boolean().optional(),
  name: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  features: z.record(z.string(), z.boolean()).optional(),
});

// Fix 2.12: New schema for creating a plan
const planCreateSchema = z.object({
  code: z.nativeEnum(PlanCode),
  name: z.string().trim().min(1),
  priceMonthly: z.number().min(0),
  maxChannels: z.number().min(1),
  isActive: z.boolean().default(true),
  isPubliclyPurchasable: z.boolean().default(false),
  sortOrder: z.number().int().default(99),
  features: z.record(z.string(), z.boolean()).optional(),
});

export async function GET() {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ plans }, { status: 200 });
  } catch {
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}

// Fix 2.12: New POST handler — create plan with unique code validation
export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`admin_plans_create_${session.user.id}_${ip}`, 10, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = planCreateSchema.safeParse(body);

    if (!parsedData.success) {
      console.error("POST /api/admin/plans validation:", parsedData.error.flatten());
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { code, name, priceMonthly, maxChannels, isActive, isPubliclyPurchasable, sortOrder, features } = parsedData.data;

    // Check unique code
    const existing = await prisma.plan.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Plan dengan kode ini sudah ada." }, { status: 409 });
    }

    const plan = await prisma.plan.create({
      data: {
        code,
        name,
        priceMonthly,
        maxChannels,
        isActive,
        isPubliclyPurchasable,
        sortOrder,
        features: features ? (features as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error) {
    console.error("Admin Plans POST error:", error);
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

    const { id, priceMonthly, maxChannels, isActive, isPubliclyPurchasable, name, sortOrder, features } = parsedData.data;

    const dataToUpdate: Prisma.PlanUpdateInput = {
      priceMonthly,
      maxChannels,
      isActive,
    };
    // Fix 2.12: Allow updating isPubliclyPurchasable, name, sortOrder
    if (isPubliclyPurchasable !== undefined) dataToUpdate.isPubliclyPurchasable = isPubliclyPurchasable;
    if (name !== undefined) dataToUpdate.name = name;
    if (sortOrder !== undefined) dataToUpdate.sortOrder = sortOrder;
    if (features !== undefined) dataToUpdate.features = features as Prisma.InputJsonValue;

    const updated = await prisma.$transaction(async (tx) => {
      return tx.plan.update({ where: { id }, data: dataToUpdate });
    });

    return NextResponse.json({ success: true, plan: updated }, { status: 200 });
  } catch (error) {
    console.error("Admin Plans API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}

// Fix 2.12: DELETE handler — remove plan (guards against deleting plans with active users)
export async function DELETE(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`admin_plans_delete_${session.user.id}_${ip}`, 5, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Plan ID wajib diisi." }, { status: 400 });
    }

    // Safety: prevent deletion if there are active users on this plan
    const activeUsers = await prisma.user.count({ where: { currentPlanId: id } });
    if (activeUsers > 0) {
      return NextResponse.json(
        { error: `Tidak bisa menghapus paket yang masih digunakan oleh ${activeUsers} pengguna aktif.` },
        { status: 409 }
      );
    }

    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Admin Plans DELETE error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
