#!/usr/bin/env node
/**
 * Data Migration Script: Draft titles → UsedTitle table
 * Run: node prisma/migrations/20260826_add_used_title_table/migrate_data.js
 * 
 * Jalankan SETELAH migration SQL berhasil diapply ke database.
 * Script ini aman untuk dijalankan berulang kali (idempotent).
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all drafts with titles...');
  const drafts = await prisma.draft.findMany({
    where: {
      title: { not: null },
      channelId: { not: null }
    },
    select: { userId: true, channelId: true, type: true, title: true, createdAt: true }
  });

  console.log(`Found ${drafts.length} drafts with titles. Migrating...`);
  let migrated = 0, skipped = 0;

  for (const d of drafts) {
    if (!d.title || !d.channelId) { skipped++; continue; }
    try {
      await prisma.usedTitle.upsert({
        where: { channelId_type_title: { channelId: d.channelId, type: d.type, title: d.title } },
        create: {
          userId: d.userId,
          channelId: d.channelId,
          type: d.type,
          title: d.title,
          createdAt: d.createdAt
        },
        update: {} // Already exists, skip
      });
      migrated++;
    } catch (e) {
      console.warn(`Skip [${d.title}]: ${e.message}`);
      skipped++;
    }
  }
  
  console.log(`Migration complete: ${migrated} migrated, ${skipped} skipped.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
