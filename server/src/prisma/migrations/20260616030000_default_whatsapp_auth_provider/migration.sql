-- Backfill existing WhatsApp users and keep future WhatsApp registrations explicit in code.
UPDATE "User"
SET "provider" = 'WHATSAPP'
WHERE "provider" IS NULL AND "whatsappNumber" IS NOT NULL;
