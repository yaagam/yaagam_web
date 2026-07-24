import { PrismaPg } from '@prisma/adapter-pg';
import { OperatorRole, PrismaClient } from '@prisma/client';
import { hash } from 'argon2';
import { generateSecret, generateURI } from 'otplib';
import { getDatabaseUrl } from '../../config/database-url.config';

interface SuperAdminSeedConfig {
  username: string;
  password: string;
  issuer: string;
  totpPeriodSeconds: number;
}

const MIN_PASSWORD_LENGTH = 12;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function getSeedConfig(): SuperAdminSeedConfig {
  const username = getRequiredEnv('SUPER_ADMIN_USERNAME').toLowerCase();
  const password = getRequiredEnv('SUPER_ADMIN_PASSWORD');

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `SUPER_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  return {
    username,
    password,
    issuer: process.env.OPS_TOTP_ISSUER?.trim() || 'Yaagam Operations',
    totpPeriodSeconds: Number(process.env.OPS_TOTP_PERIOD_SECONDS ?? 60),
  };
}

async function seedSuperAdmin(): Promise<void> {
  const config = getSeedConfig();
  const databaseUrl = getDatabaseUrl({
    DATABASE_URL: process.env.DATABASE_URL,
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
  });
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const existingOperator = await prisma.operator.findUnique({
      where: { username: config.username },
      select: { id: true, role: true },
    });

    if (existingOperator) {
      throw new Error(
        `Operator "${config.username}" already exists with role ${existingOperator.role}`,
      );
    }

    const totpSecret = generateSecret();
    const passwordHash = (await hash(config.password)) as string;
    const operator = await prisma.operator.create({
      data: {
        username: config.username,
        passwordHash,
        role: OperatorRole.SUPER_ADMIN,
        isActive: true,
        totpSecret,
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });
    const totpUri = generateURI({
      issuer: config.issuer,
      label: config.username,
      secret: totpSecret,
      period: config.totpPeriodSeconds,
    });

    console.log('Super admin created');
    console.log(`id: ${operator.id}`);
    console.log(`username: ${operator.username}`);
    console.log(`role: ${operator.role}`);
    console.log(`totpSecret: ${totpSecret}`);
    console.log(`totpUri: ${totpUri}`);
  } finally {
    await prisma.$disconnect();
  }
}

void seedSuperAdmin().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Failed to seed super admin: ${message}`);
  process.exitCode = 1;
});
