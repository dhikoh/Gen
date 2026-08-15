import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["PAID", "REJECTED"])
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsedData = actionSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { action } = parsedData.data;

    const commission = await prisma.commission.findUnique({
      where: { id }
    });

    if (!commission || commission.status !== "PENDING") {
      return NextResponse.json({ error: "Komisi tidak valid atau sudah diproses" }, { status: 400 });
    }

    await prisma.commission.update({
      where: { id },
      data: { status: action }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Commission action error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
