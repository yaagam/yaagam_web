import { Module } from '@nestjs/common';
import { GuardsModule } from '../../common/gurads/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BlogsController } from './blogs.controller';
import {
  BLOG_REPOSITORY,
  BLOG_SERVICE,
} from './constants/service-tokens.const';
import { PrismaBlogRepository } from './repositories/prisma-blog.repository';
import { BlogService } from './services/blog.service';

@Module({
  imports: [PrismaModule, GuardsModule],
  controllers: [BlogsController],
  providers: [
    { provide: BLOG_SERVICE, useClass: BlogService },
    { provide: BLOG_REPOSITORY, useClass: PrismaBlogRepository },
  ],
  exports: [BLOG_SERVICE],
})
export class BlogsModule {}
