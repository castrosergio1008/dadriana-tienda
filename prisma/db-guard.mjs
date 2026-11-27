// Shared guard for code that WRITES to PostgreSQL (fixture loader and integration
// tests). It refuses any DATABASE_URL that is not explicitly local so a stale
// or mistyped local .env can never overwrite a real deployment's app_config.
// Validate before constructing a PrismaClient: no connection is attempted and
// the connection string is never written to logs.

export class FixtureGuardError extends Error {}

export const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

export function assertLocalDatabaseUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
    throw new FixtureGuardError('DATABASE_URL is required to load fixtures.');
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new FixtureGuardError('DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (url.protocol !== 'postgresql:') {
    throw new FixtureGuardError('Fixtures require a postgresql:// DATABASE_URL.');
  }
  if (!LOCAL_HOSTNAMES.has(url.hostname)) {
    throw new FixtureGuardError(
      'Refusing to load fixtures: DATABASE_URL must point to localhost or 127.0.0.1.',
    );
  }
  // Prisma connection strings can override the host via query parameters;
  // reject those overrides so the hostname check cannot be bypassed.
  if (url.searchParams.has('host') || url.searchParams.has('hostaddr')) {
    throw new FixtureGuardError(
      'Refusing to load fixtures: DATABASE_URL host overrides are not allowed.',
    );
  }

  return url;
}
