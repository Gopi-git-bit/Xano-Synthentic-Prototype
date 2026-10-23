'use strict';
// An adapter must obtain fresh native reads and source hashes. See native-adapter.cjs
// for the fixed-target native implementation. This runner does not import or seed.
const assert=require('node:assert/strict');
const A=require('./assertions.cjs');
const manifest=require('./manifest.json');
function unwrap(response) {
  assert.equal(response?.result?.status,'ok','Native function/run did not succeed');
  assert.ok(response.result.result && typeof response.result.result==='object');
  return response.result.result;
}
async function preflight(adapter) {
  assert.ok(['xano_native','offline_adapter_test'].includes(adapter.execution_scope));
  const p=await adapter.preflight();
  assert.equal(p.authenticated,true);
  assert.equal(p.workspace_id,1); assert.equal(p.workspace_name,'Zippy Synthetic Prototype');
  assert.equal(p.branch,'v1'); assert.equal(p.database,'sn9m-aat6-200c');
  assert.equal(p.isolation_verified,true); assert.equal(p.physical_table_mapping_verified,true);
  assert.equal(p.physical_table_count,51,'Resolve physical inventory; never whitelist 53');
  assert.equal(p.physical_indexes_verified,true); assert.equal(p.restricted_access_verified,true);
  assert.match(p.live_source_hash_before || '',/^[a-f0-9]{64}$/);
  for(const c of manifest.candidates.filter(c=>c.path.includes('/function/'))) assert.equal(p.source_hashes?.[c.target_path],c.candidate_sha256,'Native source drift: '+c.target_path);
  return p;
}
async function runRace(adapter,{kind,assets,fixture,run_id}) {
  const p=await preflight(adapter);
  assert.ok(['same_key','same_vehicle','same_driver'].includes(kind));
  assert.match(run_id,/^[a-zA-Z0-9_-]{1,40}$/);
  assert.equal(fixture.platform_id,'87c1d523-8ba6-4e16-849e-0ca819e572ad');
  const needed=kind==='same_driver'?2:1;
  assert.equal(assets.length,needed);
  assert.equal(new Set(assets.map(a=>a.vehicle_id)).size,needed);
  for(const a of assets) assert.ok(Number.isInteger(a.index)&&a.index>=0&&a.index<=11);
  const n=kind==='same_driver'?2:4;
  const requests=Array.from({length:n},(_,i)=>{
    const a=assets[kind==='same_driver'?i:0];
    return {site:'a',claimed_site:'a',resource_site:'a',asset:a.index,driver_asset:assets[0].index,key:'m1-'+run_id+'-'+kind+(kind==='same_key'?'':'-'+i),action:'execute',weight:20,body_type:'closed',fault:'none',hold_seconds:2,expect_failure:false,variant:''};
  });
  // Inspect all candidates before the first command; never release occupied assets.
  function selection(state,r) {
    const asset=assets.find(a=>a.index===r.asset);
    assert.equal(state.platform_id,fixture.platform_id);
    assert.equal(state.selected_vehicle_id,asset.vehicle_id,'Native selected vehicle differs from plan');
    assert.equal(state.selected_driver_id,assets[0].driver_profile_id,'Native shared driver differs from plan');
  }
  for(const r of requests) {
    const state=unwrap(await adapter.invoke('Slice1/acceptance',{...r,action:'inspect',hold_seconds:0}));
    selection(state,r);
    assert.equal(state.asset_assignments,0,'Vehicle occupied; preserve it and stop');
    assert.equal(state.driver_assignments,0,'Driver occupied; preserve it and stop');
    A.unchanged(Object.fromEntries(A.TABLES.map(t=>[t,0])),state.table_counts);
  }
  const before=unwrap(await adapter.invoke('Milestone1/snapshot',{}));
  assert.equal(before.database,p.database); A.counts(before.counts);
  let release;const barrier=new Promise(resolve=>release=resolve);
  const pending=requests.map(async r=>{
    await barrier;const started_ms=Date.now();
    const row=unwrap(await adapter.invoke('Slice1/acceptance',r));
    return {...row,started_ms,finished_ms:Date.now()};
  });
  release();
  const settled=await Promise.allSettled(pending);
  if(settled.some(r=>r.status==='rejected')) {
    // A failed sibling must not return control while other writes are still in flight.
    const preservation=await adapter.preservation();
    const error=new Error('Native cohort failed after all in-flight requests settled; inspect state before any retry');
    error.failed_requests=settled.filter(r=>r.status==='rejected').length;
    error.preservation=preservation;
    throw error;
  }
  const outcomes=settled.map(r=>r.value);
  const inspections=[];
  for(const r of requests) {const state=unwrap(await adapter.invoke('Slice1/acceptance',{...r,action:'inspect',hold_seconds:0}));selection(state,r);inspections.push(state);}
  const after=unwrap(await adapter.invoke('Milestone1/snapshot',{}));
  assert.equal(after.database,p.database); A.counts(after.counts);
  for(const t of A.TABLES) assert.equal(after.counts[t]-before.counts[t],A.EXPECTED[t],'Cohort residue: '+t);
  const proof={kind,requests:requests.map((r,i)=>({platform_id:fixture.platform_id,vehicle_id:assets[kind==='same_driver'?i:0].vehicle_id,driver_profile_id:assets[0].driver_profile_id,key:r.key,request_hash:outcomes[i].request_hash_sha256})),outcomes,inspections,active_vehicle_assignments:Math.max(...inspections.map(s=>s.asset_assignments)),active_driver_assignments:Math.max(...inspections.map(s=>s.driver_assignments))};
  A.race(proof);
  const preservation=await adapter.preservation();
  assert.equal(preservation.live_source_hash_after,p.live_source_hash_before,'Live source changed');
  return {execution_scope:adapter.execution_scope,status:adapter.execution_scope==='xano_native'?'ASSERTIONS_PASS_REVIEW_REQUIRED':'PASS_OFFLINE_ORCHESTRATION',proof,preservation};
}
module.exports={unwrap,preflight,runRace};
