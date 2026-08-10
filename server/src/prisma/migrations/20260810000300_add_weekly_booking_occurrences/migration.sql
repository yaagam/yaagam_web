ALTER TABLE "Booking"
ADD COLUMN "activatedAt" TIMESTAMP(3),
ADD COLUMN "poojaPlatformFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "poojaPlatformFeeGstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE TABLE "BookingOccurrence" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "paymentAttemptId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "poojaDate" TIMESTAMP(3) NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'SCHEDULED',
  "amountMinor" BIGINT NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "zohoSalesOrderId" TEXT,
  "zohoInvoiceId" TEXT,
  "zohoPaymentId" TEXT,
  "zohoSyncStatus" "ZohoSyncStatus" NOT NULL DEFAULT 'PENDING',
  "zohoSyncError" TEXT,
  "lastZohoSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookingOccurrence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingOccurrence_publicId_key" ON "BookingOccurrence"("publicId");
CREATE UNIQUE INDEX "BookingOccurrence_paymentAttemptId_key" ON "BookingOccurrence"("paymentAttemptId");
CREATE UNIQUE INDEX "BookingOccurrence_zohoSalesOrderId_key" ON "BookingOccurrence"("zohoSalesOrderId");
CREATE UNIQUE INDEX "BookingOccurrence_zohoInvoiceId_key" ON "BookingOccurrence"("zohoInvoiceId");
CREATE UNIQUE INDEX "BookingOccurrence_zohoPaymentId_key" ON "BookingOccurrence"("zohoPaymentId");
CREATE UNIQUE INDEX "BookingOccurrence_bookingId_sequence_key" ON "BookingOccurrence"("bookingId", "sequence");
CREATE UNIQUE INDEX "BookingOccurrence_bookingId_poojaDate_key" ON "BookingOccurrence"("bookingId", "poojaDate");
CREATE INDEX "BookingOccurrence_bookingId_status_idx" ON "BookingOccurrence"("bookingId", "status");
CREATE INDEX "BookingOccurrence_poojaDate_status_idx" ON "BookingOccurrence"("poojaDate", "status");

ALTER TABLE "BookingOccurrence"
ADD CONSTRAINT "BookingOccurrence_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingOccurrence"
ADD CONSTRAINT "BookingOccurrence_paymentAttemptId_fkey"
FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;