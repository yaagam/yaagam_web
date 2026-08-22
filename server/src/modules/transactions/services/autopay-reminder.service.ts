import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import PrismaService from '../../../prisma/prisma.service';
import { MESSAGE_SERVICE } from '../../auth/constants/service-tokens.const';
import type { IMessageService } from '../../auth/services/interfaces/message.service.interface';
import type { IAutopayReminderService } from './autopay-reminder.service.interface';

const REMINDER_LEAD_TIME_MS = 24 * 60 * 60 * 1000;
const REMINDER_INTERVAL_MS = 60 * 1000;

@Injectable()
export class AutopayReminderService
  implements IAutopayReminderService, OnModuleInit, OnModuleDestroy
{
  private readonly _logger = new Logger(AutopayReminderService.name);
  private _timer?: NodeJS.Timeout;

  constructor(
    private readonly _prismaService: PrismaService,
    @Inject(MESSAGE_SERVICE)
    private readonly _messageService: IMessageService,
  ) {}

  onModuleInit(): void {
    void this._runSafely();
    this._timer = setInterval(
      () => void this._runSafely(),
      REMINDER_INTERVAL_MS,
    );
    this._timer.unref();
  }

  onModuleDestroy(): void {
    if (this._timer) clearInterval(this._timer);
  }

  async sendDueReminders(now = new Date()): Promise<number> {
    const chargeWindowEnd = new Date(now.getTime() + REMINDER_LEAD_TIME_MS);
    const subscriptions =
      await this._prismaService.paymentSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          chargeAt: { gt: now, lte: chargeWindowEnd },
          reminderSentForChargeAt: null,
        },
        select: {
          id: true,
          chargeAt: true,
          plan: { select: { amountMinor: true } },
          transaction: {
            select: {
              booking: {
                select: {
                  bookingWhatsappNumber: true,
                  poojaSnapshot: true,
                },
              },
            },
          },
        },
        take: 100,
      });

    let sentCount = 0;
    for (const subscription of subscriptions) {
      if (!subscription.chargeAt) continue;
      const claimed = await this._prismaService.paymentSubscription.updateMany({
        where: {
          id: subscription.id,
          reminderSentForChargeAt: null,
          chargeAt: subscription.chargeAt,
        },
        data: { reminderSentForChargeAt: subscription.chargeAt },
      });
      if (!claimed.count) continue;

      try {
        await this._messageService.sendAutopayCutoffReminder({
          whatsappNumber:
            subscription.transaction.booking.bookingWhatsappNumber,
          amount: this._formatAmount(subscription.plan.amountMinor),
          poojaName: this._getPoojaName(
            subscription.transaction.booking.poojaSnapshot,
          ),
          chargeDate: this._formatIndiaDate(subscription.chargeAt),
        });
        sentCount += 1;
      } catch (error) {
        await this._prismaService.paymentSubscription.updateMany({
          where: {
            id: subscription.id,
            reminderSentForChargeAt: subscription.chargeAt,
          },
          data: { reminderSentForChargeAt: null },
        });
        this._logger.error(
          {
            subscriptionId: subscription.id,
            error: error instanceof Error ? error.message : String(error),
          },
          'autopay cutoff reminder delivery failed',
        );
      }
    }
    return sentCount;
  }

  private async _runSafely(): Promise<void> {
    try {
      await this.sendDueReminders();
    } catch (error) {
      this._logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'autopay cutoff reminder scan failed',
      );
    }
  }

  private _formatAmount(amountMinor: bigint): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amountMinor) / 100);
  }

  private _formatIndiaDate(value: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(value);
  }

  private _getPoojaName(snapshot: unknown): string {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot))
      return 'Pooja';
    const translations = (snapshot as { translations?: unknown }).translations;
    if (!Array.isArray(translations)) return 'Pooja';
    const values = translations.filter(
      (item): item is { language?: string; name?: string } =>
        Boolean(item && typeof item === 'object' && !Array.isArray(item)),
    );
    return (
      values.find((item) => item.language === 'EN')?.name?.trim() ||
      values[0]?.name?.trim() ||
      'Pooja'
    );
  }
}