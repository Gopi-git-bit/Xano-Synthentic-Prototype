'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const N=require('../backend/milestone1/execution-v3/native-adapter.cjs'),E=require('../backend/milestone1/execution-v3/evidence.cjs'),C=require('../backend/milestone1/execution-v3/contention.cjs'),F=require('../backend/milestone1/execution-v3/fixtures.json'),A=require('../backend/milestone1/reservation-v2/assertions.cjs');
const {execute,settle}=require('../backend/milestone1/execution-v3/executor.cjs'),{model}=require('./test-support/m1-execution-model.cjs');
const root=path.resolve(__dirname,'..');
let modelReport;
test('complete offline model traverses all 31 cases with duplicate-profile qualification',async()=>{
 const r=await execute(model());modelReport=r;
 assert.equal(r.blocker,undefined);assert.equal(r.cases.length,31);assert.equal(r.hosted_passes,0);assert.equal(r.case_passes,30);assert.equal(r.complete,false);
 assert.equal(r.execution_scope,'offline_simulation');assert.equal(r.cases.find(c=>c.id==='identity-duplicate_customer_profile').status,'BLOCKED_FIXTURE');
 assert.ok(r.cases.every(c=>c.status==='PASS'||c.status==='BLOCKED_FIXTURE'));
 assert.equal(r.contention.passed,true);
});
test('committed activation prevents even a preflight network call',async()=>{
 const old=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw Error('Unexpected network');};
 try{assert.equal((await N.createNativeAdapter({token:'test-token-not-a-credential'}).preflight()).ready,false);assert.equal(calls,0);}
 finally{global.fetch=old;}
});
test('no direct invoke or forged contention capability bypasses preflight',async()=>{
 const a=N.createNativeAdapter({token:'test-token-not-a-credential'});
 await assert.rejects(a.invoke('seed',{case_id:'positive-a'}),/preflight/i);
 assert.throws(()=>a.acceptContention({cohorts:[]}),/preflight/i);
});
test('blocked gate returns zero completed cases and never calls a writer',async()=>{
 let writes=0;const r=await execute({execution_scope:'offline_simulation',preflight:async()=>({ready:false}),invoke:async()=>{writes++;},invalidate(){}});
 assert.equal(writes,0);assert.equal(r.hosted_passes,0);assert.ok(r.cases.every(c=>c.status==='NOT_RUN'));
});
test('all concurrent requests settle before reporting a transport failure',async()=>{
 let slow=false;await assert.rejects(settle([async()=>{throw Error('lost');},async()=>{await new Promise(r=>setTimeout(r,10));slow=true;}]),/lost/);assert.equal(slow,true);
});
test('transport failure stops subsequent cases without a writer retry',async()=>{
 const m=model(),run=m.invoke;let writes=0;
 m.invoke=async(name,input)=>{if(name==='invoke'){writes++;throw Error('ambiguous transport');}return run(name,input);};
 const r=await execute(m);assert.equal(writes,4);assert.equal(r.hosted_passes,0);assert.match(r.blocker,/ambiguous/);assert.ok(r.cases.every(c=>c.status==='NOT_RUN'));
});
test('run fixtures are disjoint except explicit positive-a reuse',()=>{
 const seen=new Set();
 for(const [id,p] of Object.entries(F.cases)){
  if(p.seed!==id)continue;
  for(const a of p.assets)for(const v of [a.vehicle,a.driver]){assert.ok(!seen.has(v));seen.add(v);}
 }
 assert.equal(F.cases['changed-payload'].seed,'positive-a');assert.equal(F.cases['expired-key'].seed,'positive-a');
});
test('duplicate-account fixture crosses platforms and retains one subject',()=>{
 const rows=F.cases['identity-duplicate_account'].rows.filter(r=>r.table==='accounts'&&r.data.external_subject==='__ACTOR__');
 assert.equal(rows.length,2);assert.equal(new Set(rows.map(r=>r.data.platform_id)).size,2);
});
test('duplicate-profile conflict is the deliberate fixture violation',()=>{
 const rows=F.cases['identity-duplicate_customer_profile'].rows.filter(r=>r.table==='customer_profiles');
 assert.equal(rows.length,2);assert.equal(rows[0].data.account_id,rows[1].data.account_id);assert.notEqual(rows[0].data.customer_profile_id,rows[1].data.customer_profile_id);
});
test('foreign-owner fixture does not collide with vendor account uniqueness',()=>{
 const rows=F.cases['identity-foreign_owner'].rows.filter(r=>r.table==='vendor_profiles');
 assert.equal(rows.length,2);assert.equal(new Set(rows.map(r=>r.data.account_id)).size,2);
});
test('all fixture writes use the ten approved additive fixture tables',()=>{
 for(const p of Object.values(F.cases))for(const r of p.rows){assert.ok(F.fixture_tables.includes(r.table));assert.equal(Object.hasOwn(r.data,'id'),false);assert.ok(!A.TABLES.includes(r.table));}
});
for(const input of [{case_id:'unknown'},{case_id:'positive-a',rows:[]},{case_id:'changed-payload'}])
 test('seed rejects out-of-contract input '+JSON.stringify(input),()=>assert.throws(()=>N.validateInput('seed',input)));
test('invoke rejects unbounded indexes, overrides and non-fault recovery',()=>{
 for(const i of [{case_id:'positive-a',index:4,recover:false},{case_id:'positive-a',index:0,recover:true},{case_id:'positive-a',index:0,recover:false,vehicle_id:'arbitrary'}])assert.throws(()=>N.validateInput('invoke',i));
});
test('ordinary indexes, invalid indexes and nullable unique keys cannot satisfy gate',()=>{
 const metadata=[{name:'active_assignment_reservations',id:100},{name:'idempotency_records',id:25}];
 const defs=[['mvpw1_100',['reservation_id']],['mvpw1_100',['platform_id','resource_kind','resource_id']],['mvpw1_100',['platform_id','trip_assignment_id','resource_kind']],['mvpw1_25',['platform_id','operation_scope','idempotency_key']]];
 const good={indexes:defs.map(([tablename,columns],i)=>({tablename,columns,indexname:'unique_'+i,indisunique:true,indisvalid:true,indisready:true,predicate:null,not_null:columns.map(()=>true)}))};
 assert.equal(N.indexes(good,metadata).length,4);
 for(const [k,v] of [['indisunique',false],['indisvalid',false],['indisready',false],['predicate','released_at IS NULL'],['not_null',[false]]]){const bad=structuredClone(good);bad.indexes[1][k]=v;assert.throws(()=>N.indexes(bad,metadata));}
});
test('prepared native contention path removes advisory serialization and retains both claims',()=>{
 const s=fs.readFileSync(path.join(root,'backend/milestone1/execution-v3/xano/function/m1_execution/contention_command.xs'),'utf8');
 assert.doesNotMatch(s,/pg_advisory|as \$locked/);assert.equal((s.match(/db.add active_assignment_reservations/g)||[]).length,2);
 assert.match(s,/db.transaction/);assert.match(s,/M1_RESERVATION_CLAIM_ENTRY/);assert.match(s,/M1_RESERVATION_CLAIMS_ACQUIRED/);
 assert.ok(s.indexOf('db.add active_assignment_reservations')<s.indexOf('db.add idempotency_records'));
});
test('all 16 original/revised write deltas are checked in full snapshots',async()=>{
 const m=model(),s=(await m.invoke('snapshot')).value;
 for(const t of A.TABLES){
  const changed=structuredClone(s);changed.content_hashes[t]='f'.repeat(64);assert.throws(()=>E.unchanged(s,changed));
 }
});
test('same-count mutation and deletion of retained rows are rejected',async()=>{
 const m=model();m.db.orders.push({id:1,value:'retained'});const before=(await m.invoke('snapshot')).value;
 m.db.orders[0].value='mutated';
 const after=(await m.invoke('snapshot')).value;assert.throws(()=>E.preserve(before,after),/mutated/);
 m.db.orders=[];const deleted=(await m.invoke('snapshot')).value;assert.throws(()=>E.preserve(before,deleted),/Deletion/);
});
test('offline proof evaluator rejects absent native timing, same session and ordinary busy errors',async()=>{
 const r=modelReport||await execute(model()),good={...r.contention.evidence,execution_scope:'xano_native'};
 C.evaluate(good);
 for(const mutate of [
  e=>e.cohorts[0].outcomes[1].logs=[],
  e=>e.cohorts[0].outcomes[1].logs[0].pid=e.cohorts[0].outcomes[0].logs[0].pid,
  e=>e.cohorts[0].outcomes[1].value={code:'RESOURCE_BUSY',http_status:409},
  e=>e.cohorts[0].outcomes[1].logs[0].ms=18000,
  e=>e.reservation_index_name='wrong_index',
  e=>e.cohorts[0].observations=[],
  e=>e.cohorts[0].observations[0].value.waits=[]
 ]){const bad=structuredClone(good);mutate(bad);assert.throws(()=>C.evaluate(bad));}
});
test('same-driver loser half-reservation residue fails full-table proof',async()=>{
 const r=modelReport||await execute(model()),bad=structuredClone({...r.contention.evidence,execution_scope:'xano_native'});
 const s=bad.cohorts[1].after.value;s.counts.active_assignment_reservations++;s.row_digests.active_assignment_reservations.push({id:999999,sha256:'f'.repeat(64)});
 assert.throws(()=>C.evaluate(bad));
});
test('expiry only occurs after positive-a and precedes the expired-command snapshot',async()=>{
 const r=modelReport||await execute(model());const event=r.events.find(e=>e.stage==='owned-expiry'),c=r.cases.find(c=>c.id==='expired-key');
 assert.ok(event);assert.deepEqual(event.after.value,c.evidence.before.value);assert.equal(c.status,'PASS');
});
test('discarded result is explicitly qualified and all four faults have 16-table rollback evidence',async()=>{
 const r=modelReport||await execute(model());assert.match(r.cases.find(c=>c.id==='discarded-result').evidence.qualification,/no process\/network crash/);
 for(const c of r.cases.filter(c=>/^(database|application)-/.test(c.id))){assert.equal(Object.keys(c.evidence.before.value.counts).length,16);E.unchanged(c.evidence.before.value,c.evidence.after.value);}
});
