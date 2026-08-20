import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { generatorPreferences: true },
    });

    return NextResponse.json({
      success: true,
      generatorPreferences: user?.generatorPreferences || null,
    });
  } catch (error: any) {
    console.error("GET user/preferences error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { generatorPreferences: true } });
    const currentPrefs = user?.generatorPreferences && typeof user.generatorPreferences === "object" ? user.generatorPreferences : {};
    
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        generatorPreferences: {
          ...(currentPrefs as any),
          ...body,
        },
      },
    });

    return NextResponse.json({
      success: true,
      generatorPreferences: updatedUser.generatorPreferences,
    });
  } catch (error: any) {
    console.error("PUT user/preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
