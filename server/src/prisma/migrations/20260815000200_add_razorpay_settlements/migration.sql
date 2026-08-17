CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'SETTLED', 'PARTIAL', 'FAILED');

CREATE TABLE "RazorpaySettlement" (
  "id" TEXT NOT NULL,
  "providerSettlementId" TEXT NOT NULL,
  "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
  "amountMinor" BIGINT NOT NULL,
  "feeMinor" BIGINT NOT NULL DEFAULT 0,
  "taxMinor" BIGINT NOT NULL DEFAULT 0,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "utr" TEXT,
  "providerCreatedAt" TIMESTAMP(3) NOT NULL,
  "settledAt" TIMESTAMP(3),
  "providerPayload" JSONB NOT NULL,
  "lastErrorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RazorpaySettlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SettlementPayment" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "paymentAttemptId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "templeId" TEXT NOT NULL,
  "templePayableAmount" DECIMAL(10,2) NOT NULL,
  "razorpayFeeMinor" BIGINT NOT NULL DEFAULT 0,
  "razorpayTaxMinor" BIGINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SettlementPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SettlementVendorBill" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "templeId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "zohoBillId" TEXT,
  "status" "ZohoSyncStatus" NOT NULL DEFAULT 'PENDING',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SettlementVendorBill_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RazorpaySettlement_providerSettlementId_key" ON "RazorpaySettlement"("providerSettlementId");
CREATE INDEX "RazorpaySettlement_status_providerCreatedAt_idx" ON "RazorpaySettlement"("status", "providerCreatedAt");
CREATE UNIQUE INDEX "SettlementPayment_paymentAttemptId_key" ON "SettlementPayment"("paymentAttemptId");
CREATE UNIQUE INDEX "SettlementPayment_settlementId_paymentAttemptId_key" ON "SettlementPayment"("settlementId", "paymentAttemptId");
CREATE INDEX "SettlementPayment_settlementId_templeId_idx" ON "SettlementPayment"("settlementId", "templeId");
CREATE INDEX "SettlementPayment_bookingId_idx" ON "SettlementPayment"("bookingId");
CREATE UNIQUE INDEX "SettlementVendorBill_zohoBillId_key" ON "SettlementVendorBill"("zohoBillId");
CREATE UNIQUE INDEX "SettlementVendorBill_settlementId_templeId_key" ON "SettlementVendorBill"("settlementId", "templeId");
ALTER TABLE "SettlementPayment" ADD CONSTRAINT "SettlementPayment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "RazorpaySettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SettlementPayment" ADD CONSTRAINT "SettlementPayment_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SettlementVendorBill" ADD CONSTRAINT "SettlementVendorBill_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "RazorpaySettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD COLUMN "subscriptionId" TEXT;
CREATE INDEX "Booking_subscriptionId_poojaDate_idx" ON "Booking"("subscriptionId", "poojaDate");
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PaymentSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;