import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";

const productSchema = z.object({
  name: z.string().min(1, "Nama produk harus diisi"),
  description: z.string().optional(),
  price: z.number().min(0).default(0),
  link: z.string().url().optional().or(z.literal("")),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const channel = await prisma.profileChannel.findUnique({ where: { id } });
    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { channelId: id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`create_product_${session.user.id}_${ip}`, 15, 60 * 15); // 15 products per 15 minutes
    if (!isAllowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan pembuatan produk. Coba lagi nanti." }, { status: 429 });
    }

    const channel = await prisma.profileChannel.findUnique({ where: { id } });
    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const product = await prisma.product.create({
      data: {
        channelId: id,
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        link: parsed.data.link || null,
      }
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
