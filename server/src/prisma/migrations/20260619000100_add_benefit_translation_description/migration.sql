ALTER TABLE "BenefitTranslation"
ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

ALTER TABLE "BenefitTranslation"
ALTER COLUMN "description" DROP DEFAULT;
