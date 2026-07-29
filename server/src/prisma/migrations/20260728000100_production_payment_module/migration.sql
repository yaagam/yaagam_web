-- CreateEnum
CREATE TYPE "PaymentOrderStatus" AS ENUM ('CREATING', 'CREATED', 'ATTEMPTED', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentQrStatus" AS ENUM ('CREATING', 'ACTIVE', 'CLOSED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('CREATING', 'CREATED', 'AUTHENTICATED', 'ACTIVE', 'PAUSED', 'HALTED', 'CANCELLED', 'COMPLETED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "MandateStatus" AS ENUM ('PENDING', 'AUTHENTICATED', 'ACTIVE', 'REVOKED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "IdempotencyStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "PaymentStatus" ADD VALUE 'AUTHORIZED';
ALTER TYPE "PaymentStatus" ADD VALUE 'CAPTURED';
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "PaymentStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "publicId" TEXT;
UPDATE "Booking" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;
ALTER TABLE "Booking" ALTER COLUMN "publicId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "publicId" TEXT,
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
UPDATE "Transaction" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;
ALTER TABLE "Transaction" ALTER COLUMN "publicId" SET NOT NULL;

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "receipt" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "PaymentOrderStatus" NOT NULL,
    "metadata" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentQrCode" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "providerQrId" TEXT,
    "imageUrl" TEXT,
    "status" "PaymentQrStatus" NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentQrCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "paymentOrderId" TEXT,
    "providerPaymentId" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "providerStatus" TEXT,
    "providerPayload" JSONB,
    "failureCode" TEXT,
    "failureReason" TEXT,
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRefund" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "providerRefundId" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "RefundStatus" NOT NULL,
    "reason" TEXT,
    "providerPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "providerPlanId" TEXT,
    "name" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSubscription" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "providerSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL,
    "totalCount" INTEGER,
    "paidCount" INTEGER NOT NULL DEFAULT 0,
    "chargeAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMandate" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "providerMandateId" TEXT,
    "status" "MandateStatus" NOT NULL,
    "validUntil" TIMESTAMP(3),
    "providerPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMandate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "signatureDigest" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processingStatus" "WebhookProcessingStatus" NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIdempotencyKey" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" "IdempotencyStatus" NOT NULL,
    "responseCode" INTEGER,
    "responseBody" JSONB,
    "resourceId" TEXT,
    "lockedUntil" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAuditLog" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "correlationId" TEXT,
    "previousState" JSONB,
    "nextState" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_publicId_key" ON "PaymentOrder"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_providerOrderId_key" ON "PaymentOrder"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_receipt_key" ON "PaymentOrder"("receipt");

-- CreateIndex
CREATE INDEX "PaymentOrder_transactionId_status_idx" ON "PaymentOrder"("transactionId", "status");

-- CreateIndex
CREATE INDEX "PaymentOrder_status_expiresAt_idx" ON "PaymentOrder"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentQrCode_publicId_key" ON "PaymentQrCode"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentQrCode_providerQrId_key" ON "PaymentQrCode"("providerQrId");

-- CreateIndex
CREATE INDEX "PaymentQrCode_paymentOrderId_status_idx" ON "PaymentQrCode"("paymentOrderId", "status");

-- CreateIndex
CREATE INDEX "PaymentQrCode_status_expiresAt_idx" ON "PaymentQrCode"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_publicId_key" ON "PaymentAttempt"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_providerPaymentId_key" ON "PaymentAttempt"("providerPaymentId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_transactionId_status_idx" ON "PaymentAttempt"("transactionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_publicId_key" ON "PaymentRefund"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_providerRefundId_key" ON "PaymentRefund"("providerRefundId");

-- CreateIndex
CREATE INDEX "PaymentRefund_transactionId_status_idx" ON "PaymentRefund"("transactionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPlan_publicId_key" ON "PaymentPlan"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPlan_providerPlanId_key" ON "PaymentPlan"("providerPlanId");

-- CreateIndex
CREATE INDEX "PaymentPlan_isActive_amountMinor_currency_idx" ON "PaymentPlan"("isActive", "amountMinor", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSubscription_publicId_key" ON "PaymentSubscription"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSubscription_providerSubscriptionId_key" ON "PaymentSubscription"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "PaymentSubscription_transactionId_status_idx" ON "PaymentSubscription"("transactionId", "status");

-- CreateIndex
CREATE INDEX "PaymentSubscription_status_chargeAt_idx" ON "PaymentSubscription"("status", "chargeAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMandate_publicId_key" ON "PaymentMandate"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMandate_subscriptionId_key" ON "PaymentMandate"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMandate_providerMandateId_key" ON "PaymentMandate"("providerMandateId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhookEvent_providerEventId_key" ON "PaymentWebhookEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_processingStatus_nextRetryAt_idx" ON "PaymentWebhookEvent"("processingStatus", "nextRetryAt");

-- CreateIndex
CREATE INDEX "PaymentIdempotencyKey_expiresAt_idx" ON "PaymentIdempotencyKey"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIdempotencyKey_ownerId_operation_keyHash_key" ON "PaymentIdempotencyKey"("ownerId", "operation", "keyHash");

-- CreateIndex
CREATE INDEX "PaymentAuditLog_aggregateType_aggregateId_createdAt_idx" ON "PaymentAuditLog"("aggregateType", "aggregateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_publicId_key" ON "Booking"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_publicId_key" ON "Transaction"("publicId");

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentQrCode" ADD CONSTRAINT "PaymentQrCode_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSubscription" ADD CONSTRAINT "PaymentSubscription_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSubscription" ADD CONSTRAINT "PaymentSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PaymentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMandate" ADD CONSTRAINT "PaymentMandate_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PaymentSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PaymentInvoice" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "paymentAttemptId" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentInvoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PaymentInvoice_publicId_key" ON "PaymentInvoice"("publicId");
CREATE UNIQUE INDEX "PaymentInvoice_invoiceNumber_key" ON "PaymentInvoice"("invoiceNumber");
CREATE UNIQUE INDEX "PaymentInvoice_paymentAttemptId_key" ON "PaymentInvoice"("paymentAttemptId");
CREATE INDEX "PaymentInvoice_transactionId_issuedAt_idx" ON "PaymentInvoice"("transactionId", "issuedAt");
ALTER TABLE "PaymentInvoice" ADD CONSTRAINT "PaymentInvoice_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentInvoice" ADD CONSTRAINT "PaymentInvoice_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
