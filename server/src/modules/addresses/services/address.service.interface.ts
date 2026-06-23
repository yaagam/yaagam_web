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

export interface IAddressService {
  getAddressFromLocation(
    input: ReverseGeocodeInput,
  ): Promise<AddressFromLocation>;
}
