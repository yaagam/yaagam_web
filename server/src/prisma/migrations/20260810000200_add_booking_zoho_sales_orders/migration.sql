ALTER TABLE "User"
ADD COLUMN "zohoCustomerId" TEXT;

ALTER TABLE "Booking"
ADD COLUMN "zohoSalesOrderId" TEXT,
ADD COLUMN "zohoSyncStatus" "ZohoSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "zohoSyncError" TEXT,
ADD COLUMN "lastZohoSyncAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_zohoCustomerId_key" ON "User"("zohoCustomerId");
CREATE UNIQUE INDEX "Booking_zohoSalesOrderId_key" ON "Booking"("zohoSalesOrderId");