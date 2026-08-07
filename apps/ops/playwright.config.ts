import { defineConfig } from '@playwright/test';

/**
 * E2E against the local Supabase stack (supabase start must be running).
 * Golden paths only — auth+MFA, pipeline, documents (docs/07 Sprint C1).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // sequential: specs share one seeded database
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
