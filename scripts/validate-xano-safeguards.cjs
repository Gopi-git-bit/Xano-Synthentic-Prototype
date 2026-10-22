'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'); const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''); const json=p=>JSON.parse(read(p));
const map=json('backend/contracts/postgres-case-map.json');assert.equal(map.target_database,'Xano managed database, isolated synthetic sandbox');assert.equal(map.external_postgres_required,false);assert.equal(map.cases.length,72);assert.equal(new Set(map.cases.map(c=>c.case_id)).size,72);
for(const [group,count] of Object.entries({core:2,dispatch:31,finance:23,payment_privileges:4,governance:12}))assert.equal(map.cases.filter(c=>c.group===group).length,count);
for(const c of map.cases){assert.match(c.source_blob_sha,/^[a-f0-9]{40}$/);assert.ok(c.source_test_selector&&c.required_assertions.length&&c.required_xano_operations.length);assert.equal(c.status,'NOT_VERIFIED');assert.equal(c.xano_executable_test,null);}
const signup=read('backend/xano/api/authentication/auth/signup_POST.xs');const stack=signup.indexOf('stack {');const deny=signup.indexOf('precondition (false)',stack);const firstDb=signup.indexOf('db.get',stack);assert.ok(deny>stack&&deny<firstDb);assert.ok(signup.includes('SYNTHETIC_PROVISIONING_REQUIRED'));
for(const f of fs.readdirSync(path.join(root,'backend/xano/ai/mcp_server')))assert.match(read('backend/xano/ai/mcp_server/'+f),/tools\s*=\s*\[\]/);
const old=json('backend/evidence/payment-tested-export.json'),current=json('backend/evidence/tested-export.json');for(const f of old.files.filter(f=>f.path.startsWith('function/logistics/'))){assert.equal(current.files.find(c=>c.path===f.path).sha256,f.sha256,'Payment-era predicate source changed: '+f.path);}
assert.equal(json('backend/evidence/live-preservation.json').live_unchanged_during_task,true);assert.equal(json('backend/evidence/concurrency-result.json').status,'PASS');assert.equal(json('backend/evidence/rollback-result.json').status,'PASS');
console.log('PASS: offline safeguard checks and complete 72-case reference inventory. Native 72-case acceptance remains NOT_VERIFIED.');
