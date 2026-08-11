import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SupportModule } from '../../support/support.module';
import { BookingsModule } from '../../bookings/bookings.module';
import { OPS_MANAGEMENT_SERVICE } from './ops-management.const';
import { OpsManagementService } from './ops-management.service';

@Module({
  imports: [PrismaModule, SupportModule, BookingsModule],
  providers: [
    { provide: OPS_MANAGEMENT_SERVICE, useClass: OpsManagementService },
  ],
  exports: [OPS_MANAGEMENT_SERVICE],
})
export class OpsManagementModule {}
