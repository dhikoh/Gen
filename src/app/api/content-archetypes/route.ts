import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/db";
import { getApiTranslator } from "@/lib/apiI18n";

export async function GET() {
  const t = await getApiTranslator();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: t("unauthorized") }, { status: 401 });
  }

  try {
    let archetypes = await prisma.contentArchetype.findMany({
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });

    // Fail-safe auto-seed if empty
    if (archetypes.length === 0) {
      const defaultArchetypes = [
        {
          name: "Marketing/Edukasi Standar",
          description: "Format standar konten video marketing & edukasi dengan Hook, Problem, Solution, dan CTA.",
          narrationMode: "VOICE_OVER" as const,
          emotionalArcTemplate: "Hook -> Problem -> Solution -> CTA",
          defaultIncludedSections: { hook: true, cta: true, caption: true, thumbnail: true },
          compositionCategories: [
            { label: "Edukasi/Informasi", required: true },
            { label: "Hiburan/Storytelling", required: true },
            { label: "Marketing/CTA", required: true },
          ],
          durationCalcMode: "HYBRID" as const,
          isSystem: true,
        },
        {
          name: "Nostalgia Reconstruction / Faceless",
          description: "Format video rekonstruksi historis / faceless / diegetic tanpa voice-over luar, fokus pada visual storytelling dan SFX.",
          narrationMode: "DIEGETIC_ONLY" as const,
          emotionalArcTemplate: "Setup -> Recognition -> Emotional Payoff",
          defaultIncludedSections: { hook: false, cta: false, caption: true, thumbnail: true },
          compositionCategories: [],
          durationCalcMode: "SEGMENT_SELF_ESTIMATE" as const,
          isSystem: true,
        },
      ];

      for (const item of defaultArchetypes) {
        await prisma.contentArchetype.upsert({
          where: { name: item.name },
          update: { isSystem: true },
          create: item,
        });
      }

      archetypes = await prisma.contentArchetype.findMany({
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      });
    }

    return NextResponse.json({ success: true, archetypes });
  } catch (error) {
    console.error("GET content-archetypes error:", error);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
