import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGateway } from './gateway.mjs';

test('assessment status remains unavailable even when unrelated releases are configured', async () => {
  let calls = 0;
  const handle = createGateway({
    env: { XANO_AUTH_BASE_URL: 'https://isolated.invalid/api:auth', XANO_LOGISTICS_BASE_URL: 'https://isolated.invalid/api:core', XANO_AUTH_RELEASE: 'verified', XANO_BOOKING_READS_RELEASE: 'verified' },
    fetchImpl: async () => { calls++; throw new Error('Unexpected upstream call'); },
  });
  const result = await handle({ url: '/api/status' });
  assert.equal(result.status, 200);
  for (const key of ['assessmentsAvailable', 'assessmentReviewAvailable', 'bookingWritesAvailable', 'deliveryAvailable']) assert.equal(result.data[key], false);
  assert.equal(calls, 0);
});
