import { Module } from '@nestjs/common';
import { OpsAuthModule } from '../auth/ops-auth.module';
import { OpsSettingsController } from './ops-settings.controller';

@Module({
  imports: [OpsAuthModule],
  controllers: [OpsSettingsController],
})
export class OpsSettingsModule {}
