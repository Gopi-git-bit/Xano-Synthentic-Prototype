'use strict';
const assert=require('node:assert/strict'),A=require('../reservation-v2/assertions.cjs'),E=require('./evidence.cjs'),F=require('./fixtures.json');
const CASES=require('../cases.json').cases;
async function settle(calls){
 const outcomes=await Promise.allSettled(calls.map(f=>f()));
 // All in-flight writers are awaited even when one transport fails.
 const failed=outcomes.find(r=>r.status==='rejected');
 if(failed)throw failed.reason;return outcomes.map(r=>r.value);
}
async function execute(adapter,{record=async()=>{}}={}){
 const report={schema_version:1,run_id:F.run_id,execution_scope:adapter.execution_scope,started_at:new Date().toISOString(),hosted_passes:0,case_passes:0,complete:false,contention:null,cases:CASES.map(c=>({id:c.id,status:'NOT_RUN'})),events:[]};
 async function save(event){report.events.push(event);await record(report);}
 const snap=()=>adapter.invoke('snapshot',{});
 const inspect=(id,index=0)=>adapter.invoke('inspect',{case_id:id,index});
 const call=(id,index=0,recover=false)=>adapter.invoke('invoke',{case_id:id,index,recover});
 async function ready(){
  const p=await adapter.preflight();assert.equal(p.ready,true,'PREREQUISITES_NOT_VERIFIED');return p;
 }
 async function seed(id){
  const p=F.cases[id];if(p.seed!==id)return;
  const before=await snap(),r=await adapter.invoke('seed',{case_id:id}),after=await snap();
  if(r.value.code!=='SEEDED'){
   E.unchanged(before.value,after.value);
   if(id==='identity-duplicate_customer_profile'){
    E.nativeFailure(r,/23505|duplicate key value violates unique constraint/i);
    return {blocked:true,reason:'Existing customer-profile uniqueness prevented guard fixture; no schema relaxation',receipt:r,before,after};
   }
   throw Error('FIXTURE_FAILED:'+id+':'+E.message(r));
  }
  E.seeded(before.value,after.value,p);
  const observed=await adapter.invoke('fixture_readback',{case_id:id});
  E.fixtureReadback(p,observed.value);
  await save({stage:'fixture',id,before,after,seed:r,readback:observed});
 }
 async function complete(id,recover=false){
  const r=await call(id,0,recover),i=await inspect(id);return {receipt:r,inspection:i,row:E.enriched(r,i.value)};
 }
 try{
  const preflight=await ready();await save({stage:'preflight',result:preflight});
  const resourceIndex=preflight.indexes.find(i=>i.table==='active_assignment_reservations'&&i.columns.join(',')==='platform_id,resource_kind,resource_id');
  assert.ok(resourceIndex);
  const proof={execution_scope:adapter.execution_scope,bundle_sha256:preflight.bundle_sha256,reservation_index_name:resourceIndex.indexname,cohorts:[]};
  for(const id of ['proof-vehicle','proof-driver']){
   await ready();await seed(id);const before=await snap();
   for(let i=0;i<4;i++)E.emptyInspection((await inspect(id,i)).value);
   let done=false;const observations=[];
   const writing=settle(F.cases[id].requests.map((_,i)=>()=>call(id,i))).finally(()=>{done=true;});
   const observing=(async()=>{for(let sample=0;sample<24 && !done;sample++){
    observations.push(await adapter.invoke('contention_waits',{}));
    if(!done)await new Promise(resolve=>setTimeout(resolve,250));
   }})();
   const settled=await Promise.allSettled([writing,observing]);
   const failed=settled.find(x=>x.status==='rejected');if(failed)throw failed.reason;
   const outcomes=settled[0].value;
   const after=await snap(),inspections=[];
   for(let i=0;i<4;i++)inspections.push(await inspect(id,i));
   proof.cohorts.push({id,before,after,outcomes,inspections,observations});
   await save({stage:'contention-cohort',cohort:proof.cohorts.at(-1)});
  }
  const accepted=adapter.acceptContention(proof);report.contention={...accepted,evidence:proof};await save({stage:'contention-accepted',accepted});
  let positiveA=null;
  for(const entry of report.cases){
   const id=entry.id;entry.status='RUNNING';await record(report);
   try{
    await ready();
    const fixture=await seed(id);
    if(fixture?.blocked){entry.status='BLOCKED_FIXTURE';entry.evidence=fixture;await record(report);continue;}
    if(id==='expired-key'){
     assert.ok(positiveA,'positive-a must succeed before expiry');
     const beforeExpiry=await snap(),expiry=await adapter.invoke('expire_positive_a',{}),afterExpiry=await snap();
     assert.equal(expiry.value.expires_at,1);
     E.preserve(beforeExpiry.value,afterExpiry.value,{idempotency_records:[expiry.value.id]});
     A.unchanged(beforeExpiry.value.counts,afterExpiry.value.counts);
     for(const t of A.TABLES.filter(t=>t!=='idempotency_records'))assert.equal(beforeExpiry.value.content_hashes[t],afterExpiry.value.content_hashes[t]);
     assert.deepEqual(beforeExpiry.value.fixture_hashes,afterExpiry.value.fixture_hashes);
     await save({stage:'owned-expiry',before:beforeExpiry,after:afterExpiry,expiry});
    }
    const before=await snap();entry.evidence={before};
    if(id.startsWith('identity-')){
     E.emptyInspection((await inspect(id)).value);
     const r=await call(id),after=await snap();
     let pattern=/Actor is not authorized/;
     if(id==='identity-foreign_tenant_claim')pattern=/Platform does not match authenticated identity/;
     else if(id==='identity-foreign_resource')pattern=/Resource not available to this platform/;
     else if(['foreign_owner','overweight','wrong_body','unverified_document','expired_document','inactive_vendor','inactive_driver'].some(x=>id==='identity-'+x))pattern=/Provider eligibility failed/;
     E.nativeFailure(r,pattern);E.unchanged(before.value,after.value);
     entry.evidence={before,outcome:r,after};
    }else if(['positive-a','positive-b'].includes(id)){
     E.emptyInspection((await inspect(id)).value);
     const created=await complete(id),after=await snap();assert.equal(created.row.code,'CREATED');E.delta(before.value,after.value);
     const repeated=await complete(id),afterReplay=await snap();A.replay(created.row,repeated.row);E.unchanged(after.value,afterReplay.value);
     entry.evidence={before,created,after,repeated,afterReplay};if(id==='positive-a')positiveA=created;
    }else if(id.endsWith('-race')){
     const plan=F.cases[id],outcomes=await settle(plan.requests.map((_,i)=>()=>call(id,i))),after=await snap(),inspections=[];
     for(let i=0;i<outcomes.length;i++)inspections.push(await inspect(id,i));
     const rows=outcomes.map((r,i)=>E.enriched(r,inspections[i].value));
     const kind=id.replaceAll('-','_').replace('_race',''),winner=rows.find(r=>r.code==='CREATED');
     const requests=plan.requests.map((r,i)=>({platform_id:plan.platform,vehicle_id:r.vehicle_id,driver_profile_id:r.driver_profile_id,key:r.idempotency_key,request_hash:inspections[i].value.request_hash_sha256}));
     A.race({kind,requests,outcomes:rows,inspections:inspections.map(x=>x.value),active_vehicle_assignments:winner?.asset_assignments,active_driver_assignments:winner?.driver_assignments});
     E.delta(before.value,after.value);entry.evidence={before,outcomes,inspections,after};
    }else if(id==='changed-payload'){
     assert.ok(positiveA);const outcome=await call(id),after=await snap();
     assert.equal(outcome.value.code,'IDEMPOTENCY_CONFLICT');assert.equal(outcome.value.http_status,409);E.unchanged(before.value,after.value);entry.evidence={before,outcome,after};
    }else if(id==='expired-key'){
     const outcome=await call(id),after=await snap();E.nativeFailure(outcome,/Original request is unavailable or expired/);E.unchanged(before.value,after.value);entry.evidence={before,outcome,after};
    }else if(/^(database|application)-/.test(id)){
     const [kind,stage]=id.split('-'),outcome=await call(id),after=await snap();
     E.nativeFailure(outcome,kind==='database'?/division by zero/i:new RegExp('M1_APPLICATION_'+stage.toUpperCase()));E.unchanged(before.value,after.value);
     const retry=await complete(id,true),afterRetry=await snap();E.delta(after.value,afterRetry.value);
     const repeated=await complete(id,true),afterReplay=await snap();E.unchanged(afterRetry.value,afterReplay.value);
     A.fault({kind,stage,error:{code:outcome.value.code,message:E.message(outcome),requested_fault:outcome.value.requested_fault,source_hash_verified:outcome.source_hash_verified},before:before.value.counts,after:after.value.counts,before_snapshot:before.value,after_snapshot:after.value,retry:retry.row,repeated:repeated.row});
     entry.evidence={before,outcome,after,retry,afterRetry,repeated,afterReplay};
    }else if(id==='discarded-result'){
     E.emptyInspection((await inspect(id)).value);
     // Drop the successful command result from client processing. This is NOT a network-crash test.
     await call(id);
     const persisted=await inspect(id),after=await snap();A.complete(persisted.value);E.delta(before.value,after.value);
     const repeated=await complete(id),afterReplay=await snap();
     A.replay({...persisted.value,code:'CREATED'},repeated.row);E.unchanged(after.value,afterReplay.value);
     entry.evidence={before,persisted,after,repeated,afterReplay,qualification:'Successful transport result deliberately discarded; no process/network crash simulated'};
    }else throw Error('UNIMPLEMENTED_CASE:'+id);
    entry.status='PASS';report.case_passes++;if(adapter.execution_scope==='xano_native')report.hosted_passes++;await record(report);
   }catch(e){entry.status='FAIL';entry.error=String(e.message).slice(0,2000);throw e;}
  }
  report.preservation=await adapter.preservation();
  report.complete=report.cases.every(c=>c.status==='PASS');
 }catch(e){adapter.invalidate();report.blocker=String(e.message).slice(0,2000);}
 report.finished_at=new Date().toISOString();await record(report);return report;
}
module.exports={execute,settle};
