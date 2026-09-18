import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { notifyUser, notifyAllSuperadmins } from "@/lib/notifications";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { getBaseEmailTemplate, escapeHtml } from "@/lib/emailTemplates";
import { logEmailDelivery } from "@/lib/emailLog";
import { logAdminAction } from "@/lib/auditLog";

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

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`support_msg_${session.user.id}_${ip}`, 10, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const isSuperadmin = session.user.role === "SUPERADMIN";
    if (!isSuperadmin && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
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
      // 1. Registered user notification
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

      // 2. P1-2: Guest notification via email
      if (!ticket.userId && ticket.guestEmail) {
        const { getTranslations } = await import("next-intl/server");
        const tEmail = await getTranslations({ locale: "id", namespace: "Emails" });
        const emailHtml = getBaseEmailTemplate(`
          <h2>${tEmail('ticketReplySubject')}</h2>
          <p>Halo <strong>${escapeHtml(ticket.guestName || "Tamu")}</strong>,</p>
          <p>Tim support kami telah membalas tiket Anda mengenai: <strong>${escapeHtml(ticket.subject)}</strong></p>
          <div style="background: #f4f4f5; padding: 12px 16px; border-radius: 8px; margin: 16px 0; font-family: monospace; white-space: pre-wrap;">
            ${escapeHtml(parsed.data.body)}
          </div>
          <p>Jika Anda memiliki pertanyaan lebih lanjut, silakan balas email ini atau kunjungi platform kami.</p>
        `, tEmail('ticketReplySubject'));

        const emailRes = await sendEmail({
          to: ticket.guestEmail,
          subject: `[Tiket #${ticket.id.slice(-6)}] ${tEmail('ticketReplySubject')}: ${ticket.subject}`,
          html: emailHtml
        });

        await logEmailDelivery({
          recipient: ticket.guestEmail,
          subject: `[Tiket #${ticket.id.slice(-6)}] Balasan Dukungan: ${ticket.subject}`,
          templateType: "SUPPORT_TICKET_REPLIED_GUEST",
          status: emailRes.success ? "SUCCESS" : "FAILED",
          errorDetails: emailRes.error
        });
      }

      await logAdminAction({
        actorId: session.user.id,
        action: "REPLY_SUPPORT_TICKET",
        targetType: "SUPPORT_TICKET",
        targetId: ticketId,
        metadata: { isGuest: !ticket.userId }
      });
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

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`support_msgs_get_${session.user.id}_${ip}`, 60, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
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
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    return NextResponse.json({ messages: ticket.messages }, { status: 200 });
  } catch (error) {
    console.error("GET /api/support/tickets/[id]/messages error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
