ALTER TABLE "Temple"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Pooja"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Temple_isActive_idx" ON "Temple"("isActive");

CREATE INDEX "Pooja_isActive_idx" ON "Pooja"("isActive");
