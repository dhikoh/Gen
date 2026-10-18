import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";

export async function GET() {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  const tokenRecord = await prisma.userGoogleDriveToken.findUnique({
    where: { userId: session.user.id },
    select: {
      expiresAt: true,
      scopes: true,
      folderId: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    connected: !!tokenRecord,
    expiresAt: tokenRecord?.expiresAt || null,
    scopes: tokenRecord?.scopes || null,
    folderId: tokenRecord?.folderId || null,
    updatedAt: tokenRecord?.updatedAt || null,
  });
}
