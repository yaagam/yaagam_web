CREATE TYPE "OperatorRole" AS ENUM (
  'SUPER_ADMIN',
  'OPERATIONS',
  'FINANCE',
  'TEMPLE_MANAGER',
  'SUPPORT'
);

CREATE TABLE "operators" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "OperatorRole" NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "totp_secret" TEXT NOT NULL,
  "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMP(3),
  "last_login" TIMESTAMP(3),
  "last_login_ip" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "operators_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ops_sessions" (
  "id" TEXT NOT NULL,
  "operator_id" TEXT NOT NULL,
  "refresh_token_hash" TEXT NOT NULL,
  "ip" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "ops_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "operator_id" TEXT,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "resource_id" TEXT,
  "ip" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operators_username_key" ON "operators"("username");
CREATE INDEX "operators_role_idx" ON "operators"("role");
CREATE INDEX "operators_is_active_idx" ON "operators"("is_active");
CREATE INDEX "ops_sessions_operator_id_idx" ON "ops_sessions"("operator_id");
CREATE INDEX "ops_sessions_expires_at_idx" ON "ops_sessions"("expires_at");
CREATE INDEX "audit_logs_operator_id_idx" ON "audit_logs"("operator_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

ALTER TABLE "ops_sessions"
  ADD CONSTRAINT "ops_sessions_operator_id_fkey"
  FOREIGN KEY ("operator_id") REFERENCES "operators"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_operator_id_fkey"
  FOREIGN KEY ("operator_id") REFERENCES "operators"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;