UPDATE "Booking"
SET "devoteeSnapshot" = (
  ("devoteeSnapshot"::jsonb - 'nakshatra') ||
  jsonb_build_object('naal', "devoteeSnapshot"::jsonb ->> 'nakshatra')
)::json
WHERE "devoteeSnapshot"::jsonb ? 'nakshatra'
  AND NOT ("devoteeSnapshot"::jsonb ? 'naal');

UPDATE "Booking"
SET "devoteeSnapshot" = ("devoteeSnapshot"::jsonb - 'nakshatra')::json
WHERE "devoteeSnapshot"::jsonb ? 'nakshatra'
  AND "devoteeSnapshot"::jsonb ? 'naal';