import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createGateway } from './gateway.mjs';
import { bookingStatuses } from './bookings.mjs';

const root = new URL('../../', import.meta.url);
const contract = JSON.parse(await readFile(new URL('contracts/backend-frontend/0.1.0/contract.json', root), 'utf8'));
const read = path => readFile(new URL(path, root), 'utf8');

test('versioned alignment pins retained source; a source hash is not runtime proof', async () => {
  assert.equal(contract.version, '0.1.0');
  assert.equal(contract.runtimeVerified, false);
  assert.equal(contract.recoveryDeployment, 'NOT_DEPLOYED');
  assert.equal(contract.isolatedRuntime, 'NOT_VERIFIED');
  for (const source of contract.sources) {
    const text = (await read(source.path)).replace(/\r\n/g, '\n');
    assert.equal(createHash('sha256').update(text).digest('hex'), source.sha256, source.path);
  }
  assert.deepEqual(bookingStatuses, contract.bookingStatuses);
  const list = await read(contract.customerListSource);
  const statusEnum = list.match(/enum\? status\?\s*\{\s*values = \[([\s\S]*?)\]/);
  assert.ok(statusEnum);
  assert.deepEqual([...statusEnum[1].matchAll(/"([^"]+)"/g)].map(match => match[1]), contract.bookingStatuses);
  const ui = await read('frontend/src/Bookings.tsx');
  const options = ui.match(/const statusOptions = (.*);/)[1];
  assert.deepEqual([...options.matchAll(/\['([^']+)'/g)].map(match => match[1]), contract.bookingStatuses);
});

test('documented release defaults stay blocked; configured URLs never attest readiness', async () => {
  const example = await read('frontend/.env.example');
  for (const gate of ['XANO_AUTH_RELEASE', 'XANO_BOOKING_READS_RELEASE', 'ZOHO_READ_RELEASE']) {
    assert.match(example, new RegExp(`^${gate}=blocked$`, 'm'));
  }
  let calls = 0;
  const handle = createGateway({ env: { XANO_AUTH_BASE_URL: 'https://xano.example/api:auth', XANO_LOGISTICS_BASE_URL: 'https://xano.example/api:zippy-v1' }, fetchImpl: async () => { calls++; throw new Error('No network permitted'); } });
  const result = await handle({ url: '/api/status' });
  for (const key of ['authenticationAvailable', 'bookingReadsAvailable', 'bookingWritesAvailable', 'deliveryAvailable', 'crmAvailable']) assert.equal(result.data[key], false);
  assert.equal(calls, 0);
});

for (const route of ['auth/signup', 'auth/register']) {
  test(`${route}: cannot be enabled by hypothetical onboarding or login flags`, async () => {
    for (const release of ['verified', 'blocked']) {
      let calls = 0;
      const handle = createGateway({ env: { XANO_AUTH_RELEASE: release, XANO_REGISTRATION_RELEASE: 'verified', XANO_AUTH_BASE_URL: 'https://xano.example/api:auth' }, fetchImpl: async () => { calls++; throw new Error('No network permitted'); } });
      for (const method of ['GET', 'POST', 'PATCH']) {
        const result = await handle({ url: `/api/${route}`, method, body: { requested_system_role: 'super_admin' } });
        assert.equal(result.status, 503);
        assert.equal(result.data.error.code, 'REGISTRATION_PENDING');
      }
      assert.equal(calls, 0);
    }
  });
}

test('every documented pending gateway path rejects without operational upstream calls', async () => {
  const calls = [];
  const handle = createGateway({ env: { XANO_AUTH_RELEASE: 'verified', XANO_BOOKING_READS_RELEASE: 'verified', XANO_AUTH_BASE_URL: 'https://xano.example/api:auth', XANO_LOGISTICS_BASE_URL: 'https://xano.example/api:zippy-v1' }, fetchImpl: async url => {
    calls.push(String(url));
    assert.equal(String(url), 'https://xano.example/api:auth/auth/me');
    return Response.json({ id: 7, name: 'Synthetic', email: 'synthetic@example.test', system_role: 'customer_member', status: 'active', active_organization_id: 12 });
  } });
  for (const entry of contract.blockedRequests) {
    const result = await handle({ url: `/api/${entry.route}`, method: entry.method, headers: new Headers({ authorization: 'Bearer synthetic-only' }) });
    assert.equal(result.status, entry.status, entry.route);
    assert.equal(result.data.error.code, entry.code, entry.route);
  }
  assert.ok(calls.every(url => url.endsWith('/auth/me')));
});
