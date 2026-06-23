import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { ADDRESS_FETCHED_FROM_LOCATION } from './constants/success-message.const';
import { ADDRESS_SERVICE } from './constants/service-tokens.const';
import { ReverseGeocodeQueryDto } from './dtos/reverse-geocode-query.dto';
import type {
  AddressFromLocation,
  IAddressService,
} from './services/address.service.interface';

@Controller('addresses')
export class AddressesController {
  constructor(
    @Inject(ADDRESS_SERVICE)
    private readonly _addressService: IAddressService,
  ) {}

  @Get('reverse-geocode')
  @ResponseMessage(ADDRESS_FETCHED_FROM_LOCATION)
  reverseGeocode(
    @Query() query: ReverseGeocodeQueryDto,
  ): Promise<AddressFromLocation> {
    return this._addressService.getAddressFromLocation(query);
  }
}
