export interface ZohoVendorAddress {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

export interface CreateZohoVendorInput {
  templeId: string;
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: ZohoVendorAddress;
}

export interface CreateZohoVendorResult {
  vendorId: string;
}

interface ZohoItemDetails {
  name: string;
  description?: string;
  sellingPrice: number;
  purchasePrice: number;
}

type PoojaZohoItemReference = {
  poojaId: string;
  offeringId?: never;
  vendorId: string;
};

type OfferingZohoItemReference = {
  offeringId: string;
  poojaId?: never;
  vendorId?: never;
};

export type CreateZohoItemInput = ZohoItemDetails &
  (PoojaZohoItemReference | OfferingZohoItemReference);

export interface CreateZohoItemResult {
  itemId: string;
}

export interface UpdateZohoVendorInput extends CreateZohoVendorInput {
  vendorId: string;
}

export type UpdateZohoItemInput = CreateZohoItemInput & {
  itemId: string;
};
export interface CompleteZohoOAuthResult {
  connected: true;
}

export interface IZohoBooksService {
  createVendor(input: CreateZohoVendorInput): Promise<CreateZohoVendorResult>;
  updateVendor(input: UpdateZohoVendorInput): Promise<void>;
  createItem(input: CreateZohoItemInput): Promise<CreateZohoItemResult>;
  updateItem(input: UpdateZohoItemInput): Promise<void>;
  completeOAuthCallback(
    code: string,
    state: string,
  ): Promise<CompleteZohoOAuthResult>;
}
