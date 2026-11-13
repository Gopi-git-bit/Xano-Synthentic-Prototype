import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGateway } from './gateway.mjs';

const env = {
  XANO_AUTH_BASE_URL: 'https://xano.example/api:auth',
  XANO_LOGISTICS_BASE_URL: 'https://xano.example/api:zippy-v1',
  XANO_AUTH_RELEASE: 'verified',
  XANO_BOOKING_READS_RELEASE: 'verified',
  // Hypothetical release flags cannot enable routes that have no reviewed gateway contract.
  XANO_OWNER_READS_RELEASE: 'verified',
  XANO_ADMIN_READS_RELEASE: 'verified',
};

function harness(system_role, active_organization_id) {
  const calls = [];
  const fakeUser = {
    id: 42,
    name: 'Synthetic permission test',
    email: 'synthetic@example.test',
    system_role,
    status: 'active',
    active_organization_id,
  };
  const handle = createGateway({
    env,
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), method: options?.method || 'GET' });
      if (new URL(url).pathname !== '/api:auth/auth/me') {
        throw new Error('Unexpected upstream operational request');
      }
      return new Response(JSON.stringify(fakeUser), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });
  return { handle, calls };
}

for (const [role, organizationId] of [
  ['driver', 12],
  ['vendor_admin', 12],
  ['fleet_manager', 12],
  ['operations_admin', null],
  ['super_admin', null],
]) {
  test(`${role}: owner/admin operational reads and writes remain disabled at gateway`, async () => {
    const { handle, calls } = harness(role, organizationId);
    const headers = new Headers({ authorization: 'Bearer synthetic-only' });
    for (const url of [
      '/api/owner/trips?page=1',
      '/api/owner/trips/1',
      '/api/admin/bookings?organization_id=12',
      '/api/admin/bookings/1?organization_id=12',
    ]) {
      for (const method of ['GET', 'POST']) {
        const result = await handle({ url, method, headers });
        assert.equal(result.status, 404);
        assert.equal(result.data.error.code, 'ENDPOINT_UNAVAILABLE');
      }
    }
    const denied = await handle({ url: '/api/bookings', method: 'GET', headers });
    assert.equal(denied.status, 403);
    assert.equal(denied.data.error.code, 'CUSTOMER_SCOPE_REQUIRED');
    assert.equal(calls.length, 9);
    assert.ok(calls.every(call => call.method === 'GET' && new URL(call.url).pathname === '/api:auth/auth/me'));
  });
}
