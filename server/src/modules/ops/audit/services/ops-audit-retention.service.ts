import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import PrismaService from '../../../../prisma/prisma.service';

const DEFAULT_AUDIT_LOG_RETENTION_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OpsAuditRetentionService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _configService: ConfigService,
    private readonly _logger: PinoLogger,
  ) {
    this._logger.setContext(OpsAuditRetentionService.name);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'ops-audit-log-retention',
    timeZone: 'UTC',
    waitForCompletion: true,
  })
  async deleteExpiredAuditLogs(): Promise<number> {
    const retentionDays = this._getRetentionDays();
    const createdBefore = new Date(Date.now() - retentionDays * DAY_IN_MS);
    const result = await this._prismaService.auditLog.deleteMany({
      where: { createdAt: { lt: createdBefore } },
    });

    if (result.count > 0) {
      this._logger.info(
        { deleted: result.count, retentionDays },
        'expired ops audit logs deleted',
      );
    }

    return result.count;
  }

  private _getRetentionDays(): number {
    const configuredDays = Number(
      this._configService.get<string>('OPS_AUDIT_LOG_RETENTION_DAYS'),
    );

    return Number.isInteger(configuredDays) && configuredDays > 0
      ? configuredDays
      : DEFAULT_AUDIT_LOG_RETENTION_DAYS;
  }
}
