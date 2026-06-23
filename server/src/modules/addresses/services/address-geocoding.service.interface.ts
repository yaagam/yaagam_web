import type {
  AddressFromLocation,
  ReverseGeocodeInput,
} from './address.service.interface';

export interface IAddressGeocodingService {
  reverseGeocode(input: ReverseGeocodeInput): Promise<AddressFromLocation>;
}
