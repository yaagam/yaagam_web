CREATE TABLE "PrivacyConsent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "noticeVersion" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "withdrawnAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrivacyConsent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrivacyConsent_userId_purpose_noticeVersion_key"
  ON "PrivacyConsent"("userId", "purpose", "noticeVersion");
CREATE INDEX "PrivacyConsent_userId_purpose_withdrawnAt_idx"
  ON "PrivacyConsent"("userId", "purpose", "withdrawnAt");
ALTER TABLE "PrivacyConsent"
  ADD CONSTRAINT "PrivacyConsent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD COLUMN "devoteeAuthorityConfirmed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "devoteeAuthorityConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "privacyNoticeVersion" TEXT;