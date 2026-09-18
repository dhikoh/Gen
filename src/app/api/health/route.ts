import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const startTime = Date.now();
  try {
    // Database connection verification
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptimeSec: Math.floor(process.uptime()),
      database: {
        status: "connected",
        latencyMs,
      },
      environment: process.env.NODE_ENV || "development",
    }, { status: 200 });
  } catch (error) {
    console.error("Health check failure:", error);
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        status: "disconnected",
        error: error instanceof Error ? error.message : "Database unreachable",
      },
    }, { status: 503 });
  }
}
