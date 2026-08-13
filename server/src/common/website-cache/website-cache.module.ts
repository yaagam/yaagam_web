import { Module } from '@nestjs/common';
import { WEBSITE_CACHE_SERVICE } from './website-cache.constants';
import { WebsiteCacheService } from './website-cache.service';

@Module({
  providers: [
    {
      provide: WEBSITE_CACHE_SERVICE,
      useClass: WebsiteCacheService,
    },
  ],
  exports: [WEBSITE_CACHE_SERVICE],
})
export class WebsiteCacheModule {}