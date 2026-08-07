ALTER TABLE "Booking"
ADD COLUMN "platformFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "platformFeeGstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "templePayableAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE "BookingOffering"
ADD COLUMN "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "platformFeeGst" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "Booking"
SET "templePayableAmount" = "finalAmount"
WHERE "templePayableAmount" = 0;

ALTER TABLE "Pooja" DROP COLUMN "discountAmount";