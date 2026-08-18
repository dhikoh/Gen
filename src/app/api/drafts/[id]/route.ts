import { getApiTranslator } from "@/lib/apiI18n";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateDraftSchema = z.object({
  isTemplate: z.boolean().optional(),
  title: z.string().min(1, "Title cannot be empty").optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const { id } = await params;
    const existingDraft = await prisma.draft.findUnique({
      where: { id }
    });

    if (!existingDraft) {
      return NextResponse.json({ error: t("draftNotFound") }, { status: 404 });
    }

    if (existingDraft.userId !== session.user.id) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: existingDraft }, { status: 200 });
  } catch (error) {
    console.error("Draft get error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsedData = updateDraftSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: t("invalidData"), details: parsedData.error.flatten() }, { status: 400 });
    }

    const existingDraft = await prisma.draft.findUnique({
      where: { id }
    });

    if (!existingDraft) {
      return NextResponse.json({ error: t("draftNotFound") }, { status: 404 });
    }

    if (existingDraft.userId !== session.user.id) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    const updatePayload: any = {};
    if (parsedData.data.isTemplate !== undefined) updatePayload.isTemplate = parsedData.data.isTemplate;
    if (parsedData.data.title !== undefined) updatePayload.title = parsedData.data.title;

    const updatedDraft = await prisma.draft.update({
      where: { id },
      data: updatePayload
    });

    return NextResponse.json({ success: true, draft: updatedDraft }, { status: 200 });

  } catch (error) {
    console.error("Draft update error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator();
  try {
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
    }

    const { id } = await params;

    const existingDraft = await prisma.draft.findUnique({
      where: { id }
    });

    if (!existingDraft) {
      return NextResponse.json({ error: t("draftNotFound") }, { status: 404 });
    }

    if (existingDraft.userId !== session.user.id) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 });
    }

    await prisma.draft.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Draft deleted" }, { status: 200 });

  } catch (error) {
    console.error("Draft delete error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
