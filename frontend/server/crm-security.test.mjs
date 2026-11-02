import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGateway } from './gateway.mjs';

const headers = new Headers({ authorization: 'Bearer synthetic-admin' });
const grant = { recordIds: ['100', '101'], fields: ['Last_Name', 'Owner'] };
const identity = { id: 7, name: 'Synthetic Admin', email: 'admin@example.test', system_role: 'operations_admin', status: 'active', active_organization_id: 12 };
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
function setup(options = {}) {
  const env = { XANO_AUTH_BASE_URL: 'https://xano.example/api:auth', XANO_AUTH_RELEASE: 'verified', ZOHO_READ_RELEASE: 'verified', ZOHO_ACCOUNTS_URL: 'https://accounts.zoho.in', ZOHO_CLIENT_ID: 'synthetic-client', ZOHO_CLIENT_SECRET: 'synthetic-secret', ZOHO_REFRESH_TOKEN: 'synthetic-refresh', CRM_READ_GRANTS_JSON: JSON.stringify({ 7: { Contacts: grant } }), ...options.env };
  const calls = [];
  const handle = createGateway({ env, now: options.now, fetchImpl: async (url, init) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, init });
    const overridden = await options.override?.(parsed, init, env);
    if (overridden) return overridden;
    if (parsed.pathname.endsWith('/auth/me')) return reply({ ...identity, ...options.identity });
    if (parsed.pathname.endsWith('/oauth/v2/token')) return reply({ access_token: 'synthetic-access', expires_in: 3600, api_domain: 'https://www.zohoapis.in' });
    if (parsed.pathname.endsWith('/settings/modules')) return reply({ modules: [
      { api_name: 'Contacts', plural_label: 'People', api_supported: true, viewable: true, status: 'visible' },
      { api_name: 'Deals', api_supported: true, viewable: true, status: 'visible' },
      { api_name: 'Tasks', api_supported: true, viewable: true, status: 'system_hidden' },
    ] });
    if (parsed.pathname.endsWith('/settings/fields')) return reply({ fields: grant.fields.map(api_name => ({ api_name, visible: true })) });
    if (/\/Contacts\/\d+$/.test(parsed.pathname)) return reply({ data: [{ id: parsed.pathname.split('/').at(-1), Last_Name: 'Synthetic', Owner: { id: '999', name: 'Foreign owner' }, Salary: 999 }] });
    throw new Error('Unexpected provider request');
  } });
  return { env, calls, handle, read: (url = '/api/crm/record?module=Contacts&id=100') => handle({ url, headers }) };
}

test('status distinguishes configuration, release authorization and authenticated metadata verification', async () => {
  const { handle, calls, read } = setup();
  const publicStatus = (await handle({ url: '/api/status' })).data;
  assert.equal(publicStatus.crmConfigured, true);
  assert.equal(publicStatus.crmReleaseAuthorized, true);
  assert.equal(publicStatus.crmConnectionVerified, false);
  assert.equal(publicStatus.crmAvailable, false);
  assert.equal(calls.length, 0);
  const verified = (await read('/api/status')).data;
  assert.equal(verified.crmAvailable, true); assert.equal(verified.crmConnectionVerified, true);
  assert.ok(calls.every(c => !/\/Contacts\//.test(c.url.pathname)));
  for (const env of [{ ZOHO_CLIENT_SECRET: '' }, { ZOHO_READ_RELEASE: 'blocked' }]) {
    const instance = setup({ env });
    assert.equal((await instance.read('/api/status')).data.crmAvailable, false);
    assert.equal(instance.calls.length, 1);
  }
  const denied = setup({ env: { CRM_READ_GRANTS_JSON: '{}' } });
  assert.equal((await denied.read('/api/status')).status, 403);
});

for (const role of ['customer_admin', 'customer_member', 'vendor_admin', 'fleet_manager', 'driver']) {
  test(`${role} cannot obtain CRM data using forged browser authority`, async () => {
    const { handle, calls } = setup({ identity: { system_role: role } });
    for (const route of ['modules', 'records?module=Contacts', 'record?module=Contacts&id=100']) {
      const result = await handle({ url: `/api/crm/${route}`, headers: new Headers({ authorization: 'Bearer synthetic-user', 'x-role': 'super_admin', 'x-organization-id': '7' }), body: { role: 'super_admin', user_id: 7 } });
      assert.equal(result.status, 403);
    }
    assert.ok(calls.every(c => c.url.hostname === 'xano.example'));
  });
}
test('anonymous is denied on every CRM route without contacting any provider', async () => {
  const { handle, calls } = setup();
  for (const route of ['modules', 'records?module=Contacts', 'record?module=Contacts&id=100']) assert.equal((await handle({ url: `/api/crm/${route}` })).status, 401);
  assert.equal(calls.length, 0);
});
test('grants are rechecked on every request and after in-flight revocation', async () => {
  const instance = setup();
  assert.equal((await instance.read()).status, 200);
  instance.env.CRM_READ_GRANTS_JSON = '{}';
  const before = instance.calls.length;
  assert.equal((await instance.read()).status, 403);
  assert.equal(instance.calls.length - before, 1);
  const revoked = setup({ override: (url, init, env) => { if (url.pathname.endsWith('/Contacts/100')) env.CRM_READ_GRANTS_JSON = '{}'; } });
  const result = await revoked.read();
  assert.equal(result.status, 403); assert.doesNotMatch(JSON.stringify(result), /Synthetic|Foreign owner/);
});
test('malformed grants fail closed before Zoho access', async () => {
  for (const value of ['null', '[]', '{', '{"7":[]}', JSON.stringify({ 7: { Contacts: { ...grant, fields: ['*'] } } }), JSON.stringify({ 7: { Contacts: { ...grant, recordIds: ['*'] } } })]) {
    const instance = setup({ env: { CRM_READ_GRANTS_JSON: value } });
    assert.ok((await instance.read()).status >= 400); assert.equal(instance.calls.length, 1);
  }
});
test('foreign IDs and modules are rejected before any Zoho retrieval; query overrides rejected', async () => {
  for (const route of ['record?module=Contacts&id=999', 'records?module=Accounts']) {
    const instance = setup(); assert.equal((await instance.read(`/api/crm/${route}`)).status, 403); assert.equal(instance.calls.length, 1);
  }
  for (const query of ['fields=Salary', 'role=admin', 'organization_id=77', 'per_page=1000', 'page=1&page=2', 'search=anything']) {
    const instance = setup(); assert.equal((await instance.read(`/api/crm/records?module=Contacts&${query}`)).status, 400); assert.equal(instance.calls.length, 1);
  }
});
test('provider-hidden modules and hidden/restricted/missing fields cannot be read', async () => {
  const hidden = setup({ env: { CRM_READ_GRANTS_JSON: JSON.stringify({ 7: { Tasks: grant } }) } });
  assert.deepEqual((await hidden.read('/api/crm/modules')).data.modules, []);
  assert.equal((await hidden.read('/api/crm/records?module=Tasks')).status, 403);
  for (const fields of [[], [{ api_name: 'Last_Name', visible: false }], [{ api_name: 'Last_Name', visible: true, private: { restricted: true } }]]) {
    const instance = setup({ override: url => url.pathname.endsWith('/settings/fields') ? reply({ fields }) : null });
    assert.equal((await instance.read()).status, 403);
    assert.ok(instance.calls.every(c => !/\/Contacts\//.test(c.url.pathname)));
  }
});
test('nested lookup data and unapproved fields never leave the gateway', async () => {
  const result = await setup().read();
  assert.deepEqual(result.data.record, { id: '100', fields: { Last_Name: 'Synthetic', Owner: null }, orderLinks: [] });
  assert.doesNotMatch(JSON.stringify(result), /Salary|Foreign owner|synthetic-access|synthetic-secret/);
});
for (const status of [401, 403, 404, 429, 500]) {
  test(`provider ${status} is sanitized and not returned as successful data`, async () => {
    const instance = setup({ override: url => url.pathname.endsWith('/Contacts/100') ? reply({ message: 'private provider credential diagnostic' }, status) : null });
    const result = await instance.read();
    assert.equal(result.status, status === 401 ? 403 : status === 500 ? 503 : status);
    assert.doesNotMatch(JSON.stringify(result), /private provider|credential diagnostic/);
    if (status === 401) assert.equal(instance.calls.filter(c => c.url.pathname.endsWith('/Contacts/100')).length, 2);
  });
}
test('expired access token refreshes once and concurrent refreshes are coalesced', async () => {
  let clock = 1000;
  const instance = setup({ now: () => clock });
  await Promise.all([instance.read(), instance.read()]);
  assert.equal(instance.calls.filter(c => c.url.pathname.endsWith('/oauth/v2/token')).length, 1);
  clock += 3600000;
  assert.equal((await instance.read()).status, 200);
  assert.equal(instance.calls.filter(c => c.url.pathname.endsWith('/oauth/v2/token')).length, 2);
});
test('refresh failures and incorrect regional API hosts never release OAuth tokens', async () => {
  for (const response of [reply({ error: 'invalid_grant', secret: 'sensitive' }, 400), reply({ error: 'invalid_client' }), reply({ access_token: 'sensitive', expires_in: 3600, api_domain: 'https://www.zohoapis.com' }), reply({ access_token: {}, expires_in: 3600, api_domain: 'https://www.zohoapis.in' })]) {
    const instance = setup({ override: url => url.pathname.endsWith('/oauth/v2/token') ? response : null });
    const result = await instance.read();
    assert.equal(result.status, 503); assert.doesNotMatch(JSON.stringify(result), /sensitive|invalid_grant|invalid_client/);
    assert.ok(instance.calls.every(c => !c.url.hostname.startsWith('www.zohoapis')));
  }
  const instance = setup({ env: { ZOHO_ACCOUNTS_URL: 'https://accounts.zoho.in.evil.example' } });
  assert.equal((await instance.read()).status, 503); assert.equal(instance.calls.length, 1);
});
test('malformed module, field and record bodies are errors, never empty success', async () => {
  for (const [path, bodies] of [['/settings/modules', [null, {}, { modules: [null] }]], ['/settings/fields', [null, {}, { fields: [null] }]], ['/Contacts/100', [null, {}, { data: {} }, { data: [null] }, { data: [{ id: '999' }] }, { data: [{ id: '100' }, { id: '999' }] }]]]) {
    for (const body of bodies) {
      const instance = setup({ override: url => url.pathname.endsWith(path) ? reply(body) : null });
      assert.equal((await instance.read()).status, 502);
    }
  }
});
test('timeout and malformed JSON are sanitized; redirects and finite timeout signals enforced', async () => {
  const instance = setup({ override: (url, init) => {
    assert.equal(init.redirect, 'error'); assert.ok(init.signal instanceof AbortSignal);
    if (url.pathname.endsWith('/settings/fields')) throw new Error('timeout sensitive trace');
  } });
  const result = await instance.read(); assert.equal(result.status, 503); assert.doesNotMatch(JSON.stringify(result), /sensitive trace/);
  const malformed = setup({ override: url => url.pathname.endsWith('/Contacts/100') ? new Response('not JSON') : null });
  assert.equal((await malformed.read()).status, 502);
});
test('expired Xano session cannot reuse cached Zoho authorization', async () => {
  let expired = false;
  const instance = setup({ override: url => expired && url.pathname.endsWith('/auth/me') ? reply({}, 401) : null });
  await instance.read(); expired = true;
  const before = instance.calls.length;
  assert.equal((await instance.read()).status, 401); assert.equal(instance.calls.length - before, 1);
});
test('CRM grants enable no Xano finance, dispatch, refund, POD or mutation routes', async () => {
  const instance = setup();
  for (const route of ['finance', 'dispatch', 'payments', 'refunds', 'pod', 'orders/100/refund']) {
    for (const method of ['GET', 'POST']) assert.equal((await instance.handle({ url: `/api/${route}`, method, headers })).status, 404);
  }
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) assert.equal((await instance.handle({ url: '/api/crm/record?module=Contacts&id=100', method, headers })).status, 405);
  assert.ok(instance.calls.every(c => c.url.pathname.endsWith('/auth/me')));
});
