CREATE TABLE "Offering" (
    "id" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "actualPrice" DECIMAL(10,2) NOT NULL,
    "discountPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Offering_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OfferingTranslation" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "OfferingTranslation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "_OfferingToPooja" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_OfferingToPooja_AB_pkey" PRIMARY KEY ("A","B")
);
ALTER TABLE "Booking" ADD COLUMN "dakshinaAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "offeringTotal" DECIMAL(10,2) NOT NULL DEFAULT 0;
CREATE TABLE "BookingOffering" (
    "bookingId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "priceSnapshot" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "BookingOffering_pkey" PRIMARY KEY ("bookingId","offeringId")
);
CREATE INDEX "Offering_isActive_deletedAt_idx" ON "Offering"("isActive", "deletedAt");
CREATE INDEX "OfferingTranslation_language_idx" ON "OfferingTranslation"("language");
CREATE UNIQUE INDEX "OfferingTranslation_offeringId_language_key" ON "OfferingTranslation"("offeringId", "language");
CREATE INDEX "_OfferingToPooja_B_index" ON "_OfferingToPooja"("B");
CREATE INDEX "BookingOffering_offeringId_idx" ON "BookingOffering"("offeringId");
ALTER TABLE "OfferingTranslation" ADD CONSTRAINT "OfferingTranslation_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_OfferingToPooja" ADD CONSTRAINT "_OfferingToPooja_A_fkey" FOREIGN KEY ("A") REFERENCES "Offering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_OfferingToPooja" ADD CONSTRAINT "_OfferingToPooja_B_fkey" FOREIGN KEY ("B") REFERENCES "Pooja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingOffering" ADD CONSTRAINT "BookingOffering_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingOffering" ADD CONSTRAINT "BookingOffering_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
