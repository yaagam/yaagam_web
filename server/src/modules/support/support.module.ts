import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GuardsModule } from '../../common/gurads/guards.module';
import { PrismaModule } from '../../prisma/prisma.module';
import {
  SUPPORT_SERVICE,
  SUPPORT_TICKET_CLEANUP_SERVICE,
  SUPPORT_TICKET_REPOSITORY,
} from './constants/service-tokens.const';
import { SUPPORT_TICKET_QUEUE } from './constants/support-ticket-queue.const';
import { SupportController } from './controllers/support.controller';
import { SupportTicketProcessor } from './processors/support-ticket.processor';
import { PrismaSupportTicketRepository } from './repositories/prisma-support-ticket.repository';
import { SupportService } from './services/support.service';
import { SupportTicketCleanupService } from './services/support-ticket-cleanup.service';

@Module({
  imports: [
    PrismaModule,
    GuardsModule,
    BullModule.registerQueue({ name: SUPPORT_TICKET_QUEUE }),
  ],
  controllers: [SupportController],
  providers: [
    { provide: SUPPORT_SERVICE, useClass: SupportService },
    {
      provide: SUPPORT_TICKET_REPOSITORY,
      useClass: PrismaSupportTicketRepository,
    },
    {
      provide: SUPPORT_TICKET_CLEANUP_SERVICE,
      useClass: SupportTicketCleanupService,
    },
    SupportTicketProcessor,
  ],
  exports: [SUPPORT_TICKET_REPOSITORY, SUPPORT_TICKET_CLEANUP_SERVICE],
})
export class SupportModule {}
