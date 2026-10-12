-- Migration: add_storyboard
-- Additive & idempotent: aman dijalankan ulang.
ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "storyboard" JSONB;

CREATE TABLE IF NOT EXISTS "StoryboardPanel" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sceneNumber" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "thumbKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL DEFAULT 'image/webp',
    "bytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoryboardPanel_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StoryboardPanel_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryboardPanel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "StoryboardPanel_storageKey_key" ON "StoryboardPanel"("storageKey");
CREATE UNIQUE INDEX IF NOT EXISTS "StoryboardPanel_draftId_sceneNumber_key" ON "StoryboardPanel"("draftId", "sceneNumber");
CREATE INDEX IF NOT EXISTS "StoryboardPanel_draftId_idx" ON "StoryboardPanel"("draftId");
CREATE INDEX IF NOT EXISTS "StoryboardPanel_userId_idx" ON "StoryboardPanel"("userId");
