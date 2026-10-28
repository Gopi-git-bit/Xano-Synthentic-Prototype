import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGateway } from './gateway.mjs';

const env = { XANO_AUTH_BASE_URL: 'https://xano.example/api:auth', XANO_LOGISTICS_BASE_URL: 'https://xano.example/api:zippy-v1', XANO_AUTH_RELEASE: 'verified', XANO_BOOKING_READS_RELEASE: 'verified' };
const user = { id: 7, name: 'Test customer', email: 'test@example.com', role: 'admin', system_role: 'customer_member', status: 'active', active_organization_id: 12 };
const row = { id: 31, customer_organization_id: 12, booking_reference: 'TEST-31', pickup_city: 'Chennai', delivery_city: 'Salem', version: 1, status: 'draft', payment_status: 'pending', payment_mode: 'topay', total_amount: 4500, password: 'must-not-pass', consignee_details: { phone: 'private' } };
const page = { curPage: 1, nextPage: null, items: [row] };
const headers = new Headers({ authorization: 'Bearer test-token', 'content-type': 'application/json' });
test('Vercel rewrite metadata is accepted only when it exactly matches the route', async () => {
  const {handle,calls}=setup();
  assert.equal((await handle({url:'/api/gateway?page=1&route=bookings&path=bookings',headers})).status,200);
  assert.equal(new URL(calls[1].url).searchParams.get('requested_org_id'),'12');
  for (const query of ['route=bookings&path=other','route=bookings&path=bookings&path=bookings','route=bookings&path=bookings&requested_org_id=99','route=bookings&path=bookings&page=1&page=2','path=bookings']) {
    assert.equal((await handle({url:'/api/bookings?'+query,headers})).status,400);
  }
});
function setup(options = {}) {
  const calls = [];
  const handle = createGateway({ env: { ...env, ...options.env }, fetchImpl: async (url, init) => {
    calls.push({ url: String(url), init });
    if (options.timeout) throw new Error('private diagnostic');
    const path = new URL(url).pathname;
    const data = path.endsWith('/auth/me') ? (options.user === undefined ? user : options.user) : path.endsWith('/auth/login') || path.endsWith('/auth/signup') ? (options.auth === undefined ? { authToken: 'test-token' } : options.auth) : (Object.hasOwn(options, 'result') ? options.result : page);
    return new Response(JSON.stringify(data), { status: path.endsWith('/auth/me') ? (options.authStatus || 200) : (options.status || 200), headers: { 'content-type': 'application/json' } });
  } });
  return { handle, calls };
}

test('release gates reject credentials and tokens before upstream; URL configuration is not readiness', async () => {
  for (const release of [undefined, '', 'true', 'blocked']) {
    const { handle, calls } = setup({ env: { XANO_AUTH_RELEASE: release } });
    const status = (await handle({ url: '/api/status' })).data;
    assert.equal(status.authenticationConfigured, true); assert.equal(status.authenticationAvailable, false); assert.equal(status.bookingReadsAvailable, false);
    for (const route of ['auth/login', 'auth/signup', 'auth/me', 'bookings']) {
      const result = await handle({ url: `/api/${route}`, method: route === 'auth/login' || route === 'auth/signup' ? 'POST' : 'GET', headers, body: { email: 'test@example.com', password: 'Password123' } });
      assert.equal(result.status, 503); assert.equal(result.data.error.code, 'AUTH_RELEASE_PENDING');
    }
    assert.equal(calls.length, 0);
    assert.equal((await handle({ url: '/api/bookings' })).status, 401);
  }
  const malformed = setup({ env: { XANO_AUTH_BASE_URL: 'https://user:secret@example.com' } });
  assert.equal((await malformed.handle({ url: '/api/status' })).data.authenticationAvailable, false);
});

test('legacy roles, inactive accounts, unknown system roles and missing organization cannot grant access', async () => {
  for (const identity of [null, { id: 7, role: 'admin' }, { ...user, status: 'suspended' }, { ...user, status: 'pending' }, { ...user, active_organization_id: null }, { ...user, system_role: 'support_agent' }, { ...user, system_role: 'administrator' }]) {
    const { handle, calls } = setup({ user: identity });
    const result = await handle({ url: '/api/bookings?role=admin', headers });
    assert.equal(result.status, 403); assert.equal(calls.length, 1);
  }
  const { handle } = setup();
  const result = await handle({ url: '/api/auth/me?role=admin', headers });
  assert.equal(result.data.user.workspace, 'customer'); assert.equal(result.data.user.organizationId, 12);
  assert.equal(result.data.user.role, undefined);
});

test('login validates identity before returning a token and never trusts browser grants', async () => {
  const { handle, calls } = setup();
  const result = await handle({ url: '/api/auth/login', method: 'POST', headers, body: { email: 'test@example.com', password: 'Password123', role: 'admin', system_role: 'super_admin' } });
  assert.equal(result.status, 200); assert.equal(result.data.user.workspace, 'customer');
  assert.deepEqual(Object.keys(JSON.parse(calls[0].init.body)).sort(), ['email', 'password']);
  const legacy = setup({ user: { id: 7, role: 'admin' } });
  const denied = await legacy.handle({ url: '/api/auth/login', method: 'POST', headers, body: { email: 'test@example.com', password: 'Password123' } });
  assert.equal(denied.status, 403); assert.doesNotMatch(JSON.stringify(denied), /test-token/);
  for (const auth of [null, {}, { authToken: '' }, { authToken: 'bad token' }]) {
    assert.equal((await setup({ auth }).handle({ url: '/api/auth/login', method: 'POST', headers, body: { email: 'test@example.com', password: 'Password123' } })).status, 502);
  }
});

test('booking reads and writes gate independently; driver/vendor/Admin cannot read customer finances', async () => {
  const gated = setup({ env: { XANO_BOOKING_READS_RELEASE: 'blocked' } });
  assert.equal((await gated.handle({ url: '/api/bookings', headers })).data.error.code, 'BOOKING_RELEASE_PENDING');
  assert.equal(gated.calls.length, 1);
  for (const role of ['driver', 'vendor_admin', 'fleet_manager', 'operations_admin']) {
    const scoped = setup({ user: { ...user, system_role: role } });
    assert.equal((await scoped.handle({ url: '/api/bookings', headers })).status, 403); assert.equal(scoped.calls.length, 1);
  }
  const { handle, calls } = setup();
  for (const route of ['bookings', 'bookings/31', 'bookings/31/confirm', 'bookings/31/payment-selection', 'consent-attempts/1/decision']) {
    const result = await handle({ url: `/api/${route}`, method: 'POST', headers, body: { status: 'completed' } });
    assert.equal(result.data.error.code, 'BOOKING_WRITES_PENDING');
  }
  assert.ok(calls.every(c => c.url.endsWith('/auth/me')));
});

test('tenant-scoped read projects data and preserves independent booking/payment states', async () => {
  const { handle, calls } = setup({ result: { ...page, items: [{ ...row, status: 'delivered', payment_status: 'pending' }] } });
  const result = await handle({ url: '/api/bookings?page=1&per_page=20&status=delivered', headers });
  assert.equal(result.status, 200); assert.equal(result.data.items[0].status, 'delivered'); assert.equal(result.data.items[0].payment_status, 'pending');
  assert.doesNotMatch(JSON.stringify(result), /total_amount|password|consignee|private/);
  const upstream = new URL(calls[1].url);
  assert.equal(upstream.searchParams.get('requested_org_id'), '12'); assert.equal(calls[1].init.headers.Authorization, 'Bearer test-token');
  for (const query of ['requested_org_id=99', 'page=0', 'per_page=101', 'status=POD Verified', 'page=1&page=2', 'role=admin']) {
    assert.equal((await handle({ url: `/api/bookings?${query}`, headers })).status, 400);
  }
});

test('null, malformed pages, foreign records and unexpected detail IDs fail closed', async () => {
  for (const result of [null, [], {}, { items: [] }, { ...page, items: [row, row] }, { ...page, items: [{ ...row, status: 'POD Verified' }] }, { ...page, nextPage: '2' }]) {
    assert.equal((await setup({ result }).handle({ url: '/api/bookings', headers })).status, 502);
  }
  const foreign = setup({ result: { ...page, items: [{ ...row, customer_organization_id: 99 }] } });
  const denied = await foreign.handle({ url: '/api/bookings', headers });
  assert.equal(denied.status, 403); assert.doesNotMatch(JSON.stringify(denied), /TEST-31/);
  const empty = setup({ result: { ...page, items: [] } });
  assert.deepEqual((await empty.handle({ url: '/api/bookings', headers })).data.items, []);
  const detail = { booking: row, cargo: [{ private: true }], active_holds: [], blocking_reasons: ['No accepted pricing quote'], allowed_actions: ['confirm'] };
  const result = await setup({ result: detail }).handle({ url: '/api/bookings/31', headers });
  assert.equal(result.status, 200); assert.equal(result.data.cargoCount, 1); assert.equal(result.data.readOnly, true); assert.equal(result.data.allowed_actions, undefined);
  assert.equal((await setup({ result: detail }).handle({ url: '/api/bookings/32', headers })).status, 502);
});

test('upstream denials and timeouts never yield success or leak provider details', async () => {
  for (const status of [401, 403, 404, 429, 500]) {
    const result = await setup({ status, result: { error: 'private diagnostic' } }).handle({ url: '/api/bookings', headers });
    assert.ok(result.status >= 400); assert.doesNotMatch(JSON.stringify(result), /private diagnostic/);
  }
  const result = await setup({ timeout: true }).handle({ url: '/api/bookings', headers });
  assert.equal(result.status, 503); assert.doesNotMatch(JSON.stringify(result), /private diagnostic/);
});

test('Zoho remains unavailable without its independent release; no provider calls', async () => {
  const { handle, calls } = setup({ user: { ...user, system_role: 'operations_admin' } });
  assert.equal((await handle({ url: '/api/crm/modules', headers })).data.error.code, 'ZOHO_RELEASE_PENDING');
  assert.equal(calls.length, 1);
});
