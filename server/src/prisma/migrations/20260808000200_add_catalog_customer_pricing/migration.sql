ALTER TABLE "Pooja"
RENAME COLUMN "baseAmount" TO "templeAmount";

ALTER TABLE "Pooja"
ADD COLUMN "baseAmount" DECIMAL(10,2),
ADD COLUMN "discountAmount" DECIMAL(10,2);

UPDATE "Pooja"
SET
  "baseAmount" = "templeAmount",
  "discountAmount" = "templeAmount";

ALTER TABLE "Pooja"
ALTER COLUMN "baseAmount" SET NOT NULL,
ALTER COLUMN "discountAmount" SET NOT NULL;

ALTER TABLE "Offering"
ADD COLUMN "templeAmount" DECIMAL(10,2);

UPDATE "Offering"
SET "templeAmount" = CASE
  WHEN "discountPrice" > 0 THEN "discountPrice"
  ELSE "actualPrice"
END;

ALTER TABLE "Offering"
ALTER COLUMN "templeAmount" SET NOT NULL;
