-- Migration: add_draft_generation_config
-- Menambah snapshot pengaturan Generator Studio pada Draft (additive, aman dijalankan ulang).
ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "generationConfig" JSONB;
