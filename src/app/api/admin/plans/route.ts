import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const planUpdateSchema = z.object({
  id: z.string(),
  priceMonthly: z.number().min(0),
  maxChannels: z.number().min(1),
  isActive: z.boolean()
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = planUpdateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { id, priceMonthly, maxChannels, isActive } = parsedData.data;

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        priceMonthly,
        maxChannels,
        isActive
      }
    });

    return NextResponse.json({ success: true, plan: updated }, { status: 200 });
  } catch (error) {
    console.error("Admin Plans API error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
