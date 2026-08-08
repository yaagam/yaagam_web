import type { Offering, OfferingTranslation } from '@prisma/client';

export type OfferingEntity = Offering & {
  translations: OfferingTranslation[];
  _count?: { poojas: number };
};

type ZohoOfferingFields = Pick<
  Offering,
  'zohoItemId' | 'zohoSyncStatus' | 'zohoSyncError' | 'lastZohoSyncAt'
>;

export type OfferingResponse = Omit<
  OfferingEntity,
  'imageKey' | 'templeAmount' | keyof ZohoOfferingFields
> & {
  imageUrl: string | null;
};

export type OpsOfferingResponse = OfferingResponse &
  ZohoOfferingFields & {
    templeAmount: Offering['templeAmount'];
  };
