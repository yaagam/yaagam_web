import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AddressesController } from './addresses.controller';
import {
  ADDRESS_GEOCODING_SERVICE,
  ADDRESS_SERVICE,
} from './constants/service-tokens.const';
import { AddressesService } from './services/addresses.service';
import { NominatimGeocodingService } from './services/nominatim-geocoding.service';

@Module({
  imports: [ConfigModule],
  controllers: [AddressesController],
  providers: [
    { provide: ADDRESS_SERVICE, useClass: AddressesService },
    { provide: ADDRESS_GEOCODING_SERVICE, useClass: NominatimGeocodingService },
  ],
})
export class AddressesModule {}
