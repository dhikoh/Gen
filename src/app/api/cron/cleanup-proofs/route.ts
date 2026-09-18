import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  return handleCleanup(req);
}

export async function GET(req: Request) {
  return handleCleanup(req);
}

async function handleCleanup(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret") || authHeader.replace(/^Bearer\s+/i, "").trim();

  const expectedSecret = process.env.CRON_SECRET || "promptgen_cron_internal_secret";
  if (secret !== expectedSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  try {
    const rawDays = parseInt(searchParams.get("days") || "180", 10);
    const days = isNaN(rawDays) ? 180 : Math.max(30, Math.min(rawDays, 3650));
    const dryRun = searchParams.get("dryRun") === "true";

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const whereCondition = {
      status: { in: ["APPROVED" as const, "REJECTED" as const] },
      proofUrl: { not: null },
      updatedAt: { lte: cutoffDate },
    };

    const eligibleCount = await prisma.invoice.count({
      where: whereCondition,
    });

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        eligibleCount,
        retentionDays: days,
        cutoffDate: cutoffDate.toISOString(),
      });
    }

    if (eligibleCount === 0) {
      return NextResponse.json({
        success: true,
        cleanedCount: 0,
        retentionDays: days,
        cutoffDate: cutoffDate.toISOString(),
        message: "No expired proofs found for cleanup.",
      });
    }

    // Nullify proofUrl for expired invoices
    const updateResult = await prisma.invoice.updateMany({
      where: whereCondition,
      data: {
        proofUrl: null,
      },
    });

    // Audit the retention cleanup
    await prisma.adminAuditLog.create({
      data: {
        actorId: "SYSTEM_CRON",
        action: "CLEANUP_PROOF_RETENTION",
        targetType: "INVOICE",
        targetId: null,
        afterData: {
          cleanedCount: updateResult.count,
          retentionDays: days,
          cutoffDate: cutoffDate.toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      cleanedCount: updateResult.count,
      retentionDays: days,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("GET/POST /api/cron/cleanup-proofs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
