import type { Offering, OfferingTranslation } from '@prisma/client';

export type OfferingEntity = Offering & {
  translations: OfferingTranslation[];
  _count?: { poojas: number };
};

export type OfferingResponse = OfferingEntity & { imageUrl: string | null };
