-- Migration: add_used_title_table
-- Description: Tambah tabel UsedTitle yang terpisah dari Draft
-- agar judul yang sudah dipakai tidak hilang saat draft dihapus.
-- Jalankan: npx prisma migrate deploy (di server production)

CREATE TABLE IF NOT EXISTS "UsedTitle" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsedTitle_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UsedTitle_channelId_type_title_key" UNIQUE ("channelId", "type", "title")
);

CREATE INDEX IF NOT EXISTS "UsedTitle_channelId_type_idx" ON "UsedTitle"("channelId", "type");
CREATE INDEX IF NOT EXISTS "UsedTitle_userId_idx" ON "UsedTitle"("userId");

ALTER TABLE "UsedTitle"
    ADD CONSTRAINT "UsedTitle_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UsedTitle"
    ADD CONSTRAINT "UsedTitle_channelId_fkey"
    FOREIGN KEY ("channelId") REFERENCES "ProfileChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: Salin judul dari Draft ke UsedTitle (deduplicated)
-- Ini menyalin semua draft yang punya title dan channelId,
-- sehingga exclude list AI tidak kehilangan data historis.
INSERT INTO "UsedTitle" ("id", "userId", "channelId", "type", "title", "createdAt")
SELECT
    gen_random_uuid()::TEXT,
    d."userId",
    d."channelId",
    d."type"::TEXT,
    d."title",
    d."createdAt"
FROM "Draft" d
WHERE d."title" IS NOT NULL
  AND d."title" != ''
  AND d."channelId" IS NOT NULL
ON CONFLICT ("channelId", "type", "title") DO NOTHING;
