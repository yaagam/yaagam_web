import { PublicCatalogInterceptor } from '../../common/interceptors/public-catalog.interceptor';
import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import {
  POOJA_DETAILS_FETCHED,
  POOJA_FETCHED,
} from './constants/success-message.const';
import { POOJA_SERVICE } from './constants/service-tokens.const';
import { GetPoojasQueryDto } from './dtos/get-poojas-query.dto';
import { PoojaDetailsRequestDto } from './dtos/pooja-details.dto';
import type {
  IPoojaService,
  PaginatedPoojas,
  PoojaDetailsResponse,
} from './services/pooja.service.interface';

@Controller('poojas')
@UseInterceptors(PublicCatalogInterceptor)
export class PoojasController {
  constructor(
    @Inject(POOJA_SERVICE)
    private readonly _poojaService: IPoojaService,
  ) {}

  @Get()
  @ResponseMessage(POOJA_FETCHED)
  getPoojas(@Query() query: GetPoojasQueryDto): Promise<PaginatedPoojas> {
    return this._poojaService.getPoojas(query);
  }

  @Get(':slug')
  @ResponseMessage(POOJA_DETAILS_FETCHED)
  poojaDetails(
    @Param() params: PoojaDetailsRequestDto,
  ): Promise<PoojaDetailsResponse> {
    return this._poojaService.getPoojaDetailsBySlug(params.slug);
  }
}
