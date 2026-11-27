import { defineConfig, devices } from '@playwright/test';

import { assertLocalDatabaseUrl } from './prisma/db-guard.mjs';

// DD-HOME-19 §16 evidence suite and canonical dynamic suite. CI loads
// synthetic app_config fixtures with `npm run db:fixtures` into an ephemeral
// local PostgreSQL database before this suite runs. Fail closed at config
// load: with a missing or non-local DATABASE_URL no server is even started and
// no write is possible. The spec repeats the guard before constructing its
// PrismaClient, so a real database is never contacted or written.
assertLocalDatabaseUrl(process.env.DATABASE_URL);

// Port 3001 keeps this server independent of the DB-free E2E gate (3000).
//
// Never derive the baseURL from NEXT_PUBLIC_SITE_URL: CI sets it to the
// deployed Vercel canonical URL, which would make these tests hit a deployed
// site instead of the local server under test. Locally a foreign server on
// this port must not be reused, as it may have been started without the
// synthetic database; CI always starts its own instance.
const localBaseURL = 'http://127.0.0.1:3001';

export default defineConfig({
  testDir: './tests/dynamic-e2e',
  // These specs mutate shared app_config rows; keep one deterministic worker.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  // No retries: flakiness is quarantined with an owner and a removal date,
  // never hidden behind a second attempt.
  retries: 0,
  reporter: 'list',
  timeout: 180_000,
  use: {
    baseURL: localBaseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3001',
    url: localBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
