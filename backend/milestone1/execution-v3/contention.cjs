'use strict';
// This evaluates supplied evidence. Only native-adapter-issued receipts can unlock its executor.
const assert=require('node:assert/strict'),A=require('../reservation-v2/assertions.cjs'),E=require('./evidence.cjs'),F=require('./fixtures.json');
function markers(logs,marker,key){
 const found=[];
 function walk(v){
  if(typeof v==='string'){try{walk(JSON.parse(v));}catch{}return;}
  if(!v || typeof v!=='object')return;
  if(v.marker===marker && v.key===key)found.push(v);
  for(const [k,x] of Object.entries(v))if(k!=='marker'&&k!=='key')walk(x);
 }
 walk(logs);return found;
}
function cohort(c,indexname){
 const plan=F.cases[c.id];assert.ok(['proof-vehicle','proof-driver'].includes(c.id));
 assert.equal(c.outcomes.length,4);assert.equal(c.inspections.length,4);
 const winners=c.outcomes.map((r,i)=>r.value.code==='CREATED'?i:-1).filter(i=>i>=0);
 assert.equal(winners.length,1,'Exactly one native winner required');
 const winner=winners[0],entries=[];
 for(let i=0;i<4;i++){
  const r=c.outcomes[i],key=plan.requests[i].idempotency_key;
  assert.equal(r.source_hash_verified,true);assert.ok(r.finished_ms>r.started_ms);
  const ms=markers(r.logs,'M1_RESERVATION_CLAIM_ENTRY',key);assert.equal(ms.length,1,'Native transaction entry log required');
  assert.ok(Number.isInteger(ms[0].pid)&&ms[0].pid>0);assert.ok(Number.isFinite(ms[0].ms));entries.push(ms[0]);
  if(i===winner)E.enriched(r,c.inspections[i].value);
  else{
   E.nativeFailure(r,/23505|duplicate key value violates unique constraint/i);
   assert.ok(E.message(r).includes(indexname),'Must name actual reservation unique index');
   E.emptyInspection(c.inspections[i].value);
  }
 }
 assert.equal(new Set(entries.map(x=>x.pid)).size,4,'Four actual database sessions required');
 assert.ok(Math.max(...entries.map(x=>x.ms))<Math.min(...entries.map(x=>x.ms))+2000,'Every contender must reach pre-claim barrier before first attempt');
 assert.ok(Math.max(...c.outcomes.map(r=>r.started_ms))<Math.min(...c.outcomes.map(r=>r.finished_ms)),'Requests did not overlap');
 const claimed=markers(c.outcomes[winner].logs,'M1_RESERVATION_CLAIMS_ACQUIRED',plan.requests[winner].idempotency_key);
 assert.equal(claimed.length,1);assert.equal(claimed[0].pid,entries[winner].pid);
 assert.ok(claimed[0].ms>=entries[winner].ms+1500);
 assert.ok(Math.max(...entries.map(x=>x.ms))<claimed[0].ms,'Contenders entered after winner claimed');
 assert.ok(c.outcomes[winner].value.transaction_finished_ms>=claimed[0].ms+1500,'Unique tuple locks were not held through contention interval');
 assert.ok(c.observations?.length,'Native database lock observations required');
 const blocked=new Set();
 for(const receipt of c.observations){
  assert.equal(receipt.source_hash_verified,true);
  const observation=receipt.value;assert.equal(observation.database,'sn9m-aat6-200c');
  if(observation.ms<claimed[0].ms || observation.ms>=c.outcomes[winner].value.transaction_finished_ms)continue;
  const graph=new Map(observation.waits.filter(w=>w.wait_event_type==='Lock').map(w=>[w.pid,w.blocking_pids]));
  function reaches(pid,seen=new Set()){
   if(pid===entries[winner].pid)return true;if(seen.has(pid))return false;seen.add(pid);
   return (graph.get(pid)||[]).some(p=>reaches(p,seen));
  }
  entries.forEach((e,i)=>{if(i!==winner && graph.has(e.pid) && reaches(e.pid))blocked.add(e.pid);});
 }
 assert.equal(blocked.size,3,'Every losing database session must be observed waiting on winner tuple/transaction locks');
 E.delta(c.before.value,c.after.value);
 const requests=plan.requests;
 if(c.id==='proof-vehicle'){assert.equal(new Set(requests.map(r=>r.vehicle_id)).size,1);assert.equal(new Set(requests.map(r=>r.driver_profile_id)).size,4);}
 else{assert.equal(new Set(requests.map(r=>r.vehicle_id)).size,4);assert.equal(new Set(requests.map(r=>r.driver_profile_id)).size,1);}
 // Same-driver losers insert their vehicle claim first. Full delta/preservation and
 // losing-key inspection must show that those half-claims did not survive.
 const win=c.inspections[winner].value;
 assert.equal(win.driver_assignments,1);if(c.id==='proof-vehicle')assert.equal(win.asset_assignments,1);
 return {id:c.id,winner_index:winner,distinct_database_sessions:4,index_name:indexname};
}
function evaluate(e){
 assert.equal(e.execution_scope,'xano_native');assert.match(e.bundle_sha256,/^[a-f0-9]{64}$/);
 assert.ok(e.reservation_index_name);assert.equal(e.cohorts.length,2);
 assert.deepEqual(e.cohorts.map(c=>c.id),['proof-vehicle','proof-driver']);
 return e.cohorts.map(c=>cohort(c,e.reservation_index_name));
}
module.exports={evaluate,cohort,markers};
