import { defineConfig } from '@playwright/test';

// Loopback-only regression suite. Does not read the private preview environment.
export default defineConfig({
  testDir: './sandbox-security', fullyParallel: false, workers: 1, retries: 0,
  timeout: 15000, reporter: [['list']],
  use: { channel: process.env.CI ? undefined : 'msedge', serviceWorkers: 'block',
    trace: 'off', screenshot: 'off', video: 'off' },
});