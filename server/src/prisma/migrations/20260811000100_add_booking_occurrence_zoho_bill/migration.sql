ALTER TABLE "BookingOccurrence"
ADD COLUMN "zohoBillId" TEXT;

CREATE UNIQUE INDEX "BookingOccurrence_zohoBillId_key"
ON "BookingOccurrence"("zohoBillId");
