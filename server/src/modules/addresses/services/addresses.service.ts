import { Inject, Injectable } from '@nestjs/common';
import { ADDRESS_GEOCODING_SERVICE } from '../constants/service-tokens.const';
import type { IAddressGeocodingService } from './address-geocoding.service.interface';
import type {
  AddressFromLocation,
  IAddressService,
  ReverseGeocodeInput,
} from './address.service.interface';

@Injectable()
export class AddressesService implements IAddressService {
  constructor(
    @Inject(ADDRESS_GEOCODING_SERVICE)
    private readonly _addressGeocodingService: IAddressGeocodingService,
  ) {}

  getAddressFromLocation(
    input: ReverseGeocodeInput,
  ): Promise<AddressFromLocation> {
    return this._addressGeocodingService.reverseGeocode(input);
  }
}
