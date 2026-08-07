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

export interface CreateZohoItemInput {
  poojaId: string;
  vendorId: string;
  name: string;
  description?: string;
  rate: number;
}

export interface CreateZohoItemResult {
  itemId: string;
}

export interface UpdateZohoVendorInput extends CreateZohoVendorInput {
  vendorId: string;
}

export interface UpdateZohoItemInput extends CreateZohoItemInput {
  itemId: string;
}
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
