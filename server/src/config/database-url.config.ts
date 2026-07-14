export interface IDatabaseEnvironment {
  DATABASE_URL?: string;
  NEON_DATABASE_URL?: string;
}

export interface IDatabaseUrlOptions {
  allowPlaceholder?: boolean;
}

const PLACEHOLDER_DATABASE_URL =
  'postgresql://user:password@localhost:5432/app';

function stripMatchingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function getDatabaseUrl(
  env: IDatabaseEnvironment,
  options: IDatabaseUrlOptions = {},
): string {
  const databaseUrl = env.DATABASE_URL || env.NEON_DATABASE_URL;
  const normalizedDatabaseUrl = databaseUrl
    ? stripMatchingQuotes(databaseUrl.trim())
    : '';

  if (normalizedDatabaseUrl) {
    return normalizedDatabaseUrl;
  }

  if (options.allowPlaceholder) {
    return PLACEHOLDER_DATABASE_URL;
  }

  throw new Error(
    'DATABASE_URL is required. Set DATABASE_URL in Railway variables. NEON_DATABASE_URL is supported only as a local fallback.',
  );
}
