import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createGateway } from './gateway.mjs';
import { bookingStatuses } from './bookings.mjs';

const root = new URL('../../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const base = 'contracts/backend-frontend/0.1.1/';
const proposal = await read(`${base}recovery-proposal.json`);
const review = await read(`${base}review.json`);

test('session-2 proposal is pinned, locally referenced, and never release evidence', async () => {
  const bytes = await readFile(new URL(`${base}recovery-proposal.json`, root));
  assert.equal(createHash('sha256').update(bytes.toString().replace(/\r\n/g, '\n')).digest('hex'), review.proposalSha256);
  assert.equal(review.releaseEligible, false);
  assert.equal(review.runtimeVerified, false);
  assert.equal(proposal.info['x-deployment_status'], 'NOT_DEPLOYED');
  assert.deepEqual(proposal.components.schemas.BookingStatus.enum, bookingStatuses);
  function refs(value) {
    if (!value || typeof value !== 'object') return;
    if (value.$ref) {
      assert.ok(value.$ref.startsWith('#/'));
      const resolved = value.$ref.slice(2).split('/').reduce((item, key) => item?.[key], proposal);
      assert.ok(resolved, value.$ref);
    }
    Object.values(value).forEach(refs);
  }
  refs(proposal);
});

test('receipt financial composition and ambiguous server binding stay explicit blockers', () => {
  const schemas = proposal.components.schemas;
  const extension = schemas.BookingItemFinancial.allOf[1];
  assert.equal(schemas.BookingItemBase.additionalProperties, false);
  assert.equal(extension.additionalProperties, false);
  // A required base property is forbidden by the other allOf branch: no row can satisfy both.
  assert.ok(schemas.BookingItemBase.required.some(key => !Object.hasOwn(extension.properties, key)));
  assert.equal(proposal.servers.length, 2);
  assert.equal(proposal.paths['/auth/register'].post.servers, undefined);
  for (const id of ['S2-01', 'S2-02']) assert.equal(review.findings.find(item => item.id === id).status, 'BLOCKED');
});

test('export handoff matches all retained identities and the full changed-resource list', async () => {
  const handoff = await read(`${base}export-handoff.json`);
  const evidence = 'backend/reconciliation-20261029/evidence/';
  for (const side of ['published', 'draft']) {
    const original = await read(`${evidence}${side}-inventory.json`);
    assert.deepEqual(handoff[side], original.documents.map(item => ({ key: item.key, path: item.file, sha256: item.sha256 })));
    assert.equal(handoff[side].length, 84);
    assert.equal(handoff[side].filter(item => item.key.startsWith('table:')).length, 33);
  }
  assert.deepEqual(handoff.differences, (await read(`${evidence}published-draft-diff.json`)).changed);
  assert.equal(handoff.differences.length, 41);
  assert.equal(handoff.currentLiveInventory, false);
});

test('all three recovery operations stay blocked for customer and admin identities', async () => {
  for (const role of ['customer_member', 'operations_admin', 'super_admin']) {
    const calls = [];
    const handle = createGateway({ env: { XANO_AUTH_BASE_URL: 'https://xano.example/api:auth', XANO_LOGISTICS_BASE_URL: 'https://xano.example/api:zippy-v1', XANO_AUTH_RELEASE: 'verified', XANO_BOOKING_READS_RELEASE: 'verified', XANO_ADMIN_READS_RELEASE: 'verified', XANO_REGISTRATION_RELEASE: 'verified' }, fetchImpl: async url => {
      calls.push(String(url));
      return Response.json({ id: 7, name: 'Synthetic', email: 'test@example.test', system_role: role, status: 'active', active_organization_id: 12 });
    } });
    for (const [path, methods] of Object.entries(proposal.paths)) {
      for (const method of Object.keys(methods)) {
        const result = await handle({ url: `/api${path.replace('{booking_id}', '31')}`, method: method.toUpperCase(), headers: new Headers({ authorization: 'Bearer synthetic' }), body: { action: 'confirm', expected_version: 1 } });
        assert.ok(result.status >= 400, `${role} ${path}`);
      }
    }
    assert.ok(calls.every(url => url === 'https://xano.example/api:auth/auth/me'));
  }
});
