ALTER TABLE "Pooja"
ADD COLUMN "zohoItemId" TEXT,
ADD COLUMN "zohoSyncStatus" "ZohoSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "zohoSyncError" TEXT,
ADD COLUMN "lastZohoSyncAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Pooja_zohoItemId_key" ON "Pooja"("zohoItemId");