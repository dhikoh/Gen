-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "usernameLower" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailLower" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneNormalized" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingPlanId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingPlanEffectiveAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_usernameLower_key" ON "User"("usernameLower");
CREATE UNIQUE INDEX IF NOT EXISTS "User_emailLower_key" ON "User"("emailLower");
CREATE UNIQUE INDEX IF NOT EXISTS "User_phoneNormalized_key" ON "User"("phoneNormalized");

-- Populate existing User lowercase fields
UPDATE "User" SET "usernameLower" = LOWER("username") WHERE "usernameLower" IS NULL;
UPDATE "User" SET "emailLower" = LOWER("email") WHERE "emailLower" IS NULL;

-- AlterTable Plan
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "periodDays" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "trialDays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Draft
ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "isStub" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable AdminAuditLog
CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "beforeData" JSONB,
    "afterData" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorId_idx" ON "AdminAuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- CreateTable EmailLog
CREATE TABLE IF NOT EXISTS "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmailLog_recipient_idx" ON "EmailLog"("recipient");
CREATE INDEX IF NOT EXISTS "EmailLog_status_idx" ON "EmailLog"("status");
