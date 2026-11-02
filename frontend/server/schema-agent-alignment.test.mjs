import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { bookingStatuses, bookingPage } from './bookings.mjs';

const root = new URL('../../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const base = 'contracts/backend-frontend/0.1.3/';
const catalog = JSON.parse(await read(base + 'schema-catalog.json'));
const flow = JSON.parse(await read(base + 'agent-dataflow.json'));
const proposal = JSON.parse(await read(base + 'schema-change-proposal.json'));

test('historical safety comparison pins both copies and does not assert current guards', async () => {
  const comparison = JSON.parse(await read(base + 'inventory-reconciliation.json'));
  const published = JSON.parse(await read('backend/reconciliation-20261029/evidence/published-inventory.json'));
  const diff = JSON.parse(await read('backend/reconciliation-20261029/evidence/published-draft-diff.json'));
  assert.equal(comparison.currentLiveInventoryVerified, false);
  assert.deepEqual(comparison.referenceOnly, ['table:zippy_db_crosswalk_49_to_xano_33']);
  assert.deepEqual(comparison.exportOnly, []);
  assert.deepEqual(JSON.parse(await read(base + 'published-paths.json')), published.documents.map(d => d.file));
  assert.equal(comparison.changedCount, diff.changed.length);
  assert.equal(comparison.safetyFiles.length, 14);
  for (const row of comparison.safetyFiles) {
    assert.ok(diff.changed.some(d => d.key === row.key));
    const copies = [];
    for (const side of ['published', 'draft']) {
      const content = (await read('backend/reconciliation-20261029/evidence/' + row[side + 'Path'])).replace(/\r\n/g, '\n');
      // Historical inventory hashes trim surrounding whitespace before hashing.
      assert.equal(createHash('sha256').update(content.trim()).digest('hex'), row[side + 'Sha256']);
      assert.equal(/stack\s*\{\s*\}/.test(content), row[side + 'Evidence'].emptyStack);
      copies.push(content);
    }
    assert.equal(copies[0] !== copies[1], row.changed);
  }
});

test('schema catalog covers every retained table and declaration without treating it as live evidence', async () => {
  const files = await readdir(new URL('backend/reconciliation-20261029/evidence/published/table/', root));
  assert.deepEqual(Object.keys(catalog.tables).sort(), files.filter(f => f.endsWith('.xs')).map(f => f.slice(0, -3)).sort());
  assert.equal(catalog.currentLiveSchemaVerified, false);
  for (const [name, table] of Object.entries(catalog.tables)) {
    const source = (await read(table.source)).replace(/\r\n/g, '\n');
    assert.equal(createHash('sha256').update(source).digest('hex'), table.sha256LF, name);
    const body = source.slice(source.indexOf('  schema {') + '  schema {'.length).split('\n  }')[0];
    const declarations = body.split('\n').filter(line => /^ {4}\S/.test(line) && !/^ {4}(?:\/\/|})/.test(line));
    assert.deepEqual(Object.values(table.fields).map(f => f.declaration), declarations.map(line => line.trim()), name);
    for (const field of Object.values(table.fields)) {
      if (field.referenceTable) assert.ok(catalog.tables[field.referenceTable], `${name}: missing referenced table`);
    }
  }
});

test('all five agent projections reference real fields and exclude secret/raw evidence', () => {
  assert.deepEqual(Object.keys(flow.agents), ['OMS', 'IMS', 'TMS', 'VERIFICATION', 'FINANCE_COMPLIANCE']);
  const denied = /password|otp_code|claim_token|private_storage_key|signature_image_url|document_image_url|consignee|address|input_context|decision_rationale/;
  for (const agent of Object.values(flow.agents)) {
    assert.equal(agent.writesAllowed, false);
    assert.equal(agent.runtimeVerified, false);
    for (const [table, fields] of Object.entries(agent.serverOnlyReadProjection)) {
      for (const field of fields) {
        assert.ok(catalog.tables[table]?.fields[field], `${table}.${field} missing`);
        assert.doesNotMatch(field, denied);
      }
    }
  }
});

test('legacy identities and approval types cannot silently stand in for new agents', () => {
  const legacy = catalog.tables.agent_execution.fields.agent_name.enum;
  assert.deepEqual(legacy, catalog.tables.agent_decision.fields.agent_name.enum);
  assert.deepEqual(proposal.legacyAgentNames, legacy);
  assert.deepEqual(proposal.automaticAliases, {});
  assert.ok(proposal.requestedAgentNames.every(id => !legacy.includes(id)));
  assert.ok(!catalog.tables.approval_request.fields.request_type.enum.includes('assessment_review'));
  assert.equal(proposal.status, 'DESIGN_ONLY_NOT_APPLIED');
});

test('real customer adapter projects catalog fields and rejects foreign tenant data', () => {
  assert.deepEqual(bookingStatuses, catalog.tables.customer_booking.fields.status.enum);
  const row = { id: 1, customer_organization_id: 7, version: 2, booking_reference: 'synthetic', pickup_city: 'A', delivery_city: 'B', status: 'draft', payment_status: 'pending', payment_mode: null, private_storage_key: 'must-not-pass' };
  const fail = (status, code) => { throw new Error(`${status}:${code}`); };
  const page = bookingPage({ items: [row], curPage: 1, nextPage: null }, { organizationId: 7 }, 1, 10, fail);
  for (const field of Object.keys(page.items[0])) assert.ok(catalog.tables.customer_booking.fields[field]);
  assert.ok(!('customer_organization_id' in page.items[0]));
  assert.ok(!('private_storage_key' in page.items[0]));
  assert.equal(page.readOnly, true);
  assert.throws(() => bookingPage({ items: [row], curPage: 1, nextPage: null }, { organizationId: 8 }, 1, 10, fail), /403:BOOKING_SCOPE_DENIED/);
});
