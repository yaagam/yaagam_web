import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ADDRESS_FETCHED_FROM_LOCATION,
  SAVED_ADDRESS_FETCHED,
  SAVED_ADDRESS_UPDATED,
} from './constants/success-message.const';
import { ADDRESS_SERVICE } from './constants/service-tokens.const';
import { ReverseGeocodeQueryDto } from './dtos/reverse-geocode-query.dto';
import { SaveAddressDto } from './dtos/save-address.dto';
import type {
  AddressFromLocation,
  IAddressService,
  SavedAddress,
} from './services/address.service.interface';

interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(SAVED_ADDRESS_FETCHED)
  getSavedAddress(
    @Req() req: AuthenticatedRequest,
  ): Promise<SavedAddress | null> {
    return this._addressService.getSavedAddress(this._getUserId(req));
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(SAVED_ADDRESS_UPDATED)
  updateSavedAddress(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SaveAddressDto,
  ): Promise<SavedAddress> {
    return this._addressService.saveAddress(this._getUserId(req), {
      houseNo: dto.houseNo ?? '',
      streetName: dto.streetName,
      pincode: dto.pincode,
      district: dto.district,
      state: dto.state,
      phoneNumber: dto.phoneNumber,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(SAVED_ADDRESS_UPDATED)
  createSavedAddress(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SaveAddressDto,
  ): Promise<SavedAddress> {
    return this.updateSavedAddress(req, dto);
  }

  private _getUserId(req: AuthenticatedRequest): string {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return req.user.userId;
  }
}
