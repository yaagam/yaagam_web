UPDATE User
SET whatsappNumber = '+91' || whatsappNumber
WHERE whatsappNumber ~ '^[6-9][0-9]{9}$'
  AND NOT EXISTS (
    SELECT 1
    FROM User AS canonical_user
    WHERE canonical_user.whatsappNumber = '+91' || User.whatsappNumber
  );
