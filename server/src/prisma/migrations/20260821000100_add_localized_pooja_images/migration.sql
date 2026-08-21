ALTER TABLE "PoojaTranslation"
ADD COLUMN "imageKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "PoojaTranslation" AS translation
SET "imageKeys" = pooja."imageKeys"
FROM "Pooja" AS pooja
WHERE translation."poojaId" = pooja."id"
  AND translation."language" = 'EN';
