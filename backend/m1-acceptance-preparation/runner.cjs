'use strict';
// Transport-neutral acceptance engine. No default HTTP/native adapter exists.
// A separately reviewed, tenant-bound adapter is required after owner approval.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const evidence=path.resolve(__dirname,'../reconciliation-20261029/evidence');
const inventory=JSON.parse(fs.readFileSync(path.join(evidence,'published-inventory.json')));
const mutations=inventory.documents.filter(d=>d.type==='query'&&d.group==='Zippy_V1'&&d.verb!=='GET');
const tables=inventory.documents.filter(d=>d.type==='table').map(d=>d.name).sort();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const canonical=v=>JSON.stringify(v&&typeof v==='object'?(Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))]))):v);
function need(ok,code){if(!ok){const e=new Error(code);e.code=code;throw e;}}
const positive=x=>Number.isSafeInteger(x)&&x>0;
const digest=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const statuses=['draft','quoted','booked','assigned','in_transit','delivered','completed','cancelled'];
function gate(r,now=Date.now()){
 need(r?.status==='APPROVED'&&r.scope==='ISOLATED_AB_ONLY'&&typeof r.approval_ref==='string'&&r.approval_ref.length>0,'APPROVAL_REQUIRED');
 need(r.workspace===3&&r.source_branch==='v1'&&r.tenant_kind==='ephemeral','WRONG_TARGET');
 need(typeof r.tenant==='string'&&/^e[a-z0-9-]{5,}$/.test(r.tenant),'EPHEMERAL_REQUIRED');
 need(typeof r.database_identity==='string'&&r.database_identity.length>0&&typeof r.parent_database_identity==='string'&&r.parent_database_identity.length>0&&r.parent_database_identity!==r.database_identity,'DATABASE_ISOLATION_REQUIRED');
 const expiry=Date.parse(r.expires_at),credential=Date.parse(r.credential_expires_at);
 need(Number.isFinite(expiry)&&expiry>now+60000&&expiry<=now+4*3600000&&credential>now+60000&&credential<=expiry,'EXPIRY_REQUIRED');
 need(digest(r.source_manifest_sha256)&&digest(r.adapter_sha256)&&typeof r.fixture_run_id==='string'&&r.fixture_run_id.length>0,'PINNED_SOURCE_REQUIRED');
 for(const name of ['physical_identity','restricted_tenant_access','parent_live_denial','application_token_isolation','empty_environment_no_live_copy','provider_egress_block','deployed_source_hashes','fixture_ownership','expiry_and_recovery'])need(typeof r.proof_refs?.[name]==='string'&&r.proof_refs[name].length>0,'PROOF_REQUIRED');
 return true;
}
function snapshot(s,r){
 need(s?.database_identity===r.database_identity&&s.fixture_run_id===r.fixture_run_id,'SNAPSHOT_TARGET_MISMATCH');
 need(s.provider_requests===0&&s.agent_calls===0,'EXTERNAL_EFFECT_DETECTED');
 need(canonical(Object.keys(s.tables||{}).sort())===canonical(tables),'INCOMPLETE_SNAPSHOT');
 for(const table of tables){const t=s.tables[table];need(digest(t.hash)&&Array.isArray(t.rows)&&t.count===t.rows.length,'INVALID_SNAPSHOT');const ids=new Set();for(const row of t.rows){need(positive(row.id)&&digest(row.hash)&&!ids.has(row.id),'INVALID_ROW_DIGEST');ids.add(row.id);}}
}
function unchanged(a,b,r){snapshot(a,r);snapshot(b,r);need(canonical(a.tables)===canonical(b.tables),'DATABASE_SIDE_EFFECT');}
function row(value,organization){
 const keys=['id','booking_reference','customer_organization_id','status','payment_status','payment_mode','pickup_city','delivery_city','version'];
 need(value&&canonical(Object.keys(value).sort())===canonical(keys.sort()),'BOOKING_PROJECTION_INVALID');
 need(positive(value.id)&&positive(value.version)&&value.customer_organization_id===organization,'BOOKING_SCOPE_INVALID');
 need(['booking_reference','pickup_city','delivery_city'].every(k=>typeof value[k]==='string'&&value[k].length>0&&value[k].length<=500)&&statuses.includes(value.status),'BOOKING_SHAPE_INVALID');
 need(['pending','authorized','paid_escrow','settled','refunded','failed'].includes(value.payment_status)&&['prepaid','topay','credit',null].includes(value.payment_mode),'PAYMENT_SHAPE_INVALID');
}
function page(body,org,number,perPage,status,expectedIds){
 need(body&&Array.isArray(body.items)&&body.curPage===number&&(body.nextPage===null||body.nextPage===number+1)&&body.items.length<=perPage,'PAGE_INVALID');
 for(const item of body.items){row(item,org);if(status)need(item.status===status,'STATUS_SCOPE_INVALID');}
 need(new Set(body.items.map(x=>x.id)).size===body.items.length,'DUPLICATE_BOOKING');
 need(canonical(body.items.map(x=>x.id).sort((a,b)=>a-b))===canonical([...expectedIds].sort((a,b)=>a-b)),'UNEXPECTED_FIXTURE_SET');
}
function plan(){return {status:'BLOCKED',scope:'PREPARATION_ONLY',mutation_routes:mutations.map(({name,verb})=>({method:verb,path:name})),stageA:{modes:['anonymous','malformed','A','driver'],variants:['own','foreign','malformed_path'],requests:mutations.length*4*3,no_effects:'Full 33-table row/count hashes and provider/agent counters before and after EVERY request, including errors'},stageB:['approved login + audit','pending/wrong/absent login','current auth/me','own A/B list/detail','foreign/missing equality','status/pagination','driver/operator denial','suspend saved token','revoke membership saved token','deactivate organization saved token'],stageC:{status:'BLOCKED',cases:16},native_adapter:'NOT_IMPLEMENTED'};}
async function execute(r,adapter){
 gate(r);need(['offline_simulation','xano_native'].includes(adapter.scope),'INVALID_ADAPTER_SCOPE');
 const report={scope:adapter.scope,status:'RUNNING',cases:[],hosted_passes:0,stageC:'BLOCKED'};let requests=0;
 const record=(id,status,extra={})=>report.cases.push({id,status,...extra});
 async function observe(){gate(r);const s=await adapter.snapshot();snapshot(s,r);return s;}
 async function noEffect(id,request,check){
  gate(r);need(++requests<=220,'REQUEST_BUDGET_EXCEEDED');const before=await observe();let result,error;
  try{result=await adapter.request(request);check(result);}catch(e){error=e;}
  // Always inspect post-state, including HTTP/transport/assertion failure. Never retry.
  const after=await observe();unchanged(before,after,r);if(error)throw error;
  record(id,'VERIFIED',{http:result.status,before_hash:hash(canonical(before)),after_hash:hash(canonical(after))});return result;
 }
 const deny=(x,status)=>need(x.status===status&&x.body&&typeof x.body.code==='string'&&typeof x.body.message==='string','DENIAL_INVALID');
 try{
  const pre=await adapter.preflight();gate(pre);need(canonical(pre)===canonical(r),'PREFLIGHT_DRIFT');
  const f=await adapter.fixtures();need(f.run_id===r.fixture_run_id&&positive(f.orgA)&&positive(f.orgB)&&f.orgA!==f.orgB,'FIXTURES_INVALID');
  for(const alias of ['A','B','suspendable','revocable','driver','operator','pending'])need(positive(f.users?.[alias]),'FIXTURE_USER_MISSING');
  need(positive(f.memberships?.revocable)&&positive(f.missing)&&Array.isArray(f.bookingsA)&&f.bookingsA.length===3&&Array.isArray(f.bookingsB)&&f.bookingsB.length===2,'FIXTURE_BOOKINGS_MISSING');
  need(positive(f.hold_id)&&[f.quote_id,f.attempt_id].every(x=>typeof x==='string'&&/^[a-f0-9-]{36}$/.test(x)),'FIXTURE_PATH_IDS_MISSING');
  need(new Set([...f.bookingsA,...f.bookingsB].map(b=>b.id)).size===5&&[...f.bookingsA,...f.bookingsB].every(b=>positive(b.id)&&statuses.includes(b.status))&&![...f.bookingsA,...f.bookingsB].some(b=>b.id===f.missing),'FIXTURE_IDS_INVALID');
  for(const alias of ['A','B','suspendable','revocable','driver','operator']){
   gate(r);const result=await adapter.login(alias);need(result.status===200&&typeof result.body?.authToken==='string'&&result.body.authToken.length>0&&result.body.user_id===f.users[alias],'LOGIN_INVALID');
   const audit=await adapter.loginAudit(alias);need(audit.new_rows===1&&audit.user_id===f.users[alias]&&audit.action==='login'&&audit.metadata_empty===true&&audit.credential_matches===0,'LOGIN_AUDIT_INVALID');
   record('login-'+alias,'VERIFIED',{http:200});
  }
  for(const mode of ['anonymous','malformed','A','driver'])for(const d of mutations)for(const variant of ['own','foreign','malformed_path']){
   const booking=variant==='foreign'?f.bookingsB[0].id:f.bookingsA[0].id;
   const substitute=variant==='malformed_path'?'invalid':String(booking);
   const route=d.name.replace('{booking_id}',substitute).replace('{hold_id}',variant==='malformed_path'?'invalid':String(f.hold_id)).replace('{quote_id}',variant==='malformed_path'?'invalid':f.quote_id).replace('{attempt_id}',variant==='malformed_path'?'invalid':f.attempt_id);
   await noEffect('refusal-'+d.guid+'-'+mode+'-'+variant,{group:'logistics',method:d.verb,path:route,identity:mode,body:{status:'completed',system_role:'super_admin',requested_org_id:f.orgB}},x=>{
    if(variant==='malformed_path'){need([400,401,403,404].includes(x.status),'MALFORMED_ROUTE_SUCCEEDED');return;}
    deny(x,['anonymous','malformed'].includes(mode)?401:403);
    if(['A','driver'].includes(mode))need(x.body.message==='Booking mutations are unavailable pending release review.','REFUSAL_MESSAGE_INVALID');
   });
  }
  for(const alias of ['A','B'])await noEffect('me-'+alias,{group:'auth',method:'GET',path:'auth/me',identity:alias},x=>need(x.status===200&&x.body?.id===f.users[alias]&&x.body.status==='active'&&x.body.system_role==='customer_member'&&x.body.active_organization_id===(alias==='A'?f.orgA:f.orgB)&&canonical(Object.keys(x.body).sort())===canonical(['id','name','email','system_role','status','active_organization_id'].sort()),'IDENTITY_INVALID'));
  for(const alias of ['pending','wrong_password','absent'])await noEffect('denied-login-'+alias,{group:'auth',method:'POST',path:'auth/login',login_fixture:alias,identity:'anonymous'},x=>deny(x,401));
  for(const alias of ['A','B']){const records=alias==='A'?f.bookingsA:f.bookingsB;await noEffect('list-'+alias,{group:'logistics',method:'GET',path:'bookings?page=1&per_page=20',identity:alias},x=>{need(x.status===200,'LIST_DENIED');page(x.body,alias==='A'?f.orgA:f.orgB,1,20,null,records.map(b=>b.id));need(x.body.nextPage===null,'PAGE_OVERFLOW');});}
  const drafts=f.bookingsA.filter(b=>b.status==='draft');need(drafts.length===2,'DRAFT_FIXTURES_INVALID');
  const seen=[];
  for(const n of [1,2])await noEffect('page-'+n,{group:'logistics',method:'GET',path:'bookings?page='+n+'&per_page=1&status=draft',identity:'A'},x=>{need(x.status===200,'PAGE_DENIED');const id=x.body?.items?.[0]?.id;need(drafts.some(b=>b.id===id)&&!seen.includes(id),'PAGE_FIXTURE_INVALID');page(x.body,f.orgA,n,1,'draft',[id]);need(x.body.nextPage===(n===1?2:null),'NEXT_PAGE_INVALID');seen.push(id);});
  const own=f.bookingsA[0].id;
  await noEffect('own-detail',{group:'logistics',method:'GET',path:'bookings/'+own,identity:'A'},x=>{need(x.status===200&&x.body?.booking?.id===own,'DETAIL_INVALID');row(x.body.booking,f.orgA);for(const key of ['cargo','active_holds'])need(Array.isArray(x.body[key])&&x.body[key].every(v=>positive(v.id)&&Object.keys(v).length===1),'PRIVATE_DETAIL_PROJECTION');need(Array.isArray(x.body.allowed_actions)&&x.body.allowed_actions.length===0&&Array.isArray(x.body.blocking_reasons),'DETAIL_ACTIONS_INVALID');});
  const foreign=await noEffect('foreign-detail',{group:'logistics',method:'GET',path:'bookings/'+f.bookingsB[0].id,identity:'A'},x=>deny(x,404));
  const missing=await noEffect('missing-detail',{group:'logistics',method:'GET',path:'bookings/'+f.missing,identity:'A'},x=>deny(x,404));
  need(canonical(foreign.body)===canonical(missing.body),'FOREIGN_INFORMATION_LEAK');
  await noEffect('foreign-org-selector',{group:'logistics',method:'GET',path:'bookings?requested_org_id='+f.orgB,identity:'A'},x=>deny(x,403));
  for(const alias of ['driver','operator'])for(const route of ['bookings','bookings/'+own])await noEffect(alias+'-denied-'+route,{group:'logistics',method:'GET',path:route,identity:alias},x=>deny(x,403));
  async function control(operation,alias,table,id){
   gate(r);const before=await observe();await adapter.control({operation,alias,run_id:r.fixture_run_id});const after=await observe();
   for(const t of tables){if(t!==table)need(canonical(before.tables[t])===canonical(after.tables[t]),'CONTROL_CROSS_TABLE_WRITE');else{const a=before.tables[t],b=after.tables[t];need(a.count===b.count,'CONTROL_ROW_COUNT_CHANGED');need(a.rows.some(x=>x.id===id)&&b.rows.some(x=>x.id===id),'CONTROL_ROW_MISSING');need(canonical(a.rows.filter(x=>x.id!==id))===canonical(b.rows.filter(x=>x.id!==id)),'CONTROL_UNRELATED_ROW_WRITE');}}
  }
  for(const [operation,restore,alias,table,id]of [['suspend_user','activate_user','suspendable','user',f.users.suspendable],['revoke_membership','restore_membership','revocable','organization_member',f.memberships.revocable],['deactivate_org','activate_org','A','organization',f.orgA]]){
   await control(operation,alias,table,id);
   for(const [group,route]of [['auth','auth/me'],['logistics','bookings'],['logistics','bookings/'+own]])await noEffect(operation+'-'+route,{group,method:'GET',path:route,identity:alias},x=>deny(x,403));
   if(operation==='suspend_user')await noEffect('suspended-login',{group:'auth',method:'POST',path:'auth/login',identity:'anonymous',login_fixture:'suspendable'},x=>deny(x,401));
   await control(restore,alias,table,id);
  }
  report.status='VERIFIED';if(adapter.scope==='xano_native')report.hosted_passes=report.cases.length;
 }catch(e){report.status='FAILED';report.reason=/^[A-Z_]+$/.test(e.code||'')?e.code:'EXECUTION_STOPPED';}
 report.requests=requests;return report;
}
module.exports={gate,snapshot,unchanged,page,row,plan,execute,tables};
if(require.main===module){(async()=>{
 const args=process.argv.slice(2);
 if(args.length===0||args[0]==='--plan'){console.log(JSON.stringify(plan(),null,2));return;}
 need(args[0]==='--execute'&&args.length===4,'USAGE_PLAN_OR_EXECUTE_APPROVAL_ADAPTER_NEW_RECEIPT');
 const r=JSON.parse(fs.readFileSync(args[1]));gate(r);
 need(hash(fs.readFileSync(args[2]))===r.adapter_sha256,'UNREVIEWED_ADAPTER');
 const fd=fs.openSync(args[3],'wx');
 try{const adapter=require(path.resolve(args[2]));need(adapter.scope==='xano_native','NATIVE_ADAPTER_REQUIRED');const report=await execute(r,adapter);fs.writeFileSync(fd,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,hosted_passes:report.hosted_passes}));if(report.status!=='VERIFIED')process.exitCode=1;}finally{fs.closeSync(fd);}
 })().catch(e=>{console.error(e.code||'PREPARATION_BLOCKED');process.exitCode=1;});}
