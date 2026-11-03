import { defineConfig } from '@playwright/test';

// Explicit manual protected-preview run. No credentials or synthetic writes in ordinary CI.
const origin = process.env.ZIPPY_SANDBOX_BROWSER_ORIGIN;
if (process.env.CI || process.env.ZIPPY_SANDBOX_BROWSER_APPROVAL !== 'protected-synthetic-browser-only'
  || !origin || !/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)
  || !process.env.ZIPPY_PREVIEW_AUTOMATION_SECRET
  || !process.env.ZIPPY_SANDBOX_REDIS_URL || !process.env.ZIPPY_SANDBOX_REDIS_TOKEN
  || !process.env.ZIPPY_SANDBOX_SESSION_KEY)
  throw new Error('BLOCKED: protected preview origin, authorized SSO automation access, shared-store credentials, session key and explicit synthetic-browser approval are required.');
if (!/^[a-f0-9]{40}$/.test(process.env.ZIPPY_SANDBOX_EXPECTED_COMMIT || '')) throw new Error('BLOCKED: exact expected frontend deployment commit is required.');

export default defineConfig({
  testDir: './sandbox-e2e', fullyParallel: false, workers: 1, retries: 0, timeout: 360000,
  expect: { timeout: 20000 }, reporter: [['./scripts/sandbox-reporter.mjs']],
  use: { baseURL: origin, channel: 'msedge', viewport: { width: 1440, height: 1000 },
    trace: 'off', screenshot: 'off', video: 'off', serviceWorkers: 'block' },
});
