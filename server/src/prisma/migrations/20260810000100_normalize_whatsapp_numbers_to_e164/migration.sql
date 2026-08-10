UPDATE "User" AS target_user
SET "whatsappNumber" = '+91' || target_user."whatsappNumber"
WHERE target_user."whatsappNumber" ~ '^[6-9][0-9]{9}$'
  AND NOT EXISTS (
    SELECT 1
    FROM "User" AS canonical_user
    WHERE canonical_user."whatsappNumber" = '+91' || target_user."whatsappNumber"
  );