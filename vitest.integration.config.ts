import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

// Database-backed tests run only here, against an ephemeral PostgreSQL
// instance. Unit tests and Playwright specs have their own runners.
export default defineConfig({
  resolve: {
    alias: {
      // `server-only` throws when loaded outside an RSC bundler; its own
      // empty.js entry is the no-op marker intended for non-RSC tooling.
      'server-only': fileURLToPath(
        new URL('./node_modules/server-only/empty.js', import.meta.url),
      ),
    },
  },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'tests/unit/**', 'tests/e2e/**', 'prototipo/**'],
    // All specs share app_config keys, so they must not run in parallel.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
