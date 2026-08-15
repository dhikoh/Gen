import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const channelSchema = z.object({
  channelName: z.string().min(1, "Nama channel harus diisi"),
  niche: z.string().optional(),
  description: z.string().optional(),
  visualAesthetic: z.string().optional(),
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedData = channelSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    // Get the first channel (MVP assumes 1 primary channel per user)
    const channel = await prisma.profileChannel.findFirst({
      where: { userId: session.user.id }
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.profileChannel.update({
      where: { id: channel.id },
      data: {
        channelName: parsedData.data.channelName,
        niche: parsedData.data.niche,
        description: parsedData.data.description,
        visualAesthetic: parsedData.data.visualAesthetic,
      }
    });

    return NextResponse.json({ success: true, channel: updated }, { status: 200 });

  } catch (error) {
    console.error("Channel Update API error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
