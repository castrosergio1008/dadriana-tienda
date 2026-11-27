import { describe, expect, it } from 'vitest';

import {
  assertLocalDatabaseUrl,
  FixtureGuardError,
  LOCAL_HOSTNAMES,
} from '../../prisma/db-guard.mjs';

describe('assertLocalDatabaseUrl', () => {
  it('rejects a production hostname', () => {
    const productionUrl = 'postgresql://user@prod.example.com/db';

    expect(() => assertLocalDatabaseUrl(productionUrl)).toThrow(FixtureGuardError);
    expect(() => assertLocalDatabaseUrl(productionUrl)).toThrow(
      /DATABASE_URL must point to localhost or 127\.0\.0\.1/,
    );
  });

  it('rejects host and hostaddr query overrides on an otherwise local URL', () => {
    expect(() =>
      assertLocalDatabaseUrl('postgresql://mvp@localhost:5432/mvp_test?host=prod.example.com'),
    ).toThrow(FixtureGuardError);
    expect(() =>
      assertLocalDatabaseUrl('postgresql://mvp@localhost:5432/mvp_test?hostaddr=10.0.0.5'),
    ).toThrow(/host overrides are not allowed/);
  });

  it('rejects missing, malformed and non-PostgreSQL URLs', () => {
    expect(() => assertLocalDatabaseUrl(undefined)).toThrow(FixtureGuardError);
    expect(() => assertLocalDatabaseUrl('not a url')).toThrow(
      /DATABASE_URL must be a valid PostgreSQL URL/,
    );
    expect(() => assertLocalDatabaseUrl('mysql://user@localhost:3306/db')).toThrow(
      /Fixtures require a postgresql:\/\/ DATABASE_URL/,
    );
  });

  it('accepts an explicit loopback PostgreSQL URL', () => {
    const url = assertLocalDatabaseUrl('postgresql://mvp@127.0.0.1:5432/mvp_test');

    expect(url.protocol).toBe('postgresql:');
    expect(url.hostname).toBe('127.0.0.1');
    expect(url.pathname).toBe('/mvp_test');
    expect(LOCAL_HOSTNAMES.has(url.hostname)).toBe(true);
  });
});
