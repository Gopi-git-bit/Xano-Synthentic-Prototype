'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const doc=fs.readFileSync(path.join(root,'docs/EVIDENCE.md'),'utf8');
const tracker=fs.readFileSync(path.join(root,'docs/EXECUTION_TRACKER.md'),'utf8');
const match=doc.match(/<!-- EVIDENCE_CHAIN_START -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- EVIDENCE_CHAIN_END -->/);
assert.ok(match,'EVIDENCE.md must contain one JSON evidence chain');
const chain=JSON.parse(match[1]);

function verify(ledger){
 assert.equal(ledger.schema_version,1);
 assert.equal(ledger.repository,'Gopi-git-bit/Xano-Synthentic-Prototype');
 assert.ok(Array.isArray(ledger.records)&&ledger.records.length>=9);
 const seen=new Map();
 const allowed=new Set(['VERIFIED_GITHUB_SOURCE','VERIFIED_PRIVATE_BUNDLE','PASSED_CI','VERIFIED_READ_ONLY','VERIFIED_ISOLATION','VERIFIED_HOSTED','VERIFIED_CONTROLS','VERIFIED_PRODUCTION','FAILED','BLOCKED','NOT_RUN','REPORTED']);
 for(const s of ledger.records){
  assert.match(s.id,/^[A-Z0-9-]+$/);
  assert.ok(!seen.has(s.id),'duplicate stage '+s.id);
  assert.ok(allowed.has(s.verification),'unrecognized verification '+s.id);
  assert.match(s.as_of,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(s.gate && s.source_ref && s.evidence_scope && s.blocker && s.next_action);
  assert.ok(Array.isArray(s.evidence_refs)&&s.evidence_refs.length);
  assert.ok(Array.isArray(s.runtime_evidence_refs));
  assert.ok(Array.isArray(s.related));
  if(s.previous!==null)assert.ok(seen.has(s.previous),'missing or forward predecessor '+s.id);
  if(s.approval==='APPROVED')assert.ok(s.approval_ref,'missing owner approval reference '+s.id);
  if(['VERIFIED_READ_ONLY','VERIFIED_ISOLATION','VERIFIED_HOSTED','VERIFIED_CONTROLS','VERIFIED_PRODUCTION'].includes(s.verification)){
   assert.ok(s.runtime_evidence_refs.length,'runtime proof missing '+s.id);
   assert.match(s.source_ref,/^[a-f0-9]{40}$/,'unpinned runtime source '+s.id);
  }
  seen.set(s.id,s);
 }
 for(const s of ledger.records)for(const rel of s.related)assert.ok(seen.has(rel),'unknown related stage '+rel);
 const p0=seen.get('W3-P0'),p=seen.get('W3-P'),ab=seen.get('W3-AB'),c=seen.get('W3-C'),release=seen.get('W3-RELEASE');
 assert.ok(p0&&p&&ab&&c&&release);
 assert.equal(p.previous,p0.id);
 assert.equal(ab.previous,p.id);
 assert.equal(c.previous,ab.id);
 assert.equal(release.previous,c.id);
 if(p.verification==='VERIFIED_ISOLATION'||p.gate==='APPROVED'){
  assert.equal(p0.verification,'VERIFIED_READ_ONLY');
  assert.equal(p.approval,'APPROVED');
  assert.ok(p.approval_ref&&p.runtime_evidence_refs.length);
 }
 if(ab.verification==='VERIFIED_HOSTED'||ab.gate==='APPROVED'){
  assert.equal(p.verification,'VERIFIED_ISOLATION');
  assert.equal(ab.approval,'APPROVED');
  assert.ok(ab.approval_ref&&ab.runtime_evidence_refs.length);
 }
 if(c.verification==='VERIFIED_CONTROLS'||c.gate==='APPROVED'){
  assert.equal(ab.verification,'VERIFIED_HOSTED');
  assert.equal(c.approval,'APPROVED');
 }
 if(release.verification==='VERIFIED_PRODUCTION'||release.gate==='APPROVED'){
  assert.equal(c.verification,'VERIFIED_CONTROLS');
  assert.equal(release.approval,'APPROVED');
 }
 return seen;
}

test('stage chain, source receipts and tracker link are present',()=>{
 const s=verify(chain);
 assert.equal(s.get('W3-PRIVATE').source_ref,'61d1b139d27646187f7d4a52bcc6546e11b70a4c');
 assert.equal(s.get('W3-REVIEW').source_ref,'d7cda3d0cac0a53699ffd2e60d02eece1fe16abf');
 assert.match(tracker,/\[EVIDENCE\.md\]\(EVIDENCE\.md\)/);
});
test('refuse approved isolated environment without predecessor proof',()=>{
 const copy=structuredClone(chain);
 const stage=copy.records.find(x=>x.id==='W3-P');
 stage.gate='APPROVED';
 assert.throws(()=>verify(copy),/missing owner approval reference|runtime proof|AssertionError|ERR_ASSERTION/);
});
test('reject missing predecessor',()=>{
 const copy=structuredClone(chain);
 copy.records.find(x=>x.id==='W3-P0').previous='UNKNOWN';
 assert.throws(()=>verify(copy),/missing or forward predecessor/);
});
