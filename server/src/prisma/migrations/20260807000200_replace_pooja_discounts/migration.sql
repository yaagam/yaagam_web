ALTER TABLE "Pooja" ADD COLUMN "discountAmount" DECIMAL(10,2);

UPDATE "Pooja"
SET "discountAmount" = ROUND(
  "baseAmount" * (
    1 - LEAST(
      100,
      GREATEST(COALESCE("weeklyDiscount", 0), COALESCE("normalDiscount", 0))
    ) / 100.0
  ),
  2
);

ALTER TABLE "Pooja" ALTER COLUMN "discountAmount" SET NOT NULL;
ALTER TABLE "Pooja" DROP COLUMN "weeklyDiscount";
ALTER TABLE "Pooja" DROP COLUMN "normalDiscount";