import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";
import { getClientIp, applyRateLimit } from "@/lib/rateLimit";
import { logAdminAction } from "@/lib/auditLog";

const ticketPatchSchema = z.object({
  status: z.enum(["OPEN", "REPLIED", "CLOSED"]),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getApiTranslator();
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`ticket_get_${session.user.id}_${ip}`, 60, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: "asc" } }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    if (session.user.role !== "SUPERADMIN" && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("GET /api/support/tickets/[id] error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getApiTranslator();
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    const ip = getClientIp(req);
    const isAllowed = await applyRateLimit(`ticket_patch_${session.user.id}_${ip}`, 30, 60);
    if (!isAllowed) {
      return NextResponse.json({ error: t("tooManyRequests") }, { status: 429 });
    }

    const rawBody = await req.json();
    const patchParsed = ticketPatchSchema.safeParse(rawBody);
    if (!patchParsed.success) {
      return NextResponse.json({ error: t("invalidInput") }, { status: 400 });
    }
    const { status } = patchParsed.data;

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    });

    if (updatedTicket.userId && status === "CLOSED") {
      await notifyUser(
        updatedTicket.userId,
        "SUPPORT_TICKET_CLOSED",
        "ticketClosedTitle",
        "ticketClosedMsg",
        "/dashboard/support",
        { ticketId: updatedTicket.id.slice(-6) }
      );
    }

    await logAdminAction({
      adminId: session.user.id,
      action: "UPDATE_TICKET_STATUS",
      targetType: "SUPPORT_TICKET",
      targetId: id,
      metadata: { newStatus: status }
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error("PATCH /api/support/tickets/[id] error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
