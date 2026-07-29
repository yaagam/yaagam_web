CREATE TABLE "BookingDevotee" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "naal" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDevotee_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingDevotee_bookingId_position_key"
ON "BookingDevotee"("bookingId", "position");

CREATE INDEX "BookingDevotee_bookingId_idx"
ON "BookingDevotee"("bookingId");

ALTER TABLE "BookingDevotee"
ADD CONSTRAINT "BookingDevotee_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "BookingDevotee" (
    "id", "bookingId", "name", "naal", "position", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid(),
    "id",
    "devoteeSnapshot"->>'name',
    "devoteeSnapshot"->>'naal',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Booking"
WHERE NULLIF("devoteeSnapshot"->>'name', '') IS NOT NULL
  AND NULLIF("devoteeSnapshot"->>'naal', '') IS NOT NULL;