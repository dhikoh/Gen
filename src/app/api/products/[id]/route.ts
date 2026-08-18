import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Nama produk harus diisi"),
  description: z.string().optional(),
  price: z.number().min(0).default(0),
  link: z.string().url().optional().or(z.literal("")),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const product = await prisma.product.findUnique({ 
      where: { id },
      include: { channel: true }
    });
    if (!product || product.channel.userId !== session.user.id) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: t("invalidData") }, { status: 400 });

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        link: parsed.data.link || null,
      }
    });

    return NextResponse.json({ success: true, product: updated }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: t("unauthorized") }, { status: 401 });

    const product = await prisma.product.findUnique({ 
      where: { id },
      include: { channel: true }
    });
    if (!product || product.channel.userId !== session.user.id) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
