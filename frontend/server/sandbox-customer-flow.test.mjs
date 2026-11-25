import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSandboxCustomerClient, runSandboxCustomerFlow } from './sandbox-customer-flow.mjs';

const origin = 'https://sandbox-xano.example.invalid';
const tenant = 'ev0h-65a7-56ce';
const authBase = origin + '/tenant/' + tenant + '/api:zippy-customer-draft-auth';
const bookingsBase = origin + '/tenant/' + tenant + '/api:zippy-customer-drafts';
const fixture = {
  registration: {
    name: 'SYNTHETIC Customer',
    organization_name: 'SYNTHETIC Freight Owner',
    email: 'synthetic-case@example.invalid',
    password: 'SyntheticPass12345',
  },
  draft: {
    request_id: '9864075b-4614-4cf9-a018-0f5cde2a8821',
    pickup_city: 'Synthetic Pickup',
    pickup_street: 'Synthetic Street 1',
    delivery_city: 'Synthetic Destination',
    delivery_street: 'Synthetic Street 2',
    pickup_window_start: 1999000000000,
    pickup_window_end: 1999003600000,
    delivery_window_start: 1999086400000,
    delivery_window_end: 1999090000000,
  },
};
const booking = {
  id: 33, booking_reference: 'DRAFT-TEST', customer_organization_id: 22,
  status: 'draft', payment_status: 'pending', payment_mode: 'prepaid',
  pickup_city: 'Synthetic Pickup', delivery_city: 'Synthetic Destination', version: 1,
};
const ok = data => new Response(JSON.stringify(data), {
  status: 200, headers: { 'content-type': 'application/json' },
});
const config = fetchImpl => ({
  authBase, bookingsBase, expectedOrigin: origin, expectedTenant: tenant, datasource: 'test', gatewayKey: 'synthetic-adapter-gateway-key-00000000', fetchImpl,
});
function simulatedBackend(calls) {
  let registered = false, approved = false;
  const fetchImpl = async (url, options) => {
    const u = new URL(url);
    calls.push({ url: u.pathname + u.search, method: options.method, redirect: options.redirect,
      tokenPresent: Boolean(options.headers.Authorization) });
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers['X-Data-Source'], 'test');
    assert.equal(options.headers['X-Zippy-Gateway-Key'], config(null).gatewayKey);
    const path = u.pathname.slice(('/tenant/' + tenant).length);
    if (path === '/api:zippy-customer-draft-auth/auth/register' && options.method === 'POST') {
      const input = JSON.parse(options.body);
      assert.equal(input.email, fixture.registration.email);
      assert.equal(input.organization_name, fixture.registration.organization_name);
      assert.equal(input.requested_system_role, undefined);
      registered = true;
      return ok({ status: 'submitted', next_step: 'pending_platform_review' });
    }
    if (path === '/api:zippy-customer-draft-auth/auth/login') {
      return registered && approved ? ok({ authToken: 'synthetic-opaque-token', user_id: 12 }) : new Response('{}', { status: 401 });
    }
    assert.equal(options.headers.Authorization, 'Bearer synthetic-opaque-token');
    if (path === '/api:zippy-customer-draft-auth/auth/me') {
      return ok({ id: 12, name: fixture.registration.name, email: fixture.registration.email,
        system_role: 'customer_admin', status: 'active', active_organization_id: 22 });
    }
    if (path === '/api:zippy-customer-draft-auth/organization/membership') {
      return ok({ organization: { id: 22, name: fixture.registration.organization_name, type: 'customer', kyb_verified: false, status: 'active' },
        membership: { id: 8, organization_id: 22, user_id: 12, member_role: 'owner', is_active: true, is_primary: true }, booking_scope: 'draft_only' });
    }
    if (path === '/api:zippy-customer-drafts/bookings' && options.method === 'POST') {
      const input = JSON.parse(options.body);
      assert.equal(input.request_id, fixture.draft.request_id);
      assert.equal(input.payment_status, undefined);
      assert.equal(input.customer_organization_id, undefined);
      return ok({ booking, draft_only: true, execution_enabled: false });
    }
    if (path === '/api:zippy-customer-drafts/bookings' && options.method === 'GET') {
      assert.equal(u.search, '?page=1&per_page=100&status=draft');
      return ok({ curPage: 1, nextPage: null, items: [booking] });
    }
    if (path === '/api:zippy-customer-drafts/bookings/33') {
      return ok({ booking, cargo: [], active_holds: [],
        blocking_reasons: ['Operational booking commands unavailable'], allowed_actions: [] });
    }
    throw new Error('Unexpected unapproved endpoint: ' + path);
  };
  return { fetchImpl, operatorApprove() { assert.equal(registered, true); approved = true; } };
}

test('two-phase flow submits generically, denies pending login, then authenticates only after explicit operator simulation', async () => {
  const calls = [];
  const backend = simulatedBackend(calls), client = createSandboxCustomerClient(config(backend.fetchImpl));
  const submitted = await runSandboxCustomerFlow(client, fixture, { phase: 'registration' });
  assert.deepEqual(submitted, { status: 'submitted', next_step: 'pending_platform_review' });
  assert.equal(calls.length, 1, 'submission must not automatically log in or approve');
  await assert.rejects(runSandboxCustomerFlow(client, fixture, { phase: 'after-approval' }), /Sandbox HTTP 401/);
  backend.operatorApprove(); // Out-of-band test fixture action, not invoked by the flow or customer.
  const result = await runSandboxCustomerFlow(client, fixture, { phase: 'after-approval' });
  assert.deepEqual(result, {
    outcome: 'SANDBOX_CUSTOMER_FLOW_VERIFIED',
    userId: 12, organizationId: 22, bookingId: 33,
    bookingStatus: 'draft', bookingScope: 'draft_only', verifiedFinancialActions: false,
  });
  assert.deepEqual(calls.map(x => x.method), ['POST', 'POST', 'POST', 'GET', 'GET', 'POST', 'GET', 'GET']);
  assert.ok(calls.every(x => x.redirect === 'error'));
  assert.equal(calls.filter(x => x.tokenPresent).length, 5);
  assert.ok(!JSON.stringify(result).includes('synthetic-opaque-token'));
  assert.ok(!JSON.stringify(result).includes(fixture.registration.password));
});

test('sandbox tenant and API origin must be exact; live canonical paths cannot be used', () => {
  for (const overrides of [
    { authBase: origin + '/api:pofBqnrY' },
    { bookingsBase: origin + '/api:zippy-v1' },
    { expectedTenant: 'other-sandbox' },
    { expectedTenant: 'live' },
    { authBase: 'http://sandbox-xano.example.invalid/tenant/' + tenant + '/api:zippy-customer-draft-auth' },
    { bookingsBase: 'https://outside.invalid/tenant/' + tenant + '/api:zippy-customer-drafts' },
    { expectedOrigin: 'https://sandbox-xano.example.invalid/production' },
    { authBase: origin + '/tenant/' + tenant + '/api:zippy-customer-draft-auth?unsafe=true' },
  ]) {
    assert.throws(() => createSandboxCustomerClient({ ...config(async () => { throw Error('never'); }), ...overrides }),
      /SANDBOX_CONTRACT/);
  }
});

test('registration refuses non-synthetic accounts and caller-selected roles before any network request', async () => {
  let calls = 0;
  const client = createSandboxCustomerClient(config(async () => { calls++; throw Error('unexpected'); }));
  await assert.rejects(client.register({ ...fixture.registration, email: 'real@company.com' }), /Synthetic customer/);
  await assert.rejects(client.register({ ...fixture.registration, requested_system_role: 'vendor_admin' }), /Synthetic customer/);
  await assert.rejects(client.register({ ...fixture.registration, organization_name: 'Real Business' }), /Synthetic customer/);
  assert.equal(calls, 0);
});

test('draft creation prevents caller-controlled money, tenant and state fields', async () => {
  let calls = 0;
  const client = createSandboxCustomerClient(config(async () => { calls++; throw Error('unexpected'); }));
  for (const field of ['status', 'total_amount', 'customer_organization_id', 'payment_status']) {
    await assert.rejects(client.createDraft('synthetic-token', { ...fixture.draft, [field]: 'anything' }),
      /Invalid synthetic draft/);
  }
  assert.equal(calls, 0);
});

test('backend 403 is fail-closed and never includes sensitive upstream content', async () => {
  const client = createSandboxCustomerClient(config(async () =>
    new Response(JSON.stringify({ secret: 'do-not-show-provider-payload' }), { status: 403 })));
  await assert.rejects(client.login(fixture.registration.email, fixture.registration.password), error => {
    assert.match(error.message, /SANDBOX_CONTRACT: Sandbox HTTP 403/);
    assert.ok(!error.message.includes('do-not-show-provider-payload'));
    return true;
  });
});

test('bookings that belong to a foreign organization are rejected after creation', async () => {
  const client = createSandboxCustomerClient(config(async (url, options) => {
    const path = new URL(url).pathname;
    if (path.endsWith('/auth/login')) return ok({ authToken: 'synthetic-opaque-token', user_id: 12 });
    if (path.endsWith('/auth/me')) return ok({ id: 12, name: 'SYNTHETIC Customer',
      email: fixture.registration.email, status: 'active',
      active_organization_id: 22, system_role: 'customer_admin' });
    if (path.endsWith('/organization/membership')) return ok({ organization: { id: 22, type: 'customer', status: 'active', kyb_verified: false },
      membership: { id: 8, organization_id: 22, user_id: 12, member_role: 'owner', is_active: true, is_primary: true }, booking_scope: 'draft_only' });
    if (options.method === 'POST' && path.endsWith('/bookings')) return ok({
      booking: { ...booking, customer_organization_id: 99 },
      draft_only: true, execution_enabled: false,
    });
    throw Error('Unexpected call');
  }));
  await assert.rejects(runSandboxCustomerFlow(client, fixture, { phase: 'after-approval' }), /different organization/);
});

test('a missing or caller-invented flow phase cannot trigger a single-pass register/login flow', async () => {
  let calls = 0;
  const client = createSandboxCustomerClient(config(async () => { calls++; throw Error('unexpected'); }));
  await assert.rejects(runSandboxCustomerFlow(client, fixture), /Explicit registration or after-approval phase/);
  await assert.rejects(runSandboxCustomerFlow(client, fixture, { phase: 'approve' }), /Explicit registration or after-approval phase/);
  assert.equal(calls, 0);
});

test('new and duplicate submissions return only the identical generic acknowledgement', async () => {
  const calls = [], backend = simulatedBackend(calls), client = createSandboxCustomerClient(config(backend.fetchImpl));
  const a = await client.register(fixture.registration), b = await client.register(fixture.registration);
  assert.deepEqual(a, b); assert.deepEqual(Object.keys(a).sort(), ['next_step', 'status']);
  assert.equal(calls.length, 2); assert.ok(!JSON.stringify([a, b]).includes('synthetic-opaque-token'));
});

for (const bad of [{ status: 'active', next_step: 'pending_platform_review' }, { status: 'submitted', next_step: 'approved' },
  { status: 'submitted', next_step: 'pending_platform_review', user_id: 12 }, { status: 'submitted', next_step: 'pending_platform_review', authToken: 'PRIVATE_SENTINEL' },
  { status: 'submitted', next_step: 'pending_platform_review', duplicate: true }, { user_id: 12, organization_id: 22, approval_request_id: 44 }]) {
  test(`registration refuses an unapproved acknowledgement shape ${Object.keys(bad).join('/')}:${bad.status || 'legacy'}`, async () => {
    const client = createSandboxCustomerClient(config(async () => ok(bad)));
    await assert.rejects(client.register(fixture.registration), e => /submission response could not be verified/.test(e.message) && !e.message.includes('PRIVATE_SENTINEL'));
  });
}

test('test datasource and bounded server-only gateway key are mandatory before transport', () => {
  let calls = 0;
  for (const override of [{ datasource: undefined }, { datasource: 'live' }, { datasource: '' }, { gatewayKey: undefined }, { gatewayKey: '' },
    { gatewayKey: 'x'.repeat(31) }, { gatewayKey: 'x'.repeat(257) }, { gatewayKey: 42 }, { gatewayKey: 'x'.repeat(32) + '\r\n' }, { gatewayKey: ' '.repeat(32) }]) {
    assert.throws(() => createSandboxCustomerClient({ ...config(async () => { calls++; }), ...override }), /test datasource and server gateway ingress/);
  }
  assert.equal(calls, 0);
});

test('post-approval identity and membership must agree before draft creation', async () => {
  for (const changed of ['identity-user', 'membership-user', 'membership-org']) {
    let draftCalls = 0;
    const client = createSandboxCustomerClient(config(async url => {
      const endpoint = new URL(url).pathname;
      if (endpoint.endsWith('/auth/login')) return ok({ user_id: 12, authToken: 'synthetic-token' });
      if (endpoint.endsWith('/auth/me')) return ok({ id: changed === 'identity-user' ? 99 : 12, name: fixture.registration.name, email: fixture.registration.email, system_role: 'customer_admin', status: 'active', active_organization_id: 22 });
      if (endpoint.endsWith('/organization/membership')) return ok({ organization: { id: changed === 'membership-org' ? 99 : 22, type: 'customer', status: 'active', kyb_verified: false }, membership: { id: 8, organization_id: changed === 'membership-org' ? 99 : 22, user_id: changed === 'membership-user' ? 99 : 12, member_role: 'owner', is_active: true, is_primary: true }, booking_scope: 'draft_only' });
      draftCalls++; throw Error('draft must not be reached');
    }));
    await assert.rejects(runSandboxCustomerFlow(client, fixture, { phase: 'after-approval' }), /match/);
    assert.equal(draftCalls, 0);
  }
});
