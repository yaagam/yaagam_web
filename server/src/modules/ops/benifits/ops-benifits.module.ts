import { Module } from '@nestjs/common';
import { WebsiteCacheModule } from '../../../common/website-cache/website-cache.module';
import { BenifitsModule } from '../../benifits/benifits.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsBenifitsController } from './ops-benifits.controller';

@Module({
  imports: [WebsiteCacheModule, BenifitsModule, OpsAuthModule],
  controllers: [OpsBenifitsController],
})
export class OpsBenifitsModule {}
