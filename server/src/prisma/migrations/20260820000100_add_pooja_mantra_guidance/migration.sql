ALTER TABLE "Pooja"
ADD COLUMN "mantraAudioKey" TEXT,
ADD COLUMN "mantraChantCount" INTEGER;

ALTER TABLE "PoojaTranslation"
ADD COLUMN "mantra" TEXT NOT NULL DEFAULT '',
ADD COLUMN "dos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "donts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Pooja"
ADD CONSTRAINT "Pooja_mantraChantCount_check"
CHECK ("mantraChantCount" IS NULL OR "mantraChantCount" > 0);
