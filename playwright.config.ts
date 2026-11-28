import { defineConfig, devices } from '@playwright/test';

// E2E always exercises this PR's code through the local `webServer` below.
// Never derive the Playwright baseURL from NEXT_PUBLIC_SITE_URL: CI sets that
// variable to the deployed Vercel canonical URL, which would make the tests hit
// the deployed site instead of the local build under test. No remote smoke
// override is provided on purpose (an explicit remote check would need its own
// separate, documented job, never the default E2E path).
const localBaseURL = 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/e2e',
  // QA-EXC-28-01: warm the next/image variants once before parallel workers
  // start, so a 3 MB source cannot delay `load` past the per-test timeout.
  globalSetup: './tests/global-setup.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // The full suite already runs three times on release (design-doc-home.md
  // §10). Retries would mask flakiness instead of exposing it, so retries stay
  // at 0 in every profile. A flaky test is quarantined with a named owner, a
  // tracking issue and a removal date, then fixed before it can count towards
  // the release gate; it is never silently retried into a green result.
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: localBaseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // The touch branch of HOME-E2E-34 runs only in the `touch` project.
      grepInvert: /@touch/,
    },
    {
      name: 'touch',
      use: {
        ...devices['Desktop Chrome'],
        hasTouch: true,
        isMobile: true,
        viewport: { width: 375, height: 812 },
      },
      grep: /@touch/,
    },
  ],
  webServer: {
    // Synthetic DB-free render: no app_config values and no telemetry.
    // Do not delete .next here: the production build artifacts are needed by
    // the bundle gate, and clearing them makes concurrent runs race.
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
    url: localBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { DATABASE_URL: '', NEXT_TELEMETRY_DISABLED: '1' },
  },
});
