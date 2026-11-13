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
  authBase, bookingsBase, expectedOrigin: origin, expectedTenant: tenant, fetchImpl,
});
function simulatedBackend(calls) {
  let registered = false;
  return async (url, options) => {
    const u = new URL(url);
    calls.push({ url: u.pathname + u.search, method: options.method, redirect: options.redirect,
      tokenPresent: Boolean(options.headers.Authorization) });
    assert.equal(options.redirect, 'error');
    const path = u.pathname.slice(('/tenant/' + tenant).length);
    if (path === '/api:zippy-customer-draft-auth/auth/register' && options.method === 'POST') {
      const input = JSON.parse(options.body);
      assert.equal(input.email, fixture.registration.email);
      assert.equal(input.organization_name, fixture.registration.organization_name);
      assert.equal(input.requested_system_role, undefined);
      registered = true;
      return ok({ user_id: 12, organization_id: 22, system_role: 'customer_admin',
        status: 'active', booking_scope: 'draft_only',
        approval_request_id: 44, verification_state: 'pending_human_review' });
    }
    if (path === '/api:zippy-customer-draft-auth/auth/login' && registered) {
      return ok({ authToken: 'synthetic-opaque-token', user_id: 12 });
    }
    assert.equal(options.headers.Authorization, 'Bearer synthetic-opaque-token');
    if (path === '/api:zippy-customer-draft-auth/auth/me') {
      return ok({ id: 12, name: fixture.registration.name, email: fixture.registration.email,
        system_role: 'customer_admin', status: 'active', active_organization_id: 22 });
    }
    if (path === '/api:zippy-customer-draft-auth/organization/membership') {
      return ok({ organization: { id: 22, kyb_verified: false, status: 'active' },
        membership: { user_id: 12, member_role: 'owner', is_active: true }, booking_scope: 'draft_only' });
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
}

test('sandbox customer flow registers, authenticates and creates/reads a draft without tokens in output', async () => {
  const calls = [];
  const client = createSandboxCustomerClient(config(simulatedBackend(calls)));
  const result = await runSandboxCustomerFlow(client, fixture);
  assert.deepEqual(result, {
    outcome: 'SANDBOX_CUSTOMER_FLOW_VERIFIED',
    userId: 12, organizationId: 22, reviewId: 44, bookingId: 33,
    bookingStatus: 'draft', bookingScope: 'draft_only', verifiedFinancialActions: false,
  });
  assert.deepEqual(calls.map(x => x.method), ['POST', 'POST', 'GET', 'GET', 'POST', 'GET', 'GET']);
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
    if (path.endsWith('/auth/register')) return ok({ user_id: 12, organization_id: 22,
      system_role: 'customer_admin', status: 'active', booking_scope: 'draft_only',
      approval_request_id: 44, verification_state: 'pending_human_review' });
    if (path.endsWith('/auth/login')) return ok({ authToken: 'synthetic-opaque-token', user_id: 12 });
    if (path.endsWith('/auth/me')) return ok({ id: 12, name: 'SYNTHETIC Customer',
      email: fixture.registration.email, status: 'active',
      active_organization_id: 22, system_role: 'customer_admin' });
    if (path.endsWith('/organization/membership')) return ok({ organization: { id: 22, kyb_verified: false },
      membership: { user_id: 12, member_role: 'owner' }, booking_scope: 'draft_only' });
    if (options.method === 'POST' && path.endsWith('/bookings')) return ok({
      booking: { ...booking, customer_organization_id: 99 },
      draft_only: true, execution_enabled: false,
    });
    throw Error('Unexpected call');
  }));
  await assert.rejects(runSandboxCustomerFlow(client, fixture), /different organization/);
});
