import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { notifyUser, notifyAllSuperadmins } from "@/lib/notifications";
import { applyRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

// 4.4 fix: Zod schema for message body — max 5000 chars
const messageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getApiTranslator();
  const { id: ticketId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = await applyRateLimit(`support_msg_${session.user.id}_${ip}`, 10, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("rateLimit") }, { status: 429 });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isSuperadmin = session.user.role === "SUPERADMIN";
    if (!isSuperadmin && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
    }

    const rawBody = await req.json();
    const parsed = messageSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }

    const senderRole = isSuperadmin ? "SUPERADMIN" : "USER";
    const nextStatus = isSuperadmin ? "REPLIED" : "OPEN";

    const message = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.supportMessage.create({
        data: {
          ticketId,
          senderRole,
          body: parsed.data.body
        }
      });

      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { status: nextStatus, updatedAt: new Date() }
      });

      return newMessage;
    });

    if (isSuperadmin) {
      if (ticket.userId) {
        await notifyUser(
          ticket.userId,
          "SUPPORT_TICKET_REPLIED",
          "ticketRepliedTitle",
          "ticketRepliedMsg",
          "/dashboard/support",
          { ticketId: ticketId.slice(-6) }
        );
      }
    } else {
      await notifyAllSuperadmins(
        "SUPPORT_TICKET_REPLIED",
        "ticketRepliedTitle",
        "ticketRepliedMsg",
        "/admin/support",
        { ticketId: ticketId.slice(-6) }
      );
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/support/tickets/[id]/messages error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getApiTranslator();
  const { id: ticketId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ticket = await prisma.supportTicket.findUnique({ 
      where: { id: ticketId },
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });
    
    if (!ticket) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isSuperadmin = session.user.role === "SUPERADMIN";
    if (!isSuperadmin && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
    }

    return NextResponse.json({ messages: ticket.messages }, { status: 200 });
  } catch (error) {
    console.error("GET /api/support/tickets/[id]/messages error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
