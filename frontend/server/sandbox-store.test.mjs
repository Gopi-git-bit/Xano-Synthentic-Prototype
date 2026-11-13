import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSandboxStore } from './sandbox-store.mjs';

test('Redis adapter encrypts tokens, hides cookie IDs, shares state and durably deletes across instances (mock REST)', async () => {
  const values = new Map(), commands = [];
  const fetchImpl = async (url, options) => {
    assert.equal(url, 'https://test-store.upstash.io/'); assert.equal(options.redirect, 'error');
    const args = JSON.parse(options.body); commands.push(args); let result;
    if (args[0] === 'SET') { assert.deepEqual(args.slice(3), ['EX', 900, 'NX']); values.set(args[1], args[2]); result = 'OK'; }
    if (args[0] === 'GET') result = values.get(args[1]) ?? null;
    if (args[0] === 'DEL') { values.delete(args[1]); result = 1; }
    if (args[0] === 'EVAL') { assert.match(args[1], /INCR/); assert.match(args[1], /EXPIRE/); result = 4; }
    return new Response(JSON.stringify({ result }));
  };
  const config = { url: 'https://test-store.upstash.io', token: 'mock-store-credential', key: Buffer.alloc(32, 4), namespace: 'test-tenant', fetchImpl };
  const a = createSandboxStore(config), b = createSandboxStore(config), record = { token: 'mock-private-xano-token', expiresAt: 999 };
  await a.create('opaque-cookie-identifier', record, 900);
  assert.ok(!JSON.stringify(commands).includes(record.token)); assert.ok(!JSON.stringify(commands).includes('opaque-cookie-identifier'));
  assert.deepEqual(await b.get('opaque-cookie-identifier'), record);
  assert.equal(await b.consume('ip:synthetic-ip', 3, 60), false);
  await b.delete('opaque-cookie-identifier'); assert.equal(await a.get('opaque-cookie-identifier'), null);
});
test('encrypted state rejects tampering, store errors and misconfiguration', async () => {
  const config = { url: 'https://test-store.upstash.io', token: 'mock-store-credential', key: Buffer.alloc(32, 4), namespace: 'test-tenant' };
  for (const url of ['http://test-store.upstash.io', 'https://evil.invalid', 'https://test-store.upstash.io/path', 'https://user:test@test-store.upstash.io', 'https://test-store.upstash.io?query']) assert.throws(() => createSandboxStore({ ...config, url }));
  const corrupt = createSandboxStore({ ...config, fetchImpl: async () => new Response(JSON.stringify({ result: 'corrupt' })) });
  await assert.rejects(corrupt.get('id'));
  const denied = createSandboxStore({ ...config, fetchImpl: async () => new Response(JSON.stringify({ error: 'private provider error' })) });
  await assert.rejects(denied.create('id', { token: 'mock' }, 1), /Shared state unavailable/);
});
