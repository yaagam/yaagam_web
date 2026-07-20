import { Injectable } from '@nestjs/common';
import PrismaService from '../../../../prisma/prisma.service';
import type {
  AuditLogInput,
  IOpsAuditService,
} from '../interfaces/ops-audit.service.interface';

@Injectable()
export class OpsAuditService implements IOpsAuditService {
  constructor(private readonly _prismaService: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    await this._prismaService.auditLog.create({
      data: {
        operatorId: input.operatorId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }
}
