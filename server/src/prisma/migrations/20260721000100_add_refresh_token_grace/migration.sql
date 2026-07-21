ALTER TABLE "sessions"
ADD COLUMN "previous_refresh_token_hash" TEXT,
ADD COLUMN "previous_refresh_token_expiry" TIMESTAMP(3);