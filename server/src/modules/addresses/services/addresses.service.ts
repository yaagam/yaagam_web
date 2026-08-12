import { Inject, Injectable } from '@nestjs/common';
import PrismaService from '../../../prisma/prisma.service';
import { ADDRESS_GEOCODING_SERVICE } from '../constants/service-tokens.const';
import type { IAddressGeocodingService } from './address-geocoding.service.interface';
import type {
  AddressFromLocation,
  IAddressService,
  ReverseGeocodeInput,
  SaveAddressInput,
  SavedAddress,
} from './address.service.interface';

@Injectable()
export class AddressesService implements IAddressService {
  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(ADDRESS_GEOCODING_SERVICE)
    private readonly _addressGeocodingService: IAddressGeocodingService,
  ) {}

  getAddressFromLocation(
    input: ReverseGeocodeInput,
  ): Promise<AddressFromLocation> {
    return this._addressGeocodingService.reverseGeocode(input);
  }

  async getSavedAddress(userId: string): Promise<SavedAddress | null> {
    const address = await this._prismaService.address.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return address ? this._toSavedAddress(address) : null;
  }

  async saveAddress(
    userId: string,
    input: SaveAddressInput,
  ): Promise<SavedAddress> {
    const current = await this._prismaService.address.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    const data = {
      houseNo: input.houseNo.trim(),
      roadName: input.streetName.trim(),
      pincode: input.pincode.trim(),
      district: input.district.trim(),
      state: input.state.trim(),
      phoneNumber: input.phoneNumber.trim(),
      isDefault: true,
    };
    const address = current
      ? await this._prismaService.address.update({
          where: { id: current.id },
          data,
        })
      : await this._prismaService.address.create({
          data: { ...data, userId },
        });

    return this._toSavedAddress(address);
  }

  private _toSavedAddress(address: {
    houseNo: string;
    roadName: string | null;
    pincode: string;
    district: string;
    state: string;
    phoneNumber: string;
  }): SavedAddress {
    return {
      houseNo: address.houseNo,
      streetName: address.roadName ?? '',
      pincode: address.pincode,
      district: address.district,
      state: address.state,
      phoneNumber: address.phoneNumber,
    };
  }
}
