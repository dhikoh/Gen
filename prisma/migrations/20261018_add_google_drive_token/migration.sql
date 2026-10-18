CREATE TABLE IF NOT EXISTS "UserGoogleDriveToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "encryptedAccess" TEXT NOT NULL,
  "encryptedRefresh" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "scopes" TEXT NOT NULL DEFAULT 'https://www.googleapis.com/auth/drive.file',
  "folderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserGoogleDriveToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
