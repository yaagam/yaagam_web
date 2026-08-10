import { OpsAuditRetentionService } from './ops-audit-retention.service';

describe('OpsAuditRetentionService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('deletes ops audit logs older than the configured retention period', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-08T12:00:00.000Z'));
    const prismaService = {
      auditLog: { deleteMany: jest.fn().mockResolvedValue({ count: 3 }) },
    };
    const configService = {
      get: jest.fn().mockReturnValue('7'),
    };
    const logger = {
      setContext: jest.fn(),
      info: jest.fn(),
    };
    const service = new OpsAuditRetentionService(
      prismaService as never,
      configService as never,
      logger as never,
    );

    await expect(service.deleteExpiredAuditLogs()).resolves.toBe(3);
    expect(prismaService.auditLog.deleteMany).toHaveBeenCalledWith({
      where: {
        createdAt: { lt: new Date('2026-08-01T12:00:00.000Z') },
      },
    });
    expect(logger.info).toHaveBeenCalledWith(
      { deleted: 3, retentionDays: 7 },
      'expired ops audit logs deleted',
    );
  });

  it('defaults to seven days and does not log when nothing is deleted', async () => {
    const prismaService = {
      auditLog: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    const configService = {
      get: jest.fn().mockReturnValue('invalid'),
    };
    const logger = {
      setContext: jest.fn(),
      info: jest.fn(),
    };
    const service = new OpsAuditRetentionService(
      prismaService as never,
      configService as never,
      logger as never,
    );

    await expect(service.deleteExpiredAuditLogs()).resolves.toBe(0);
    expect(logger.info).not.toHaveBeenCalled();
  });
});
