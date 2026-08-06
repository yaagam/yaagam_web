CREATE TYPE "ZohoSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

ALTER TABLE "Temple"
ADD COLUMN "zohoVendorId" TEXT,
ADD COLUMN "zohoSyncStatus" "ZohoSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "zohoSyncError" TEXT,
ADD COLUMN "lastZohoSyncAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Temple_zohoVendorId_key" ON "Temple"("zohoVendorId");