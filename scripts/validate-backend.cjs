'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/^\uFEFF/, '');
const json = p => JSON.parse(read(p));
const domain = require('../backend/contracts/domain.cjs');
const cases = json('backend/contracts/domain-cases.json');
assert.equal(cases.length, 49, 'Update the documented case count deliberately');
const tested = new Set();
for (const test of cases) {
  assert.equal(typeof domain[test.fn], 'function', test.fn);
  assert.ok(Object.keys(test.expected).length, test.name + ' has no assertions');
  const actual = domain[test.fn](test.input);
  for (const [key, expected] of Object.entries(test.expected)) {
    assert.deepEqual(actual[key], expected, test.name + ': ' + key);
  }
  tested.add(test.fn);
}
assert.deepEqual([...tested].sort(), Object.keys(domain).sort(), 'Every predicate needs cases');
let exportedCases = 0;
for (const name of tested) {
  const xs = read('backend/xano/function/logistics/' + name + '.xs');
  const match = xs.match(/code\s*=\s*"""([\s\S]*?)"""/);
  assert.ok(match, 'Missing exported lambda: ' + name);
  const script = new vm.Script('(function(){' + match[1] + '\n})()');
  for (const test of cases.filter(c => c.fn === name)) {
    const context = vm.createContext({$input: {payload: structuredClone(test.input)}});
    const actual = JSON.parse(JSON.stringify(script.runInContext(context, {timeout: 10000})));
    for (const [key, expected] of Object.entries(test.expected)) {
      assert.deepEqual(actual[key], expected, 'Exported ' + test.name + ': ' + key);
    }
    exportedCases++;
  }
}
const map = json('backend/contracts/schema-control-map.json');
assert.equal(map.tables.length, 49);
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let fields = 0;
for (const table of map.tables) {
  const xs = read('backend/xano/table/' + table.name + '.xs');
  assert.match(xs, /guid\s*=/, 'Missing export GUID: ' + table.name);
  for (const column of table.columns) {
    assert.match(xs, new RegExp('\\b' + escape(column.type) + '\\??\\s+' + escape(column.name) + '(?:\\?|\\s|\\{)'), table.name + '.' + column.name);
    fields++;
  }
}
assert.equal(fields, 476);
for (const route of ['accounts/me_GET', 'orders_GET']) {
  assert.match(read('backend/xano/api/logistics/api/v_1/' + route + '.xs'), /auth\s*=\s*"user"/, route + ' must require auth');
}
const evidence = json('backend/evidence/xano-unit-results-final.json');
assert.equal(evidence.failed, 0);
assert.equal(evidence.passed, 41);
assert.equal(evidence.results.filter(r => r.status === 'pass').length, 41);
console.log('PASS: ' + cases.length + ' shared cases; ' + exportedCases + ' exported cases; ' + map.tables.length + ' tables; ' + fields + ' fields.');
console.log('Scope: offline snapshot checks only; no Xano deployment, HTTP, isolation, or transaction proof.');

const crypto = require('node:crypto');
const exportManifest = json('backend/evidence/tested-export.json');
for (const entry of exportManifest.files) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'backend/xano',entry.path))).digest('hex');
  assert.equal(actual, entry.sha256, 'Export drift: '+entry.path);
}
const payment = json('backend/evidence/payment-unit-results.json');
assert.equal(payment.passed,16); assert.equal(payment.failed,0);
assert.equal(payment.results.length,16);
assert.ok(payment.results.every(r=>r.status==='pass'));
console.log('PASS: tested export hashes and 16 recorded Xano payment results.');

require('./validate-coordinate-regressions.cjs');
