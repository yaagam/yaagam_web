import { PublicCatalogInterceptor } from '../../common/interceptors/public-catalog.interceptor';
import { Controller, Get, Inject, Query, UseInterceptors } from '@nestjs/common';
import { ResponseMessage } from '../../common/decarators/success-message.decarator';
import { BENIFIT_FETCHED } from './constants/success-message.const';
import { BENIFIT_SERVICE } from './constants/service-tokens.const';
import { GetBenifitsQueryDto } from './dtos/get-benifits-query.dto';
import type {
  IBenifitService,
  PaginatedBenifits,
} from './services/benifit.service.interface';

@Controller('benifits')
@UseInterceptors(PublicCatalogInterceptor)
export class BenifitsController {
  constructor(
    @Inject(BENIFIT_SERVICE)
    private readonly _benifitService: IBenifitService,
  ) {}

  @Get()
  @ResponseMessage(BENIFIT_FETCHED)
  getBenifits(@Query() query: GetBenifitsQueryDto): Promise<PaginatedBenifits> {
    return this._benifitService.getBenifits(query);
  }
}
