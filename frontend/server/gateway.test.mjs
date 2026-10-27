import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGateway } from './gateway.mjs';

const grant = { recordIds: ['100', '101'], fields: ['Last_Name', 'Email'] };
const baseEnv = { XANO_AUTH_BASE_URL: 'https://xano.example/api:auth', XANO_AUTH_RELEASE: 'verified', ZOHO_READ_RELEASE: 'verified', ZOHO_ACCOUNTS_URL: 'https://accounts.zoho.in', ZOHO_CLIENT_ID: 'test-client', ZOHO_CLIENT_SECRET: 'test-secret-not-real', ZOHO_REFRESH_TOKEN: 'test-refresh-not-real', CRM_READ_GRANTS_JSON: JSON.stringify({ 7: { Contacts: grant } }) };
const headers = new Headers({ authorization: 'Bearer valid-test-token' });
const reply = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
function setup(options = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    const path = new URL(url).pathname;
    if (path.endsWith('/auth/me')) return reply({ id: 7, name: 'Test user', email: 'test@example.com', role: 'admin', system_role: options.role === 'member' ? 'customer_member' : 'operations_admin', status: 'active', active_organization_id: 12 });
    if (options.override) { const response = await options.override(url, init); if (response) return response; }
    if (path.endsWith('/oauth/v2/token')) return reply({ access_token: 'test-access-not-real', api_domain: 'https://www.zohoapis.in', expires_in: 3600 });
    if (path.endsWith('/settings/modules')) return reply({ modules: [{ api_name: 'Contacts', plural_label: 'People', api_supported: true, viewable: true }, { api_name: 'Leads', api_supported: true, viewable: true }, { api_name: 'Hidden', api_supported: true, viewable: false }] });
    if (/\/Contacts\/\d+$/.test(path)) return reply({ data: [{ id: path.split('/').at(-1), Last_Name: 'Example', Email: 'test@example.com', Salary: 9000, Owner: { name: 'Secret relation' } }] });
    throw new Error('Unexpected URL');
  };
  return { calls, handle: createGateway({ env: { ...baseEnv, ...options.env }, fetchImpl, ...(options.now ? { now: options.now } : {}) }) };
}

test('anonymous denied before any upstream; browser role cannot grant CRM access', async () => {
  const { handle, calls } = setup({ role: 'member' });
  const anonymous = await handle({ url: '/api/crm/modules' });
  assert.equal(anonymous.status, 401); assert.equal(calls.length, 0);
  const member = await handle({ url: '/api/crm/modules?role=admin', headers, body: { role: 'admin' } });
  assert.equal(member.status, 403); assert.equal(member.data.error.code, 'ADMIN_REQUIRED');
  assert.equal(calls.length, 1);
});
test('Admin without record grants denied; unauthorized object rejected before Zoho read', async () => {
  const noScope = setup({ env: { CRM_READ_GRANTS_JSON: '{}' } });
  assert.equal((await noScope.handle({ url: '/api/crm/modules', headers })).status, 403);
  assert.equal(noScope.calls.length, 1);
  const { handle, calls } = setup();
  const result = await handle({ url: '/api/crm/record?module=Contacts&id=999', headers });
  assert.equal(result.status, 403); assert.equal(calls.length, 1);
  assert.equal((await handle({ url: '/api/crm/records?module=Leads', headers })).status, 403);
});
test('module metadata intersects grants and record responses project only allowed fields', async () => {
  const { handle } = setup();
  const modules = await handle({ url: '/api/crm/modules', headers });
  assert.deepEqual(modules.data.modules.map(m => m.apiName), ['Contacts']);
  const record = await handle({ url: '/api/crm/record?module=Contacts&id=100', headers });
  assert.equal(record.status, 200); assert.deepEqual(record.data.record.fields, { Last_Name: 'Example', Email: 'test@example.com' });
  assert.doesNotMatch(JSON.stringify(record), /Salary|Secret relation|test-access-not-real/);
});
test('pagination reads only granted objects and never scans tenant-wide records', async () => {
  const ids = Array.from({ length: 12 }, (_, i) => String(100 + i));
  const { handle, calls } = setup({ env: { CRM_READ_GRANTS_JSON: JSON.stringify({ 7: { Contacts: { ...grant, recordIds: ids } } }) } });
  const first = await handle({ url: '/api/crm/records?module=Contacts&page=1', headers });
  assert.equal(first.data.records.length, 10); assert.equal(first.data.nextPage, 2);
  const second = await handle({ url: '/api/crm/records?module=Contacts&page=2', headers });
  assert.deepEqual(second.data.records.map(r => r.id), ['110', '111']); assert.equal(second.data.nextPage, null);
  assert.ok(calls.filter(c => c.url.includes('/Contacts/')).every(c => ids.includes(new URL(c.url).pathname.split('/').at(-1))));
  assert.equal((await handle({ url: '/api/crm/records?module=Contacts&page=-1', headers })).status, 400);
});
test('CRM writes and uncontracted operational endpoints are refused', async () => {
  const { handle, calls } = setup();
  assert.equal((await handle({ method: 'POST', url: '/api/crm/record?module=Contacts&id=100', headers, body: { approved: true } })).status, 405);
  assert.equal((await handle({ method: 'POST', url: '/api/orders/100/refund', headers })).status, 404);
  assert.equal(calls.filter(c => c.url.includes('zoho')).length, 0);
});
test('401 refresh is bounded; token never reaches client; token cache reused', async () => {
  let metadataCalls = 0;
  const { handle, calls } = setup({ override: url => String(url).endsWith('/settings/modules') && ++metadataCalls === 1 ? reply({ error: 'upstream secret' }, 401) : null });
  const result = await handle({ url: '/api/crm/modules', headers });
  assert.equal(result.status, 200); assert.equal(calls.filter(c => c.url.endsWith('/oauth/v2/token')).length, 2);
  await handle({ url: '/api/crm/modules', headers });
  assert.equal(calls.filter(c => c.url.endsWith('/oauth/v2/token')).length, 2);
  assert.doesNotMatch(JSON.stringify(result), /test-access|upstream secret/);
  const denied = setup({ override: url => String(url).endsWith('/settings/modules') ? reply({}, 401) : null });
  assert.equal((await denied.handle({ url: '/api/crm/modules', headers })).status, 403);
  assert.equal(denied.calls.filter(c => c.url.endsWith('/settings/modules')).length, 2);
});
test('rate limits honor retry delay and timeout never becomes success', async () => {
  const { handle, calls } = setup({ now: () => 1000, override: url => String(url).endsWith('/settings/modules') ? reply({}, 429, { 'Retry-After': '90' }) : null });
  const result = await handle({ url: '/api/crm/modules', headers });
  assert.equal(result.status, 429); assert.equal(result.retryAfter, 90);
  await handle({ url: '/api/crm/modules', headers });
  assert.equal(calls.filter(c => c.url.endsWith('/settings/modules')).length, 1);
  const oauthLimited = setup({ override: url => String(url).endsWith('/oauth/v2/token') ? reply({}, 429, { 'Retry-After': '45' }) : null });
  const oauthResult = await oauthLimited.handle({ url: '/api/crm/modules', headers });
  assert.equal(oauthResult.status, 429); assert.equal(oauthResult.retryAfter, 45);
  const timeout = setup({ override: () => { throw new Error('timeout with secret details'); } });
  const failed = await timeout.handle({ url: '/api/crm/modules', headers });
  assert.equal(failed.status, 503); assert.doesNotMatch(JSON.stringify(failed), /secret details/);
});
test('OAuth missing or malicious API domain fails closed without credentials leaving trusted host', async () => {
  const missing = setup({ env: { ZOHO_CLIENT_SECRET: '' } });
  assert.equal((await missing.handle({ url: '/api/crm/modules', headers })).data.error.code, 'ZOHO_NOT_CONFIGURED');
  const malicious = setup({ override: url => String(url).endsWith('/oauth/v2/token') ? reply({ access_token: 'sensitive', expires_in: 3600, api_domain: 'https://evil.example' }) : null });
  assert.equal((await malicious.handle({ url: '/api/crm/modules', headers })).status, 503);
  assert.ok(malicious.calls.every(c => !c.url.includes('evil.example')));
});
test('signup forwards only verified input fields, never browser role grants', async () => {
  const { handle, calls } = setup({ override: url => String(url).endsWith('/auth/signup') ? reply({ authToken: 'new-test-token', user_id: 99 }) : null });
  const result = await handle({ method: 'POST', url: '/api/auth/signup', headers: new Headers({ 'Content-Type': 'application/json' }), body: { name: 'Example', email: 'test@example.com', password: 'Password123', role: 'admin', assignments: ['all'] } });
  assert.equal(result.status, 200);
  assert.deepEqual(Object.keys(JSON.parse(calls[0].init.body)).sort(), ['email', 'name', 'password']);
});
