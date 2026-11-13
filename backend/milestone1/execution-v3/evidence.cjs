'use strict';
const assert=require('node:assert/strict');
const A=require('../reservation-v2/assertions.cjs'),F=require('./fixtures.json');
function snapshot(s){
 A.snapshot(s);
 assert.deepEqual(Object.keys(s.fixture_counts||{}).sort(),[...F.fixture_tables].sort());
 assert.deepEqual(Object.keys(s.fixture_hashes||{}).sort(),[...F.fixture_tables].sort());
 assert.deepEqual(Object.keys(s.row_digests||{}).sort(),[...A.TABLES,...F.fixture_tables].sort());
 for(const t of [...A.TABLES,...F.fixture_tables]){
  const count=A.TABLES.includes(t)?s.counts[t]:s.fixture_counts[t];
  assert.ok(Number.isSafeInteger(count)&&count>=0);
  assert.equal(s.row_digests[t].length,count);
  assert.equal(new Set(s.row_digests[t].map(r=>r.id)).size,count);
  for(const r of s.row_digests[t]){assert.ok(Number.isSafeInteger(r.id)&&r.id>0);assert.match(r.sha256,/^[0-9a-f]{64}$/);}
 }
 for(const t of F.fixture_tables)assert.match(s.fixture_hashes[t],/^[0-9a-f]{64}$/);
 return s;
}
function preserve(before,after,except={}){
 snapshot(before);snapshot(after);
 for(const t of Object.keys(before.row_digests)){
  const now=new Map(after.row_digests[t].map(r=>[r.id,r.sha256]));
  for(const r of before.row_digests[t]){assert.ok(now.has(r.id),'Deletion: '+t);if(!(except[t]||[]).includes(r.id))assert.equal(now.get(r.id),r.sha256,'Existing row mutated: '+t+':'+r.id);}
 }
}
function unchanged(before,after){
 preserve(before,after);A.unchangedSnapshot(before,after);
 assert.deepEqual(after.fixture_counts,before.fixture_counts);assert.deepEqual(after.fixture_hashes,before.fixture_hashes);
}
function delta(before,after,expected=A.EXPECTED){
 preserve(before,after);assert.deepEqual(after.fixture_hashes,before.fixture_hashes);
 for(const t of A.TABLES)assert.equal(after.counts[t]-before.counts[t],expected[t],'Unexpected full-table delta: '+t);
}
function seeded(before,after,plan){
 preserve(before,after);A.unchangedSnapshot(before,after);
 for(const t of F.fixture_tables)assert.equal(after.fixture_counts[t]-before.fixture_counts[t],t==='user'?1:plan.rows.filter(r=>r.table===t).length,'Fixture delta: '+t);
}
function fixtureReadback(plan,actual){
 assert.equal(actual.actor.email,plan.email);assert.equal(actual.actor.name,plan.email);assert.equal(actual.actor.role,plan.starter_role);
 assert.ok(Number.isInteger(actual.actor.id)&&actual.actor.id>0);
 assert.equal(actual.observed.length,plan.rows.length);
 plan.rows.forEach((r,i)=>{
  const o=actual.observed[i];assert.equal(o.table,r.table);assert.equal(o.rows.length,1);
  for(const [k,v] of Object.entries(r.data)){
   const expected=v==='__ACTOR__'?'xano:'+actual.actor.id:v,seen=o.rows[0][k];
   // Xano decimal columns may serialize a numeric value as a decimal string.
   if(k==='capacity_kg')assert.equal(Number(seen),expected);else assert.equal(seen,expected,'Fixture readback '+r.table+'.'+k);
  }
 });
}
function enriched(receipt,inspection){
 const row={...inspection,...receipt.value,started_ms:receipt.started_ms,finished_ms:receipt.finished_ms};
 if(['CREATED','REPLAY'].includes(receipt.value.code)){
  for(const k of A.IDS)assert.equal(receipt.value[k],inspection[k],'Command/readback ID mismatch: '+k);
  A.complete(row);
 }
 return row;
}
function emptyInspection(i){assert.deepEqual(A.counts(i.table_counts),Object.fromEntries(A.TABLES.map(t=>[t,0])));}
function message(receipt){return JSON.stringify(receipt.value.native_error||{});}
function nativeFailure(receipt,pattern){
 assert.equal(receipt.value.code,'NATIVE_FAILURE');assert.equal(receipt.source_hash_verified,true);
 assert.match(message(receipt),pattern,'Expected native failure provenance missing');
}
module.exports={snapshot,preserve,unchanged,delta,seeded,fixtureReadback,enriched,emptyInspection,message,nativeFailure};
