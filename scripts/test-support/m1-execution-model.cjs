'use strict';
// In-memory test double only. Synthetic PIDs/timestamps/errors are never hosted evidence.
const A=require('../../backend/milestone1/reservation-v2/assertions.cjs'),F=require('../../backend/milestone1/execution-v3/fixtures.json');
const {hash,canonical}=require('../../backend/milestone1/execution-v3/native-adapter.cjs'),C=require('../../backend/milestone1/execution-v3/contention.cjs');
const uid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
function model(){
 let n=1000;const next=()=>++n,db=Object.fromEntries([...A.TABLES,...F.fixture_tables].map(t=>[t,[]])),users=new Map(),commands=new Map(),fixtures=new Map(),busyV=new Set(),busyD=new Set();
 const rows=(t,v)=>{const r={id:next(),...v};db[t].push(r);return r;};
 const snap=()=>({database:'sn9m-aat6-200c',scope:'entire_sandbox_tables',counts:Object.fromEntries(A.TABLES.map(t=>[t,db[t].length])),content_hashes:Object.fromEntries(A.TABLES.map(t=>[t,hash(canonical(db[t]))])),fixture_counts:Object.fromEntries(F.fixture_tables.map(t=>[t,db[t].length])),fixture_hashes:Object.fromEntries(F.fixture_tables.map(t=>[t,hash(canonical(db[t]))])),row_digests:Object.fromEntries(Object.entries(db).map(([t,rr])=>[t,rr.map(r=>({id:r.id,sha256:hash(canonical(r))}))]))});
 const receipt=(value,index=0,logs=[])=>({value,logs,started_ms:10000+index*10,finished_ms:16000+index*10,source_hash_verified:true,bundle_sha256:'a'.repeat(64)});
 const failure=message=>({code:'NATIVE_FAILURE',native_error:{code:'ERROR',message}});
 function inspection(id,index){
  const p=F.cases[id],r=p.requests[index],saved=commands.get(r.idempotency_key);
  return saved?{...saved.row,code:'INSPECT'}:{code:'INSPECT',table_counts:Object.fromEntries(A.TABLES.map(t=>[t,0]))};
 }
 function command(id,index,recover){
  const p=F.cases[id],r=p.requests[index],old=commands.get(r.idempotency_key);
  if(id.startsWith('identity-')){
   let msg='Actor is not authorized';
   if(id==='identity-foreign_tenant_claim')msg='Platform does not match authenticated identity';
   else if(id==='identity-foreign_resource')msg='Resource not available to this platform';
   else if(['foreign_owner','overweight','wrong_body','unverified_document','expired_document','inactive_vendor','inactive_driver'].some(x=>id==='identity-'+x))msg='Provider eligibility failed';
   return receipt(failure(msg));
  }
  if(r.fault!=='none' && !recover)return receipt({...failure(id.startsWith('database-')?'division by zero':'M1_APPLICATION_'+id.split('-')[1].toUpperCase()),requested_fault:r.fault});
  if(old){
   if(id==='changed-payload')return receipt({code:'IDEMPOTENCY_CONFLICT',http_status:409});
   if(old.expired)return receipt(failure('Original request is unavailable or expired'));
   return receipt({...old.row,code:'REPLAY',db_pid:101+index,lock_wait_ms:index?2000:0,lock_started_ms:10000,lock_acquired_ms:10000+(index?2000:0)},index);
  }
  const proof=id.startsWith('proof-'),logs=proof?[{marker:'M1_RESERVATION_CLAIM_ENTRY',key:r.idempotency_key,pid:101+index,ms:11000+index*10}]:[];
  if(busyV.has(r.vehicle_id)||busyD.has(r.driver_profile_id))return receipt(proof?failure('23505 duplicate key value violates unique constraint reservation_resource_unique'):{code:'RESOURCE_BUSY',http_status:409,db_pid:101+index,lock_wait_ms:2000,lock_started_ms:10000,lock_acquired_ms:12000},index,logs);
  busyV.add(r.vehicle_id);busyD.add(r.driver_profile_id);
  const ids=Array.from({length:8},()=>uid(next()));
  const row={code:'CREATED',http_status:202,order_id:ids[0],trip_id:ids[1],workflow_id:ids[2],correlation_id:ids[3],trip_assignment_id:ids[4],platform_id:p.platform,selected_vehicle_id:r.vehicle_id,selected_driver_id:r.driver_profile_id,order_status:'assigned',order_version:4,table_counts:{...A.EXPECTED},linkage_verified:true,reservation_linkage_verified:true,asset_assignments:1,driver_assignments:1,db_pid:101+index,lock_wait_ms:0,lock_started_ms:10000,lock_acquired_ms:10000,transaction_finished_ms:15500,request_hash_sha256:hash(r.idempotency_key)};
  row.reservation_rows=['vehicle','driver'].map((kind,i)=>({reservation_id:ids[5+i],platform_id:p.platform,resource_kind:kind,resource_id:i?r.driver_profile_id:r.vehicle_id,trip_assignment_id:ids[4]}));
  for(const [t,count] of Object.entries(A.EXPECTED))for(let i=0;i<count;i++)rows(t,{key:r.idempotency_key,position:i});
  const idem=db.idempotency_records.at(-1);commands.set(r.idempotency_key,{row,idem,expired:false});
  if(proof)logs.push({marker:'M1_RESERVATION_CLAIMS_ACQUIRED',key:r.idempotency_key,pid:101+index,ms:13050});
  return receipt(row,index,logs);
 }
 return {
  execution_scope:'offline_simulation',db,
  async preflight(){return {ready:true,bundle_sha256:'a'.repeat(64),indexes:[{table:'active_assignment_reservations',columns:['platform_id','resource_kind','resource_id'],indexname:'reservation_resource_unique'}]};},
  async invoke(name,input={}){
   const id=input.case_id,p=F.cases[id];
   if(name==='snapshot')return receipt(snap());
   if(name==='contention_waits')return receipt({database:'sn9m-aat6-200c',ms:14000,waits:[102,103,104].map(pid=>({pid,wait_event_type:'Lock',wait_event:'transactionid',blocking_pids:[101]}))});
   if(name==='seed'){
    if(id==='identity-duplicate_customer_profile')return receipt(failure('23505 duplicate key value violates unique constraint customer_profile_platform_account_unique'));
    const actor=rows('user',{name:p.email,email:p.email,role:p.starter_role});users.set(id,actor);
    const observed=p.rows.map(r=>({table:r.table,rows:[rows(r.table,Object.fromEntries(Object.entries(r.data).map(([k,v])=>[k,v==='__ACTOR__'?'xano:'+actor.id:v])))]}));
    fixtures.set(id,{actor,observed});return receipt({code:'SEEDED'});
   }
   if(name==='fixture_readback')return receipt(fixtures.get(id));
   if(name==='inspect')return receipt(inspection(id,input.index));
   if(name==='invoke')return command(id,input.index,input.recover);
   if(name==='expire_positive_a'){
    const c=commands.get(F.cases['positive-a'].requests[0].idempotency_key);c.expired=true;c.idem.expires_at=1;return receipt({id:c.idem.id,expires_at:1});
   }
   throw Error('Unexpected model operation '+name);
  },
  acceptContention(e){C.evaluate({...e,execution_scope:'xano_native'});return {passed:true,qualification:'OFFLINE_MODEL_ONLY'};},
  async preservation(){return {unchanged:true,qualification:'OFFLINE_MODEL_ONLY'};},
  invalidate(){}
 };
}
module.exports={model};
