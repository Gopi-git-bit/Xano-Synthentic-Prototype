import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSandboxGateway } from './sandbox-gateway.mjs';
import { harness, registration, draft } from './test-fixtures/sandbox.mjs';

test('mocked gateway registers, authenticates, scopes membership, drafts, reads and logs out without browser tokens', async () => {
  const h = harness(), b = h.browser(), login = await b.signIn();
  for (const c of login.cookies) assert.match(c, /Path=\/; Secure; HttpOnly; SameSite=Strict; Max-Age=/);
  assert.ok(!JSON.stringify(login).includes('mock-xano-token')); assert.ok(!JSON.stringify(login).includes(registration.password));
  assert.equal((await b.call('auth/me')).data.user.id, 1); assert.equal((await b.call('organization/membership')).data.organization.id, 1);
  const created = await b.call('bookings', draft); assert.equal(created.status, 200); assert.equal(created.data.booking.status, 'draft');
  assert.equal((await b.call('bookings')).data.items.length, 1); assert.equal((await b.call('bookings/1')).data.booking.id, 1);
  assert.equal((await b.call('auth/logout', {})).status, 200); assert.equal((await b.call('auth/me')).status, 401);
});
test('session state is shared across gateway instances; logged-out cookie replay is denied', async () => {
  const h = harness(), a = h.browser(); await a.signIn(); const copied = [...a.cookies];
  const b = h.browser(h.gateway()); for (const [k, v] of copied) b.cookies.set(k, v);
  assert.equal((await b.call('bookings')).status, 200); await a.call('auth/logout', {});
  assert.equal((await b.call('bookings')).status, 401); assert.equal(h.state.size, 0);
});
test('server expiry denies stale cookies even when the client clock does not expire them', async () => {
  const h = harness(), b = h.browser(); await b.signIn(); h.advance(901000);
  assert.equal((await b.call('bookings')).status, 401); assert.equal(h.state.size, 0);
});
test('revoked Xano membership invalidates and deletes the frontend session on the next read', async () => {
  const h = harness(), b = h.browser(); await b.signIn(); h.flags.revoked = true;
  assert.equal((await b.call('bookings')).status, 403); assert.equal(h.state.size, 0);
});
test('two organizations cannot read each other; foreign and missing IDs are equivalent', async () => {
  const h = harness(), a = h.browser(), b = h.browser(); await a.signIn(); await b.signIn({ ...registration, email: 'mock-b@example.invalid' });
  await a.call('bookings', draft); await b.call('bookings', draft);
  assert.equal((await a.call('bookings')).data.items.length, 1);
  const foreign = await a.call('bookings/2'), missing = await a.call('bookings/999'); assert.equal(foreign.status, 404); assert.deepEqual(foreign, missing);
  assert.equal((await b.call('bookings/1')).status, 404);
});
test('idempotent replay carries the unchanged UUID to Xano and changed payload is denied', async () => {
  const h = harness(), b = h.browser(); await b.signIn(); const first = await b.call('bookings', draft);
  assert.deepEqual(await b.call('bookings', draft), first); assert.equal(h.bookings.length, 1);
  assert.equal((await b.call('bookings', { ...draft, pickup_city: 'Changed city' })).status, 400);
});
test('CSRF, Origin, fetch-site and content type denials precede upstream calls', async () => {
  const h = harness(), b = h.browser(); await b.call('csrf');
  for (const [headers, status] of [[{ Origin: 'https://evil.invalid' }, 403], [{ 'X-CSRF-Token': 'wrong' }, 403], [{ 'Sec-Fetch-Site': 'cross-site' }, 403], [{ 'Content-Type': 'text/plain' }, 415], [{ Origin: '' }, 403]]) {
    assert.equal((await b.call('auth/register', registration, { headers })).status, status);
  }
  assert.equal(h.calls.length, 0);
});
test('expired CSRF and duplicate cookies are rejected; CSRF is bound to preview origin', async () => {
  const h = harness(), b = h.browser(); await b.call('csrf'); h.advance(1800001);
  assert.equal((await b.call('auth/register', registration)).status, 403);
  await b.call('csrf'); h.env.ZIPPY_SANDBOX_WEB_ORIGIN = 'https://other-preview.vercel.app';
  assert.equal((await b.call('auth/register', registration)).status, 403);
  assert.equal((await b.call('auth/register', registration, { headers: { Cookie: `${h.CSRF_COOKIE}=a; ${h.CSRF_COOKIE}=b` } })).status, 400);
});
test('caller-selected roles, tenant IDs and real identities cannot register', async () => {
  const h = harness(), b = h.browser(); await b.call('csrf');
  for (const change of [{ system_role: 'super_admin' }, { tenant: 'live' }, { email: 'real@company.com' }, { name: 'Real Customer' }, { organization_name: 'Actual company' }, { phone: '12345' }]) assert.equal((await b.call('auth/register', { ...registration, ...change })).status, 400);
  assert.equal(h.calls.length, 0);
});
test('draft identity/state/financial injection and scope queries are denied before booking POST', async () => {
  const h = harness(), b = h.browser(); await b.signIn();
  for (const change of [{ customer_organization_id: 2 }, { status: 'booked' }, { total_amount: 1 }, { booked_by_user_id: 2 }, { request_id: 'invalid' }]) assert.equal((await b.call('bookings', { ...draft, ...change })).status, 400);
  assert.equal((await b.call('bookings?requested_org_id=2')).status, 400); assert.equal(h.bookings.length, 0);
});
test('internal, metadata, tool, payment, refund, dispatch and confirmation routes have no upstream path', async () => {
  const h = harness(), b = h.browser();
  for (const route of ['metadata', 'mcp', 'debug', 'transaction', 'payments', 'refunds', 'dispatch', 'bookings/1/confirm', 'bookings/1/cancel', '../auth/login', 'auth/login?path=payments']) assert.ok([400, 404].includes((await b.call(route, {})).status));
  assert.equal(h.calls.length, 0);
});
test('anonymous requests, browser Bearer and tampered opaque cookies are denied', async () => {
  const h = harness(), b = h.browser(); assert.equal((await b.call('bookings')).status, 401);
  assert.equal((await b.call('bookings', undefined, { headers: { Authorization: 'Bearer mock-xano-token-1' } })).status, 400);
  b.cookies.set(h.SESSION_COOKIE, 'a'.repeat(43)); assert.equal((await b.call('bookings')).status, 401);
  assert.equal(h.calls.length, 0);
});
test('invalid credentials and upstream failures expose only sanitized errors', async () => {
  const h = harness(), b = h.browser(); await b.call('csrf'); await b.call('auth/register', registration);
  const bad = await b.call('auth/login', { email: registration.email, password: 'InvalidPassword123' }); assert.equal(bad.status, 401);
  h.flags.failure = true; const failed = await b.call('auth/login', { email: registration.email, password: registration.password });
  assert.equal(failed.status, 502); assert.ok(!JSON.stringify([bad, failed]).includes('PRIVATE_UPSTREAM'));
});
test('unexpected private schema fields and foreign organization projections fail closed', async () => {
  const h = harness(), b = h.browser(); await b.signIn(); await b.call('bookings', draft);
  h.flags.extraField = true; assert.equal((await b.call('auth/me')).status, 502);
  h.flags.extraField = false; h.flags.foreignProjection = true; assert.equal((await b.call('bookings')).status, 502);
});
test('durable auth limits apply across fresh gateway instances', async () => {
  const h = harness(), b = h.browser(); await b.call('csrf');
  for (let i = 0; i < 3; i++) assert.equal((await b.call('auth/register', { ...registration, email: `mock-${i}@example.invalid` })).status, 201);
  const other = h.browser(h.gateway()); await other.call('csrf');
  assert.equal((await other.call('auth/register', { ...registration, email: 'mock-four@example.invalid' })).status, 429);
});
test('shared store failure cannot silently create a memory session or confirm logout', async () => {
  const h = harness(), b = h.browser(); await b.signIn(); h.store.delete = async () => { throw Error('storage credential'); };
  assert.equal((await b.call('auth/logout', {})).status, 503);
  h.store.consume = async () => { throw Error('storage credential'); };
  const failed = await b.call('auth/me'); assert.equal(failed.status, 503); assert.ok(!JSON.stringify(failed).includes('credential'));
});
test('production, wrong branch, missing configuration and expired tenant fail closed', async () => {
  for (const changes of [{ VERCEL_ENV: 'production' }, { VERCEL_GIT_COMMIT_REF: 'main' }, { ZIPPY_SANDBOX_GATEWAY_RELEASE: '' }, { ZIPPY_SANDBOX_SESSION_KEY: '' }, { ZIPPY_SANDBOX_WEB_ORIGIN: 'http://localhost' }]) {
    const h = harness(changes); assert.equal((await h.browser().call('csrf')).status, 503); assert.equal(h.calls.length, 0);
  }
  const h = harness(); h.advance(86400000); assert.equal((await h.browser().call('csrf')).status, 503);
  const handler = createSandboxGateway({ env: harness().env, fetchImpl: async () => { throw Error('Unexpected fetch'); } });
  assert.equal((await handler({ url: '/api/sandbox/csrf' })).status, 503);
});
