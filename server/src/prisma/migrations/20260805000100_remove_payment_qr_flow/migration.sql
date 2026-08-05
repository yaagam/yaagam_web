-- One-time payments now use the provider checkout order exclusively.
DROP TABLE IF EXISTS "PaymentQrCode";
DROP TYPE IF EXISTS "PaymentQrStatus";
