export interface ReverseGeocodeInput {
  latitude: number;
  longitude: number;
}

export interface AddressFromLocation {
  houseNo: string | null;
  roadName: string | null;
  state: string | null;
  district: string | null;
  pincode: string | null;
  formattedAddress: string;
}

export interface SavedAddress {
  houseNo: string;
  streetName: string;
  pincode: string;
  district: string;
  state: string;
  phoneNumber: string;
}

export type SaveAddressInput = SavedAddress;

export interface IAddressService {
  getAddressFromLocation(
    input: ReverseGeocodeInput,
  ): Promise<AddressFromLocation>;
  getSavedAddress(userId: string): Promise<SavedAddress | null>;
  saveAddress(userId: string, input: SaveAddressInput): Promise<SavedAddress>;
}
