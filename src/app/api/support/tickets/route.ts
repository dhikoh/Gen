import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { SupportTicketStatus } from "@prisma/client";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";
import { getApiTranslator } from "@/lib/apiI18n";
import { notifyAllSuperadmins } from "@/lib/notifications";

const createTicketSchema = z.object({
  subject: z.string().min(3),
  message: z.string().min(5),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional().or(z.literal("")),
});

export async function GET(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    if (session.user.role === "SUPERADMIN") {
      const tickets = await prisma.supportTicket.findMany({
        where: statusParam ? { status: statusParam as SupportTicketStatus } : undefined,
        include: {
          user: { select: { id: true, name: true, email: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 }
        },
        orderBy: { updatedAt: "desc" }
      });
      return NextResponse.json({ tickets });
    } else {
      const tickets = await prisma.supportTicket.findMany({
        where: { userId: session.user.id },
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 }
        },
        orderBy: { updatedAt: "desc" }
      });
      return NextResponse.json({ tickets });
    }
  } catch (error) {
    console.error("GET /api/support/tickets error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const t = await getApiTranslator();
  try {
    const session = await getServerSession(authOptions);
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const isAllowed = await applyRateLimit(`create_ticket_${session?.user?.id || ip}`, 5, 60 * 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const body = await req.json();
    const parsed = createTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidData") }, { status: 400 });
    }

    const { subject, message, guestName, guestEmail } = parsed.data;

    let userId: string | null = null;
    let finalGuestName: string | null = null;
    let finalGuestEmail: string | null = null;

    if (session?.user) {
      userId = session.user.id;
    } else {
      if (!guestName || !guestEmail) {
        return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
      }
      finalGuestName = guestName;
      finalGuestEmail = guestEmail;
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.supportTicket.create({
        data: {
          userId,
          guestName: finalGuestName,
          guestEmail: finalGuestEmail,
          subject,
          status: "OPEN"
        }
      });

      await tx.supportMessage.create({
        data: {
          ticketId: newTicket.id,
          senderRole: session?.user?.role === "SUPERADMIN" ? "SUPERADMIN" : "USER",
          body: message
        }
      });

      return newTicket;
    });

    await notifyAllSuperadmins(
      "SUPPORT_TICKET_NEW",
      "ticketNewTitle",
      "ticketNewMsg",
      "/admin/support",
      { ticketId: ticket.id.slice(-6), subject }
    );

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error) {
    console.error("POST /api/support/tickets error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
