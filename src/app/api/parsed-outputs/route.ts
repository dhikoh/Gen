import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";

const postSchema = z.object({
  rawInput: z.string().min(1, "rawInput wajib diisi"),
  parsedResult: z.unknown().optional(),
});

/** GET /api/parsed-outputs — latest parsed output milik user yang sedang login */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get("limit") || "1", 10);
    const limit = Math.min(Math.max(limitParam, 1), 20);

    const outputs = await prisma.parsedOutput.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, rawInput: true, parsedResult: true, createdAt: true },
    });

    return NextResponse.json(outputs);
  } catch (err) {
    console.error("parsed-outputs GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** POST /api/parsed-outputs — simpan hasil parse baru */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`parsed_output_${session.user.id}_${ip}`, 30, 60);
    if (!isAllowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { rawInput, parsedResult } = parsed.data;

    const record = await prisma.parsedOutput.create({
      data: {
        userId: session.user.id,
        rawInput,
        parsedResult: parsedResult ?? undefined,
      },
    });

    // Keep only 10 latest per user (cleanup old records)
    const allOutputs = await prisma.parsedOutput.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (allOutputs.length > 10) {
      const idsToDelete = allOutputs.slice(10).map((o) => o.id);
      await prisma.parsedOutput.deleteMany({ where: { id: { in: idsToDelete } } });
    }

    return NextResponse.json({ success: true, id: record.id }, { status: 201 });
  } catch (err) {
    console.error("parsed-outputs POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
