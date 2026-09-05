-- Migration: add_content_archetype
-- Description: Bagian 23: Universal / Model-Agnostic Content Structure Engine
-- Menambahkan tabel ContentArchetype, relasi pada ProfileChannel, dan tracking durationSource pada Draft.

-- CreateEnum
CREATE TYPE "NarrationMode" AS ENUM ('VOICE_OVER', 'DIEGETIC_ONLY', 'SILENT_TEXT_ONLY', 'HYBRID');

-- CreateEnum
CREATE TYPE "DurationCalcMode" AS ENUM ('NARRATION_WORDCOUNT', 'SEGMENT_SELF_ESTIMATE', 'HYBRID');

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContentArchetype" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "narrationMode" "NarrationMode" NOT NULL DEFAULT 'VOICE_OVER',
    "emotionalArcTemplate" TEXT NOT NULL DEFAULT 'Hook -> Problem -> Solution -> CTA',
    "defaultIncludedSections" JSONB NOT NULL,
    "compositionCategories" JSONB NOT NULL,
    "durationCalcMode" "DurationCalcMode" NOT NULL DEFAULT 'HYBRID',
    "cameraMovementRoleMap" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentArchetype_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ContentArchetype_name_key" ON "ContentArchetype"("name");

-- AlterTable ProfileChannel
ALTER TABLE "ProfileChannel" ADD COLUMN IF NOT EXISTS "contentArchetypeId" TEXT;

-- AddForeignKey
ALTER TABLE "ProfileChannel" ADD CONSTRAINT "ProfileChannel_contentArchetypeId_fkey" FOREIGN KEY ("contentArchetypeId") REFERENCES "ContentArchetype"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Draft
ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "durationSource" TEXT;
