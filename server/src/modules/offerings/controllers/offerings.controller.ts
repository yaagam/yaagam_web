import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ResponseMessage } from '../../../common/decarators/success-message.decarator';
import {
  OFFERING_DETAILS_FETCHED,
  OFFERINGS_FETCHED,
} from '../constants/success-message.const';
import { OFFERING_SERVICE } from '../constants/service-tokens.const';
import { GetOfferingsQueryDto } from '../dto/get-offerings-query.dto';
import { OfferingDetailsRequestDto } from '../dto/offering-details.dto';
import type { OfferingResponse } from '../entities/offering.entity';
import type {
  IOfferingService,
  PaginatedOfferings,
} from '../services/offering.service.interface';

@Controller('offerings')
export class OfferingsController {
  constructor(
    @Inject(OFFERING_SERVICE)
    private readonly _offeringService: IOfferingService,
  ) {}

  @Get()
  @ResponseMessage(OFFERINGS_FETCHED)
  getOfferings(
    @Query() query: GetOfferingsQueryDto,
  ): Promise<PaginatedOfferings> {
    return this._offeringService.getOfferings(query);
  }

  @Get(':id')
  @ResponseMessage(OFFERING_DETAILS_FETCHED)
  getOffering(
    @Param() params: OfferingDetailsRequestDto,
  ): Promise<OfferingResponse> {
    return this._offeringService.getOfferingDetails(params.id);
  }
}
