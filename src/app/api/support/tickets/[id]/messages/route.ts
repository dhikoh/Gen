import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { notifyUser, notifyAllSuperadmins } from "@/lib/notifications";

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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isSuperadmin = session.user.role === "SUPERADMIN";
    if (!isSuperadmin && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 403 });
    }

    const { body } = await req.json();
    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }

    const senderRole = isSuperadmin ? "SUPERADMIN" : "USER";
    const nextStatus = isSuperadmin ? "REPLIED" : "OPEN";

    const message = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.supportMessage.create({
        data: {
          ticketId,
          senderRole,
          body: body.trim()
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
