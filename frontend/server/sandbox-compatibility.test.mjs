import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { harness, registration, draft } from './test-fixtures/sandbox.mjs';
import { createSandboxGateway } from './sandbox-gateway.mjs';
import { sandboxTarget } from './sandbox-target.mjs';

// Exercise the gateway's own check independently of adapter validation, without adding a bypass API.
const source = fs.readFileSync(new URL('./sandbox-gateway.mjs', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const take = re => { const m = re.exec(source); assert.ok(m, 'gateway source shape'); return m[0]; };
const ctx = vm.createContext({ SandboxError: class extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } } });
vm.runInContext([
  /^const object = .*$/m, /^const validId = .*$/m, /^const exact = .*$/m, /^const fail = .*$/m, /^const contract = .*$/m,
  /^function booking\(row, organizationId\) \{[\s\S]*?\n\}/m,
].map(take).join('\n') + '\nthis.check = function(data,current){' + take(/contract\(exact\(data, \['booking', 'draft_only', 'execution_enabled'\][^\n]+\n *return \{ status: 200, data: \{[^\n]+/) + '\n};', ctx);
const booking = { id: 1, booking_reference: 'DRAFT-MOCK', customer_organization_id: 7, status: 'draft', payment_status: 'pending', payment_mode: 'prepaid', pickup_city: 'Synthetic A', delivery_city: 'Synthetic B', version: 1 };
const envelope = { booking, draft_only: true, execution_enabled: false };
const check = data => ctx.check(data, { organization: { id: 7 } });

test('gateway standalone validation accepts only a valid draft envelope and projection', () => {
  assert.equal(check(envelope).data.booking.id, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(check(envelope).data)), { booking: { id: 1, reference: 'DRAFT-MOCK', pickupCity: 'Synthetic A', deliveryCity: 'Synthetic B', version: 1, status: 'draft' }, draftOnly: true, executionEnabled: false });
});
for (const [name, value] of [['true', true], ['null', null], ['string', 'false'], ['number', 0], ['undefined', undefined]]) {
  test(`gateway independently rejects execution_enabled:${name} while booking remains draft`, () => {
    assert.equal(envelope.booking.status, 'draft');
    assert.throws(() => check({ ...envelope, execution_enabled: value }), /SANDBOX_CONTRACT/);
  });
}
for (const [name, value] of [['false', false], ['null', null], ['string', 'true'], ['number', 1], ['undefined', undefined]]) {
  test(`gateway independently rejects draft_only:${name} while booking remains draft`, () => {
    assert.equal(envelope.booking.status, 'draft');
    assert.throws(() => check({ ...envelope, draft_only: value }), /SANDBOX_CONTRACT/);
  });
}
test('quoted-status rejection is a separate negative control with valid flags (G-F2)', () => {
  assert.throws(() => check({ ...envelope, booking: { ...booking, status: 'quoted' } }), /SANDBOX_CONTRACT/);
});
test('gateway independently rejects extra or missing create keys and foreign booking identity', () => {
  assert.throws(() => check({ ...envelope, replayed: false }), /SANDBOX_CONTRACT/);
  assert.throws(() => check({ booking, draft_only: true }), /SANDBOX_CONTRACT/);
  assert.throws(() => check({ ...envelope, booking: { ...booking, customer_organization_id: 8 } }), /SANDBOX_CONTRACT/);
});

async function approvedFixture() {
  const h = harness(), b = h.browser(); await b.call('csrf');
  await b.call('auth/register', registration); h.operatorApprove(registration.email); await b.signIn();
  return { h, b };
}
test('registration and duplicate responses disclose no internal identity or duplicate information; pending login is denied', async () => {
  const h = harness(), b = h.browser(); await b.call('csrf');
  const first = await b.call('auth/register', registration), duplicate = await b.call('auth/register', registration);
  assert.deepEqual(first, duplicate); assert.equal(h.users.length, 1); assert.equal(h.users[0].status, 'pending');
  assert.deepEqual(first.data, { status: 'submitted', next_step: 'pending_platform_review', verification: 'pending_human_review', bookingScope: 'draft_only' });
  const login = await b.call('auth/login', { email: registration.email, password: registration.password });
  assert.equal(login.status, 401); assert.equal(h.state.size, 0);
  h.operatorApprove(registration.email); // Explicit test-only privileged transition, never a customer route.
  assert.equal((await b.signIn()).status, 200);
  assert.ok(!JSON.stringify(first).includes(h.env.ZIPPY_SANDBOX_GATEWAY_KEY));
  assert.ok(!JSON.stringify(first).includes('mock-xano-token'));
});
test('customer routes cannot perform operator approval or activate a pending account', async () => {
  const h = harness(), b = h.browser(); await b.call('csrf'); await b.call('auth/register', registration);
  const before = h.calls.length;
  for (const route of ['registrations/approve', 'operator/registrations/approve', 'auth/approve', 'approve'])
    assert.equal((await b.call(route, {})).status, 404);
  assert.equal(h.calls.length, before); assert.equal(h.users[0].status, 'pending');
});
test('city 100/101 and street 200/201 boundaries are enforced before a booking POST', async () => {
  const { h, b } = await approvedFixture();
  assert.equal((await b.call('bookings', { ...draft, pickup_city: 'A'.repeat(100), delivery_city: 'B'.repeat(100), pickup_street: 'S'.repeat(200) })).status, 200);
  const posts = () => h.calls.filter(c => c.method === 'POST' && c.path.endsWith('/bookings')).length;
  const before = posts();
  for (const change of [{ pickup_city: 'A'.repeat(101) }, { delivery_city: 'B'.repeat(101) }, { pickup_street: 'S'.repeat(201) }, { delivery_street: 'S'.repeat(201) }])
    assert.equal((await b.call('bookings', { ...draft, ...change })).status, 400);
  assert.equal(posts(), before);
});
test('invalid flag responses fail closed through the real injected adapter/gateway chain', async () => {
  for (const flags of [{ execution_enabled: true }, { draft_only: false }, { execution_enabled: null }, { draft_only: 'true' }, { replayed: false }]) {
    const { h, b } = await approvedFixture(); h.flags.draftEnvelope = flags;
    const result = await b.call('bookings', draft); assert.equal(result.status, 502);
    assert.ok(!Object.hasOwn(result.data, 'booking'));
  }
});
test('membership identity mismatch cannot create a frontend session', async () => {
  const h = harness(), b = h.browser(); await b.call('csrf'); await b.call('auth/register', registration);
  h.operatorApprove(registration.email); h.flags.membershipUser = 99;
  assert.equal((await b.call('auth/login', { email: registration.email, password: registration.password })).status, 502);
  assert.equal(h.state.size, 0);
});
test('missing or insufficient ingress configuration refuses even CSRF without upstream or store access', async () => {
  for (const change of [{ ZIPPY_SANDBOX_DATASOURCE: undefined }, { ZIPPY_SANDBOX_DATASOURCE: 'live' }, { ZIPPY_SANDBOX_GATEWAY_KEY: undefined },
    { ZIPPY_SANDBOX_GATEWAY_KEY: 'short' }, { ZIPPY_SANDBOX_GATEWAY_KEY: 'x'.repeat(32) + '\n' }]) {
    const h = harness(change), result = await h.browser().call('csrf');
    assert.equal(result.status, 503); assert.equal(h.calls.length, 0); assert.equal(h.counters.size, 0);
    assert.deepEqual(result.data, { error: { code: 'SANDBOX_NOT_CONFIGURED', message: 'Protected sandbox configuration is incomplete.' } });
  }
});
test('expired pin and missing release approval cannot be bypassed by caller target variables', async () => {
  const h = harness({ ZIPPY_SANDBOX_TENANT: 'new-unapproved', ZIPPY_SANDBOX_EXPECTED_ORIGIN: 'https://other.invalid' });
  const handler = createSandboxGateway({ env: h.env, fetchImpl: async () => { throw Error('must not reach transport'); }, store: h.store, now: () => sandboxTarget.expiresAt + 1 });
  assert.equal((await handler({ url: '/api/sandbox/csrf' })).status, 503);
  const unapproved = harness({ ZIPPY_SANDBOX_GATEWAY_RELEASE: '' });
  assert.equal((await unapproved.browser().call('csrf')).status, 503); assert.equal(unapproved.calls.length, 0);
});
test('the ingress key configuration has no browser source import, persistence or output path', () => {
  for (const file of ['../src/sandbox/CustomerPreview.tsx', '../src/sandbox/customer-api.ts', '../src/main.tsx']) {
    const code = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.ok(!code.includes('ZIPPY_SANDBOX_GATEWAY_KEY')); assert.ok(!code.includes('X-Zippy-Gateway-Key'));
  }
});
