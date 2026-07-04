ALTER TABLE "Booking" ADD COLUMN "poojaDate" TIMESTAMP(3);

UPDATE "Booking" SET "poojaDate" = "bookingDate";

ALTER TABLE "Booking" ALTER COLUMN "poojaDate" SET NOT NULL;

CREATE INDEX "Booking_poojaDate_idx" ON "Booking"("poojaDate");
