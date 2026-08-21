import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    // Superadmins can see all system-wide notifications they received.
    // In our system, notifyAllSuperadmins sends notifications to all superadmins.
    // If they want to see all user notifications, we can fetch all, 
    // but typically they just need what's addressed to them or broadcasts.
    // Let's fetch all notifications where the user is a superadmin, 
    // OR just fetch all notifications in the system if they want a global view.
    // The prompt says "Semua notifikasi platform untuk admin", let's fetch all.
    
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Admin Notifications API error:", error);
    return NextResponse.json({ error: t("systemError") }, { status: 500 });
  }
}
