import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AddressFromLocation,
  ReverseGeocodeInput,
} from './address.service.interface';
import type { IAddressGeocodingService } from './address-geocoding.service.interface';

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
}

interface NominatimReverseGeocodeResponse {
  display_name?: string;
  address?: NominatimAddress;
  error?: string;
}

@Injectable()
export class NominatimGeocodingService implements IAddressGeocodingService {
  private readonly _logger = new Logger(NominatimGeocodingService.name);

  constructor(private readonly _configService: ConfigService) {}

  async reverseGeocode({
    latitude,
    longitude,
  }: ReverseGeocodeInput): Promise<AddressFromLocation> {
    const url = new URL(
      this._configService.get<string>('GEOCODING_REVERSE_URL') ??
        'https://nominatim.openstreetmap.org/reverse',
    );
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', latitude.toString());
    url.searchParams.set('lon', longitude.toString());
    url.searchParams.set('addressdetails', '1');

    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            this._configService.get<string>('GEOCODING_USER_AGENT') ??
            'YaagamWebServer/1.0',
        },
      });
    } catch (error) {
      this._logger.error(
        `Unable to reach reverse geocoding provider for latitude=${latitude}, longitude=${longitude}, url=${url.toString()}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadGatewayException('Unable to fetch address from location');
    }

    if (!response.ok) {
      const body = await this._readResponseBody(response);
      this._logger.error(
        `Reverse geocoding provider failed for latitude=${latitude}, longitude=${longitude}, status=${response.status}, body=${body}`,
      );
      throw new BadGatewayException('Unable to fetch address from location');
    }

    let data: NominatimReverseGeocodeResponse;

    try {
      data = (await response.json()) as NominatimReverseGeocodeResponse;
    } catch (error) {
      this._logger.error(
        `Unable to parse reverse geocoding provider response for latitude=${latitude}, longitude=${longitude}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadGatewayException('Unable to fetch address from location');
    }

    if (data.error || !data.address || !data.display_name) {
      this._logger.warn(
        `Reverse geocoding provider returned no address for latitude=${latitude}, longitude=${longitude}, response=${JSON.stringify(data)}`,
      );
      throw new NotFoundException('Address not found for current location');
    }

    return this._createAddressFromLocation(data);
  }

  private async _readResponseBody(response: Response): Promise<string> {
    try {
      return (await response.text()).slice(0, 1000);
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  private _createAddressFromLocation(
    data: NominatimReverseGeocodeResponse,
  ): AddressFromLocation {
    const address = data.address;

    return {
      houseNo: address?.house_number ?? null,
      roadName:
        address?.road ??
        address?.pedestrian ??
        address?.suburb ??
        address?.city ??
        address?.town ??
        address?.village ??
        null,
      state: address?.state ?? null,
      district:
        address?.state_district ??
        address?.county ??
        address?.city ??
        address?.town ??
        address?.village ??
        null,
      pincode: address?.postcode ?? null,
      formattedAddress: data.display_name ?? '',
    };
  }
}
