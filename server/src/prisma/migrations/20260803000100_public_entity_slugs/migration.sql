ALTER TABLE "Temple" ADD COLUMN "slug" TEXT;
ALTER TABLE "Pooja" ADD COLUMN "slug" TEXT;
ALTER TABLE "Benefit" ADD COLUMN "slug" TEXT;
ALTER TABLE "Offering" ADD COLUMN "slug" TEXT;

WITH ranked AS (
  SELECT
    t."id",
    COALESCE(
      NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(tt."name"), '[^a-z0-9]+', '-', 'g')), ''),
      'temple'
    ) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(
        NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(tt."name"), '[^a-z0-9]+', '-', 'g')), ''),
        'temple'
      )
      ORDER BY t."createdAt", t."id"
    ) AS duplicate_number
  FROM "Temple" t
  LEFT JOIN "TempleTranslation" tt
    ON tt."templeId" = t."id" AND tt."language" = 'EN'
)
UPDATE "Temple" target
SET "slug" = ranked.base_slug ||
  CASE WHEN ranked.duplicate_number = 1 THEN '' ELSE '-' || ranked.duplicate_number::TEXT END
FROM ranked
WHERE target."id" = ranked."id";

WITH ranked AS (
  SELECT
    p."id",
    COALESCE(
      NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(pt."name"), '[^a-z0-9]+', '-', 'g')), ''),
      'pooja'
    ) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(
        NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(pt."name"), '[^a-z0-9]+', '-', 'g')), ''),
        'pooja'
      )
      ORDER BY p."createdAt", p."id"
    ) AS duplicate_number
  FROM "Pooja" p
  LEFT JOIN "PoojaTranslation" pt
    ON pt."poojaId" = p."id" AND pt."language" = 'EN'
)
UPDATE "Pooja" target
SET "slug" = ranked.base_slug ||
  CASE WHEN ranked.duplicate_number = 1 THEN '' ELSE '-' || ranked.duplicate_number::TEXT END
FROM ranked
WHERE target."id" = ranked."id";

WITH ranked AS (
  SELECT
    b."id",
    COALESCE(
      NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(bt."name"), '[^a-z0-9]+', '-', 'g')), ''),
      'benefit'
    ) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(
        NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(bt."name"), '[^a-z0-9]+', '-', 'g')), ''),
        'benefit'
      )
      ORDER BY b."createdAt", b."id"
    ) AS duplicate_number
  FROM "Benefit" b
  LEFT JOIN "BenefitTranslation" bt
    ON bt."benefitId" = b."id" AND bt."language" = 'EN'
)
UPDATE "Benefit" target
SET "slug" = ranked.base_slug ||
  CASE WHEN ranked.duplicate_number = 1 THEN '' ELSE '-' || ranked.duplicate_number::TEXT END
FROM ranked
WHERE target."id" = ranked."id";

WITH ranked AS (
  SELECT
    o."id",
    COALESCE(
      NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(ot."name"), '[^a-z0-9]+', '-', 'g')), ''),
      'offering'
    ) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(
        NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(ot."name"), '[^a-z0-9]+', '-', 'g')), ''),
        'offering'
      )
      ORDER BY o."createdAt", o."id"
    ) AS duplicate_number
  FROM "Offering" o
  LEFT JOIN "OfferingTranslation" ot
    ON ot."offeringId" = o."id" AND ot."language" = 'EN'
)
UPDATE "Offering" target
SET "slug" = ranked.base_slug ||
  CASE WHEN ranked.duplicate_number = 1 THEN '' ELSE '-' || ranked.duplicate_number::TEXT END
FROM ranked
WHERE target."id" = ranked."id";

ALTER TABLE "Temple" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Pooja" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Benefit" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Offering" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Temple_slug_key" ON "Temple"("slug");
CREATE UNIQUE INDEX "Pooja_slug_key" ON "Pooja"("slug");
CREATE UNIQUE INDEX "Benefit_slug_key" ON "Benefit"("slug");
CREATE UNIQUE INDEX "Offering_slug_key" ON "Offering"("slug");
