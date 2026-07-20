import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'argon2';
import { generateSecret, generateURI } from 'otplib';
import PrismaService from '../../../prisma/prisma.service';
import type { CreateOperatorDto } from './create-operator.dto';
import type {
  CreatedOperatorOutput,
  IOpsUsersService,
  OperatorListItem,
} from './ops-users.service.interface';

@Injectable()
export class OpsUsersService implements IOpsUsersService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _configService: ConfigService,
  ) {}

  async createOperator(dto: CreateOperatorDto): Promise<CreatedOperatorOutput> {
    const username = dto.username.trim().toLowerCase();
    const totpSecret = generateSecret();
    const passwordHash = (await hash(dto.password)) as string;
    const operator = await this._prismaService.operator.create({
      data: {
        username,
        passwordHash,
        role: dto.role,
        isActive: dto.isActive ?? true,
        totpSecret,
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      ...operator,
      totpSecret,
      totpUri: generateURI({
        issuer:
          this._configService.get<string>('OPS_TOTP_ISSUER') ??
          'Yaagam Operations',
        label: username,
        secret: totpSecret,
      }),
    };
  }

  getOperators(): Promise<OperatorListItem[]> {
    return this._prismaService.operator.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
