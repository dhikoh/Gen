import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";

const checkSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    
    const body = await req.json();
    const identifierStr = (typeof body.email === 'string' ? body.email : typeof body.username === 'string' ? body.username : 'unknown').toLowerCase();
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`check_${ip}_${identifierStr}`, 20, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }
    const parsedData = checkSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { email, username, phoneNumber } = parsedData.data;

    if (!email && !username && !phoneNumber) {
      return NextResponse.json({ error: t("missingParams") }, { status: 400 });
    }

    const conditions: Prisma.UserWhereInput[] = [];
    if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
    if (username) conditions.push({ username: { equals: username, mode: "insensitive" } });
    if (phoneNumber) conditions.push({ phoneNumber });

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: conditions
      }
    });

    if (existingUser) {
      if (email && existingUser.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json({ error: t("emailTaken"), field: "email" }, { status: 409 });
      }
      if (username && existingUser.username.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json({ error: t("usernameTaken"), field: "username" }, { status: 409 });
      }
      if (phoneNumber && existingUser.phoneNumber === phoneNumber) {
        return NextResponse.json({ error: t("phoneTaken"), field: "phoneNumber" }, { status: 409 });
      }
    }

    return NextResponse.json({ success: true, message: t("available") }, { status: 200 });

  } catch (error) {
    console.error("Check error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
