const { spawnSync } = require('node:child_process');
const { Client } = require('pg');

const FAILED_MIGRATION =
  '20260810000100_normalize_whatsapp_numbers_to_e164';
const prismaCommand = process.platform === 'win32' ? 'prisma.cmd' : 'prisma';

function runPrisma(args) {
  const result = spawnSync(prismaCommand, args, {
    encoding: 'utf8',
    env: process.env,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;

  return result.status ?? 1;
}

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL is required for migration recovery');
  const trimmed = value.trim();
  const hasMatchingQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  return hasMatchingQuotes ? trimmed.slice(1, -1) : trimmed;
}

async function hasKnownFailedMigration() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    const result = await client.query(
      `SELECT 1
       FROM "_prisma_migrations"
       WHERE "migration_name" = $1
         AND "finished_at" IS NULL
         AND "rolled_back_at" IS NULL
       LIMIT 1`,
      [FAILED_MIGRATION],
    );
    return result.rowCount === 1;
  } finally {
    await client.end();
  }
}

async function main() {
  const firstDeployStatus = runPrisma(['migrate', 'deploy']);
  if (firstDeployStatus === 0) return;

  if (!(await hasKnownFailedMigration())) {
    process.exitCode = firstDeployStatus;
    return;
  }

  console.warn(
    `Recovering known rolled-back migration ${FAILED_MIGRATION} before retrying deployment.`,
  );
  const resolutionStatus = runPrisma([
    'migrate',
    'resolve',
    '--rolled-back',
    FAILED_MIGRATION,
  ]);
  if (resolutionStatus !== 0) {
    process.exitCode = resolutionStatus;
    return;
  }

  process.exitCode = runPrisma(['migrate', 'deploy']);
}

main().catch((error) => {
  console.error('Railway migration recovery failed', error);
  process.exitCode = 1;
});