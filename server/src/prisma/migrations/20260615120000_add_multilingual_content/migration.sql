-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'ML', 'HI');

-- CreateTable
CREATE TABLE "Benefit" (
    "id" TEXT NOT NULL,
    "imageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Benefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitTranslation" (
    "id" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "BenefitTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoojaTranslation" (
    "id" TEXT NOT NULL,
    "poojaId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "about" TEXT NOT NULL,

    CONSTRAINT "PoojaTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempleTranslation" (
    "id" TEXT NOT NULL,
    "templeId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "place" TEXT NOT NULL,

    CONSTRAINT "TempleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BenefitToPooja" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BenefitToPooja_AB_pkey" PRIMARY KEY ("A", "B")
);

-- Backfill existing content as English before removing legacy columns.
INSERT INTO "PoojaTranslation" ("id", "poojaId", "language", "name", "about")
SELECT "id" || '-en', "id", 'EN', "name", "about"
FROM "Pooja";

INSERT INTO "TempleTranslation" ("id", "templeId", "language", "name", "district", "place")
SELECT "id" || '-en', "id", 'EN', "name", "district", "place"
FROM "Temple";

-- AlterTable
ALTER TABLE "Pooja"
DROP COLUMN "about",
DROP COLUMN "name";

-- AlterTable
ALTER TABLE "Temple"
DROP COLUMN "district",
DROP COLUMN "name",
DROP COLUMN "place";

-- CreateIndex
CREATE INDEX "BenefitTranslation_language_idx" ON "BenefitTranslation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "BenefitTranslation_benefitId_language_key" ON "BenefitTranslation"("benefitId", "language");

-- CreateIndex
CREATE INDEX "PoojaTranslation_language_idx" ON "PoojaTranslation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "PoojaTranslation_poojaId_language_key" ON "PoojaTranslation"("poojaId", "language");

-- CreateIndex
CREATE INDEX "TempleTranslation_language_idx" ON "TempleTranslation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "TempleTranslation_templeId_language_key" ON "TempleTranslation"("templeId", "language");

-- CreateIndex
CREATE INDEX "_BenefitToPooja_B_index" ON "_BenefitToPooja"("B");

-- AddForeignKey
ALTER TABLE "BenefitTranslation" ADD CONSTRAINT "BenefitTranslation_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "Benefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoojaTranslation" ADD CONSTRAINT "PoojaTranslation_poojaId_fkey" FOREIGN KEY ("poojaId") REFERENCES "Pooja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempleTranslation" ADD CONSTRAINT "TempleTranslation_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BenefitToPooja" ADD CONSTRAINT "_BenefitToPooja_A_fkey" FOREIGN KEY ("A") REFERENCES "Benefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BenefitToPooja" ADD CONSTRAINT "_BenefitToPooja_B_fkey" FOREIGN KEY ("B") REFERENCES "Pooja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
