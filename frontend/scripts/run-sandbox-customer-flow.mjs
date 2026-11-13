// Explicitly executed local sandbox-only end-to-end probe.
// Does NOT run from GitHub Actions or Vercel. Creates synthetic test records.
import { randomUUID, randomBytes } from 'node:crypto';
import { createSandboxCustomerClient, runSandboxCustomerFlow } from '../server/sandbox-customer-flow.mjs';

const env = process.env;
if (env.CI || env.VERCEL || env.VERCEL_ENV)
  throw new Error('Sandbox synthetic write probe is disabled in CI and Vercel');
if (env.ZIPPY_SANDBOX_TEST_APPROVAL !== 'synthetic-write-test-only')
  throw new Error('Explicit sandbox synthetic-write approval flag is required');
if (!env.ZIPPY_SANDBOX_TENANT || !env.ZIPPY_SANDBOX_EXPECTED_ORIGIN)
  throw new Error('A verified tenant name and exact HTTPS origin are required');

const tenant = env.ZIPPY_SANDBOX_TENANT;
const origin = env.ZIPPY_SANDBOX_EXPECTED_ORIGIN;
const client = createSandboxCustomerClient({
  authBase: origin + '/tenant/' + tenant + '/api:zippy-customer-draft-auth',
  bookingsBase: origin + '/tenant/' + tenant + '/api:zippy-customer-drafts',
  expectedOrigin: origin,
  expectedTenant: tenant,
});

const id = randomUUID();
const start = Date.now() + 24 * 60 * 60 * 1000;
const fixture = {
  registration: {
    name: 'SYNTHETIC Customer ' + id.slice(0, 8),
    organization_name: 'SYNTHETIC Zippy ' + id.slice(0, 8),
    email: 'synthetic-zippy-' + id + '@example.invalid',
    password: randomBytes(24).toString('hex') + 'Ab9',
  },
  draft: {
    request_id: randomUUID(),
    pickup_city: 'Synthetic Origin',
    pickup_street: 'Synthetic Pickup Street',
    delivery_city: 'Synthetic Destination',
    delivery_street: 'Synthetic Delivery Street',
    pickup_window_start: start,
    pickup_window_end: start + 3600000,
    delivery_window_start: start + 86400000,
    delivery_window_end: start + 90000000,
  },
};
try {
  const result = await runSandboxCustomerFlow(client, fixture);
  console.log(JSON.stringify({ tenant, ...result, environment: 'isolated_sandbox_only' }, null, 2));
} catch (error) {
  console.error('Sandbox customer probe failed:', String(error.message || 'unknown').slice(0, 180));
  process.exitCode = 1;
}
