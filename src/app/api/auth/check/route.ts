import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";

const checkSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`check_${ip}`, 20, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
    }

    const body = await req.json();
    const parsedData = checkSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: "Input tidak valid" }, { status: 400 });
    }

    const { email, username, phoneNumber } = parsedData.data;

    if (!email && !username && !phoneNumber) {
      return NextResponse.json({ error: "Minimal satu parameter (email/username/phoneNumber) harus diisi" }, { status: 400 });
    }

    const conditions = [];
    if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
    if (username) conditions.push({ username: { equals: username, mode: "insensitive" } });
    if (phoneNumber) conditions.push({ phoneNumber });

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: conditions as any
      }
    });

    if (existingUser) {
      if (email && existingUser.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json({ error: "Email sudah digunakan", field: "email" }, { status: 409 });
      }
      if (username && existingUser.username.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json({ error: "Username sudah digunakan", field: "username" }, { status: 409 });
      }
      if (phoneNumber && existingUser.phoneNumber === phoneNumber) {
        return NextResponse.json({ error: "Nomor HP sudah digunakan", field: "phoneNumber" }, { status: 409 });
      }
    }

    return NextResponse.json({ success: true, message: "Tersedia" }, { status: 200 });

  } catch (error) {
    console.error("Check error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
