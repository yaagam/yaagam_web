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
  TEMPLE_DETAILS_FETCHED,
  TEMPLE_FETCHED,
} from './constants/success-message.const';
import { TEMPLE_SERVICE } from './constants/service-tokens.const';
import { GetTemplesQueryDto } from './dtos/get-temples-query.dto';
import { TempleDetailsRequestDto } from './dtos/temple-details.dto';
import type {
  ITempleService,
  PaginatedTemples,
  TempleDetailsResponse,
} from './services/temple.service.interface';

@Controller('temples')
@UseInterceptors(PublicCatalogInterceptor)
export class TemplesController {
  constructor(
    @Inject(TEMPLE_SERVICE)
    private readonly _templeService: ITempleService,
  ) {}

  @Get()
  @ResponseMessage(TEMPLE_FETCHED)
  getTemples(@Query() query: GetTemplesQueryDto): Promise<PaginatedTemples> {
    return this._templeService.getTemples(query);
  }

  @Get(':slug')
  @ResponseMessage(TEMPLE_DETAILS_FETCHED)
  templeDetails(
    @Param() params: TempleDetailsRequestDto,
  ): Promise<TempleDetailsResponse> {
    return this._templeService.getTempleDetailsBySlug(params.slug!);
  }
}
