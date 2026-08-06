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

export interface CompleteZohoOAuthResult {
  connected: true;
}

export interface IZohoBooksService {
  createVendor(input: CreateZohoVendorInput): Promise<CreateZohoVendorResult>;
  completeOAuthCallback(
    code: string,
    state: string,
  ): Promise<CompleteZohoOAuthResult>;
}
