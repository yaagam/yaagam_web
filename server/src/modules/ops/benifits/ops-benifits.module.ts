import { Module } from '@nestjs/common';
import { BenifitsModule } from '../../benifits/benifits.module';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsBenifitsController } from './ops-benifits.controller';

@Module({ imports: [BenifitsModule, OpsAuthModule], controllers: [OpsBenifitsController] })
export class OpsBenifitsModule {}
