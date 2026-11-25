import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGateway } from './gateway.mjs';

// Synthetic values only. No real key, account or workspace address appears in this file.
const key = 'k'.repeat(40);
const baseEnv = { XANO_AUTH_BASE_URL: 'https://xano.example/api:auth', XANO_AUTH_RELEASE: 'verified' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const identity = { id: 7, name: 'Test user', email: 'test@example.com', system_role: 'customer_admin', status: 'active', active_organization_id: 12 };

function setup(env) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), headers: { ...(init.headers || {}) } });
    const path = new URL(url).pathname;
    if (path.endsWith('/auth/login')) return reply({ authToken: 'synthetic-token', user_id: 7 });
    if (path.endsWith('/auth/me')) return reply(identity);
    throw new Error('Unexpected URL');
  };
  return { calls, handle: createGateway({ env: { ...baseEnv, ...env }, fetchImpl }) };
}
const login = handle => handle({ method: 'POST', url: '/api/auth/login', headers: new Headers({ 'content-type': 'application/json' }), body: { email: 'test@example.com', password: 'synthetic-password' } });

test('without ingress settings, Xano requests carry no data-source or gateway-key header', async () => {
  const { handle, calls } = setup({});
  const result = await login(handle);
  assert.equal(result.status, 200);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.headers['X-Data-Source'], undefined);
    assert.equal(call.headers['x-zippy-gateway-key'], undefined);
  }
});

test('with both settings, login and identity requests name the test data source and present the gateway key', async () => {
  const { handle, calls } = setup({ XANO_DATA_SOURCE: 'test', XANO_GATEWAY_KEY: key });
  const status = await handle({ url: '/api/status' });
  assert.equal(status.data.authenticationAvailable, true);
  const result = await login(handle);
  assert.equal(result.status, 200);
  assert.equal(result.data.user.workspace, 'customer');
  assert.deepEqual(calls.map(c => new URL(c.url).pathname), ['/api:auth/auth/login', '/api:auth/auth/me']);
  for (const call of calls) {
    assert.equal(call.headers['X-Data-Source'], 'test');
    assert.equal(call.headers['x-zippy-gateway-key'], key);
  }
  assert.equal(calls[0].headers['Content-Type'], 'application/json');
  assert.equal(calls[1].headers.Authorization, 'Bearer synthetic-token');
  assert.ok(!JSON.stringify([status, result]).includes(key), 'the gateway key must never be returned');
});

for (const [name, env] of [
  ['data source without key', { XANO_DATA_SOURCE: 'test' }],
  ['key without data source', { XANO_GATEWAY_KEY: key }],
  ['short key', { XANO_DATA_SOURCE: 'test', XANO_GATEWAY_KEY: 'too-short' }],
  ['key with whitespace', { XANO_DATA_SOURCE: 'test', XANO_GATEWAY_KEY: `${key} x` }],
  ['malformed data source', { XANO_DATA_SOURCE: 'Test Source', XANO_GATEWAY_KEY: key }],
]) {
  test(`partial or malformed ingress fails closed before any upstream call: ${name}`, async () => {
    const { handle, calls } = setup(env);
    const status = await handle({ url: '/api/status' });
    assert.equal(status.data.authenticationAvailable, false);
    const result = await login(handle);
    assert.equal(result.status, 503);
    assert.equal(calls.length, 0);
    assert.ok(!JSON.stringify([status, result]).includes(key), 'the gateway key must never be returned');
  });
}
