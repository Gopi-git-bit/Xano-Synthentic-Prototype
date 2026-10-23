'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const A=require('../backend/milestone1/assertions.cjs');
const {evaluate}=require('./evaluate-milestone1.cjs');
const runner=require('../backend/milestone1/runner.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const candidate=read('backend/milestone1/xano/function/logistics/resolve_identity.xs');
const baseline=read('backend/xano/function/logistics/resolve_identity.xs');
const clone=structuredClone;
const zero=()=>Object.fromEntries(A.TABLES.map(t=>[t,0]));
const good=()=>({code:'CREATED',http_status:202,order_id:'00000001-0000-4000-8000-000000000001',trip_id:'00000002-0000-4000-8000-000000000002',workflow_id:'00000003-0000-4000-8000-000000000003',correlation_id:'00000004-0000-4000-8000-000000000004',request_hash_sha256:'a'.repeat(64),order_status:'assigned',order_version:4,table_counts:clone(A.EXPECTED),linkage_verified:true});

// Explicitly limited expression evaluation of source fragments, not a XanoScript runtime.
// It exercises actual exported/candidate account, membership and profile query predicates.
function expression(text,context) {
  const js=text.replace(/\$([\w.]+)\|count/g,'$1.length').replace(/\$([\w.]+)\|contains:"([^"]+)"/g,'$1.includes("$2")').replace(/\$(\w+)/g,'$1');
  return new vm.Script(js).runInNewContext(context,{timeout:100});
}
function where(source,table,record,context) {
  const query=source.match(new RegExp('db\\.query '+table+' \\{\\s*where = ([^\\n]+)'));
  assert.ok(query,'Missing scoped query '+table);
  return expression(query[1],{...context,db:{[table]:record}});
}
function identity(source,fixture) {
  const ctx={subject:'xano:7',now:1000};
  ctx.accounts=fixture.accounts.filter(r=>where(source,'accounts',r,ctx));
  const guards=[...source.matchAll(/precondition \(([\s\S]*?)\) \{/g)].map(m=>m[1]);
  if(!expression(guards[0],ctx))return false;
  ctx.account=ctx.accounts[0];
  if(!expression(guards[1],ctx))return false;
  ctx.memberships=fixture.memberships.filter(r=>where(source,'account_role_memberships',r,ctx));
  if(!expression(guards[2],ctx))return false;
  ctx.roles=ctx.memberships.map(r=>r.role_code);
  ctx.customer_profiles=fixture.profiles.filter(r=>where(source,'customer_profiles',r,ctx));
  return guards.slice(3).every(g=>expression(g,ctx));
}
const fixture=()=>({accounts:[{external_subject:'xano:7',platform_id:'a',account_id:'actor-a',status:'active'}],memberships:[{platform_id:'a',account_id:'actor-a',role_code:'customer',valid_from:0,valid_until:null},{platform_id:'a',account_id:'actor-a',role_code:'admin',valid_from:0,valid_until:null}],profiles:[{platform_id:'a',account_id:'actor-a',customer_profile_id:'profile-a'}]});
const identityCases=[
 ['valid customer',f=>f,true],
 ['missing account',f=>(f.accounts=[],f),false],
 ['duplicate authenticated subject',f=>(f.accounts.push(clone(f.accounts[0])),f),false],
 ['unrelated subject',f=>(f.accounts[0].external_subject='xano:8',f),false],
 ['blocked account',f=>(f.accounts[0].status='blocked',f),false],
 ['suspended account',f=>(f.accounts[0].status='suspended',f),false],
 ['no memberships',f=>(f.memberships=[],f),false],
 ['expiry at now',f=>(f.memberships.forEach(r=>r.valid_until=1000),f),false],
 ['future memberships',f=>(f.memberships.forEach(r=>r.valid_from=1001),f),false],
 ['cross tenant memberships',f=>(f.memberships.forEach(r=>r.platform_id='b'),f),false],
 ['other account memberships',f=>(f.memberships.forEach(r=>r.account_id='actor-b'),f),false],
 ['missing customer profile',f=>(f.profiles=[],f),false],
 ['ambiguous customer profiles',f=>(f.profiles.push({...f.profiles[0],customer_profile_id:'profile-other'}),f),false],
 ['foreign profile',f=>(f.profiles[0].platform_id='b',f),false],
 ['same tenant other owner profile',f=>(f.profiles[0].account_id='actor-b',f),false],
 ['starter admin is not an operational membership',f=>(f.accounts[0].role='admin',f.memberships=[],f),false],
 ['non-customer membership needs no customer profile',f=>(f.memberships=[{...f.memberships[1],role_code:'vendor'}],f.profiles=[],f),true],
 ['future membership ignored alongside valid memberships',f=>(f.memberships.push({...f.memberships[0],valid_from:1001}),f),true]
];
for(const [name,change,expected] of identityCases)test('source predicate: '+name,()=>assert.equal(identity(candidate,change(fixture())),expected));
test('baseline reproduces missing and ambiguous profile acceptance; candidate rejects both',()=>{
  for(const change of [f=>(f.profiles=[],f),f=>(f.profiles.push(clone(f.profiles[0])),f)]) {
    assert.equal(identity(baseline,change(fixture())),true);
    assert.equal(identity(candidate,change(fixture())),false);
  }
});

test('complete evidence includes all 15 persisted tables and stable IDs',()=>A.complete(good()));
for(const table of A.TABLES) {
  test('missing success record rejected: '+table,()=>{const r=good();r.table_counts[table]--;assert.throws(()=>A.complete(r));});
  test('rollback residue rejected: '+table,()=>{const before=zero(),after=zero();after[table]++;assert.throws(()=>A.unchanged(before,after));});
}
test('complete flag cannot replace full table inventory',()=>assert.throws(()=>A.complete({complete:true})));
test('missing count key rejected rather than treated as zero',()=>{const r=zero();delete r.quotes;assert.throws(()=>A.unchanged(zero(),r));});
test('conflict must be 409 and preserve every table',()=>A.rejected({code:'IDEMPOTENCY_CONFLICT',http_status:409},clone(A.EXPECTED),clone(A.EXPECTED),'IDEMPOTENCY_CONFLICT'));
test('conflict with 202 rejected',()=>assert.throws(()=>A.rejected({code:'IDEMPOTENCY_CONFLICT',http_status:202},zero(),zero(),'IDEMPOTENCY_CONFLICT')));
test('stable replay accepted',()=>A.replay(good(),{...good(),code:'REPLAY'}));
for(const field of A.IDS)test('changed replay '+field+' rejected',()=>{const r={...good(),code:'REPLAY',[field]:'99999999-0000-4000-8000-000000000099'};assert.throws(()=>A.replay(good(),r));});

function race(kind) {
  const n=kind==='same_driver'?2:4;
  const requests=Array.from({length:n},(_,i)=>({platform_id:'a',vehicle_id:kind==='same_driver'?'vehicle-'+i:'vehicle-0',driver_profile_id:'driver-0',key:kind==='same_key'?'same':'key-'+i,request_hash:'a'.repeat(64)}));
  const outcomes=Array.from({length:n},(_,i)=>({...good(),code:i===0?'CREATED':kind==='same_key'?'REPLAY':'RESOURCE_BUSY',http_status:i===0||kind==='same_key'?202:409,db_pid:100+i,started_ms:10+i,finished_ms:3000+i*2000,lock_started_ms:20+i,lock_acquired_ms:25+i*2000,lock_wait_ms:i*2000}));
  const inspections=outcomes.map(o=>o.code==='RESOURCE_BUSY'?{table_counts:zero()}:{...good(),code:'INSPECT'});
  return {kind,requests,outcomes,inspections,active_vehicle_assignments:1,active_driver_assignments:1};
}
for(const kind of ['same_key','same_vehicle','same_driver'])test('overlapping '+kind+' evidence accepted',()=>A.race(race(kind)));
test('driver-only race cannot reuse the same vehicle',()=>{const r=race('same_driver');r.requests[1].vehicle_id=r.requests[0].vehicle_id;assert.throws(()=>A.race(r));});
test('driver-only race cannot use different drivers',()=>{const r=race('same_driver');r.requests[1].driver_profile_id='other';assert.throws(()=>A.race(r));});
test('two active driver assignments rejected',()=>{const r=race('same_driver');r.active_driver_assignments=2;assert.throws(()=>A.race(r));});
test('sequential requests cannot pass as contention',()=>{const r=race('same_driver');r.outcomes[1].started_ms=9000;r.outcomes[1].finished_ms=10000;assert.throws(()=>A.race(r));});
test('single database session rejected',()=>{const r=race('same_vehicle');r.outcomes.forEach(o=>o.db_pid=100);assert.throws(()=>A.race(r));});
test('losing request cannot leave a quote',()=>{const r=race('same_vehicle');r.inspections[1].table_counts.quotes=1;assert.throws(()=>A.race(r));});
test('same-key race must return stable inspected workflow IDs',()=>{const r=race('same_key');r.inspections[1].workflow_id='99999999-0000-4000-8000-000000000099';assert.throws(()=>A.race(r));});

function fault(kind,stage) {return {kind,stage,error:{code:'ERROR_FATAL',message:kind==='database'?'division by zero':'M1_APPLICATION_'+stage.toUpperCase(),requested_fault:kind==='database'?stage:'application_'+stage,source_hash_verified:true},before:zero(),after:zero(),retry:good(),repeated:{...good(),code:'REPLAY'}};}
for(const kind of ['database','application'])for(const stage of ['after_order','after_assignment'])test('fault evidence '+kind+' '+stage,()=>A.fault(fault(kind,stage)));
test('early access denial cannot count as application rollback',()=>{const r=fault('application','after_assignment');r.error.message='Actor is not authorized';assert.throws(()=>A.fault(r));});
test('wrong application fault location rejected',()=>{const r=fault('application','after_assignment');r.error.message='M1_APPLICATION_AFTER_ORDER';assert.throws(()=>A.fault(r));});
test('unverified native source cannot claim rollback proof',()=>{const r=fault('database','after_order');r.error.source_hash_verified=false;assert.throws(()=>A.fault(r));});
test('offline fixtures are never promoted to hosted evidence',()=>assert.equal(evaluate({cases:[{id:'x',status:'PASS',execution_scope:'offline',assertion:'complete',arguments:good()}]}).results[0].status,'REJECTED_EVIDENCE'));
test('unexecuted case remains NOT_RUN',()=>assert.deepEqual(evaluate({cases:[{id:'x',status:'NOT_RUN'}]}).results,[{id:'x',status:'NOT_RUN'}]));

test('candidate snapshots and rollback workflows enumerate every write table',()=>{
  const m=JSON.parse(read('backend/milestone1/manifest.json'));
  const snapshot=read('backend/milestone1/xano/function/milestone1/snapshot.xs');
  assert.deepEqual([...snapshot.matchAll(/db.query (\w+) \{/g)].map(m=>m[1]).sort(),A.TABLES);
  for(const f of m.candidates.filter(f=>f.path.includes('/workflow_test/'))) {
    const s=read(f.path);for(const t of A.TABLES)assert.ok(s.includes('$after_retry.counts.'+t+' - $before.counts.'+t));
    assert.ok(s.includes('value = $before'));assert.ok(s.includes('value = $after_retry'));
    assert.ok(s.includes('Fixture occupied: retain existing assignments and stop'));
  }
});
test('strict candidate fixes the old helper omission without changing baseline export',()=>{
  const old=read('backend/xano/function/slice_1/acceptance.xs'),s=read('backend/milestone1/xano/function/slice_1/acceptance.xs');
  const guard=x=>x.match(/var \$complete \{\s*value = ([^\n]+)/)[1];
  for(const name of ['quotes','requirements','commitments','offers']) {assert.ok(!guard(old).includes('$counts.'+name));assert.ok(guard(s).includes('$counts.'+name+' == 1'));}
  assert.ok(s.includes('driver_profile_id   : $driver_asset.driver'));
  assert.ok(s.includes('http_status         : $outcome|get:"http_status":$idem.response_code'));
});

for(const [name,roles,platform,expected] of [
  ['dual-role trusted identity',['customer','admin'],'a',true],
  ['customer alone cannot coordinate',['customer'],'a',false],
  ['admin alone cannot coordinate',['admin'],'a',false],
  ['vendor alone cannot coordinate',['vendor'],'a',false],
  ['driver alone cannot coordinate',['driver'],'a',false],
  ['body tenant claim cannot override trusted identity',['customer','admin'],'b',false]
])test('source command guard: '+name,()=>{
  const s=read('backend/milestone1/xano/function/slice_1/create_and_assign.xs');
  const guards=[...s.matchAll(/precondition \(([\s\S]*?)\) \{/g)].map(m=>m[1]);
  const relevant=guards.filter(g=>g.includes('$identity.platform_id == $input.expected_platform_id')||g.includes('$is_customer && $is_admin'));
  assert.equal(relevant.length,2);
  const context={identity:{platform_id:'a',customer:{}},input:{expected_platform_id:platform},is_customer:roles.includes('customer'),is_admin:roles.includes('admin')};
  assert.equal(relevant.every(g=>expression(g,context)),expected);
});

function adapter(options={}) {
  const m=JSON.parse(read('backend/milestone1/manifest.json'));
  let executions=0,active=0,max_active=0,winnerKey;
  const fake={execution_scope:'offline_adapter_test',calls:[],metrics:()=>({executions,max_active}),
    preflight:async()=>({authenticated:true,workspace_id:1,workspace_name:'Zippy Synthetic Prototype',branch:'v1',database:'sn9m-aat6-200c',isolation_verified:true,physical_table_mapping_verified:true,physical_table_count:51,restricted_access_verified:true,physical_indexes_verified:true,live_source_hash_before:'a'.repeat(64),source_hashes:Object.fromEntries(m.candidates.map(c=>[c.target_path,c.candidate_sha256])),...options.preflight}),
    preservation:async()=>({live_source_hash_after:'a'.repeat(64)}),
    invoke:async(name,input)=>{
      fake.calls.push({name,input});let value;
      if(name==='Milestone1/snapshot')value={database:'sn9m-aat6-200c',counts:executions?clone(A.EXPECTED):zero()};
      else if(input.action==='inspect') value={...good(),code:'INSPECT',table_counts:executions&&input.key===winnerKey?clone(A.EXPECTED):zero(),asset_assignments:executions&&input.asset===2?1:0,driver_assignments:executions?1:0,selected_vehicle_id:'vehicle-'+input.asset,selected_driver_id:'driver-2',platform_id:plan.fixture.platform_id,...(options.occupied?{driver_assignments:1}:{}),...(options.selectionMismatch?{selected_driver_id:'another-driver'}:{})};
      else {
        const i=executions++;active++;max_active=Math.max(max_active,active);
        if(i===0)winnerKey=input.key;
        await new Promise(resolve=>setTimeout(resolve,10));active--;
        value={...good(),code:i===0?'CREATED':options.kind==='same_key'?'REPLAY':'RESOURCE_BUSY',http_status:i===0||options.kind==='same_key'?202:409,db_pid:100+i,lock_started_ms:20+i,lock_acquired_ms:25+i*2000,lock_wait_ms:i*2000};
      }
      return {result:{status:'ok',result:value}};
    }
  };return fake;
}
const plan={kind:'same_driver',assets:[{index:2,vehicle_id:'vehicle-2',driver_profile_id:'driver-2'},{index:3,vehicle_id:'vehicle-3',driver_profile_id:'driver-3'}],fixture:{platform_id:'87c1d523-8ba6-4e16-849e-0ca819e572ad'},run_id:'offline-fixture'};
test('runner starts driver-only commands concurrently and retains loser inspection',async()=>{
  const a=adapter();const r=await runner.runRace(a,plan);assert.equal(r.status,'PASS_OFFLINE_ORCHESTRATION');
  assert.equal(a.metrics().max_active,2);assert.equal(a.metrics().executions,2);
  const commands=a.calls.filter(c=>c.input.action==='execute');assert.notEqual(commands[0].input.asset,commands[1].input.asset);assert.equal(commands[0].input.driver_asset,commands[1].input.driver_asset);
});
for(const [name,preflight] of [
  ['53 physical tables',{physical_table_count:53}],
  ['unrestricted credential',{restricted_access_verified:false}],
  ['unverified physical indexes',{physical_indexes_verified:false}],
  ['unverified table mapping',{physical_table_mapping_verified:false}],
  ['unverified isolation',{isolation_verified:false}],
  ['wrong database',{database:'live'}],
  ['missing source hashes',{source_hashes:{}}],
  ['unauthenticated access',{authenticated:false}]
])test('runner refuses writes before '+name,async()=>{
  const a=adapter({preflight});await assert.rejects(()=>runner.runRace(a,plan));assert.equal(a.calls.length,0);
});
test('occupied driver stops runner before any command',async()=>{
  const a=adapter({occupied:true});await assert.rejects(()=>runner.runRace(a,plan));assert.equal(a.metrics().executions,0);
});
test('nested function/run errors cannot be parsed as empty success',()=>assert.throws(()=>runner.unwrap({result:{status:'error',result:{}}})));
for(const kind of ['same_key','same_vehicle'])test('runner caps '+kind+' cohort at four concurrent commands',async()=>{
  const a=adapter({kind});const r=await runner.runRace(a,{...plan,kind,assets:[plan.assets[0]]});
  assert.equal(r.status,'PASS_OFFLINE_ORCHESTRATION');assert.equal(a.metrics().max_active,4);
});
test('caller labels cannot fake independent driver selection',async()=>{
  const a=adapter({selectionMismatch:true});await assert.rejects(()=>runner.runRace(a,plan));assert.equal(a.metrics().executions,0);
});
test('candidate hashes and preserved replacement GUIDs match manifest',()=>{
  const crypto=require('node:crypto');const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
  const m=JSON.parse(read('backend/milestone1/manifest.json'));
  for(const c of m.candidates) {
    assert.equal(hash(c.path),c.candidate_sha256,c.path);
    if(c.baseline_path) {assert.equal(hash(c.baseline_path),c.baseline_sha256);assert.equal(read(c.path).match(/guid\s*=\s*"([^"]+)"/)[1],read(c.baseline_path).match(/guid\s*=\s*"([^"]+)"/)[1]);}
  }
});
test('command policy and business logic are identical after removing explicit fault additions',()=>{
  const before=read('backend/xano/function/slice_1/create_and_assign.xs');
  let after=read('backend/milestone1/xano/function/slice_1/create_and_assign.xs');
  after=after.replace(', "application_after_order", "application_after_assignment"','');
  after=after.replace(/                conditional \{\s+if \(\$input\.fault == "application_after_(?:order|assignment)"\) \{\s+throw \{\s+name = "inputerror"\s+value = "M1_APPLICATION_AFTER_(?:ORDER|ASSIGNMENT)"\s+\}\s+\}\s+\}\s*/g,'');
  const normalize=s=>s.split('\n').map(l=>l.trimEnd()).join('\n').replace(/\s+/g,' ').trim();
  assert.equal(normalize(after),normalize(before));
});
test('an omitted rejection code cannot pass an empty response',()=>assert.throws(()=>A.rejected({},zero(),zero())));
test('race requires a concrete shared driver identity',()=>{const r=race('same_driver');r.requests.forEach(q=>delete q.driver_profile_id);assert.throws(()=>A.race(r));});
test('same-key race requires recorded hashes',()=>{const r=race('same_key');r.requests.forEach(q=>delete q.request_hash);assert.throws(()=>A.race(r));});
test('fault marker without a native error code is insufficient',()=>{const r=fault('application','after_order');delete r.error.code;assert.throws(()=>A.fault(r));});

test('runner waits for sibling writes after one native request fails',async()=>{
  const a=adapter({kind:'same_driver'}),invoke=a.invoke;let siblings=0;
  a.invoke=async(name,input)=>{
    if(name==='Slice1/acceptance' && input.action==='execute') {
      if(input.asset===2) throw Error('simulated native transport failure');
      await new Promise(resolve=>setTimeout(resolve,25));siblings++;
      return {result:{status:'error'}};
    }
    return invoke(name,input);
  };
  await assert.rejects(()=>runner.runRace(a,plan),/all in-flight requests settled/);
  assert.equal(siblings,1);
});
