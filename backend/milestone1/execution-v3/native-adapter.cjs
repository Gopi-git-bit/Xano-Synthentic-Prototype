'use strict';
// Fixed origin/tenant, no import, SQL, arbitrary table or arbitrary function API.
// Preparation stays disabled by the committed activation record until reviewed evidence exists.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../../..'),ORIGIN='https://xynd-fnea-khtp.n7e.xano.io';
const TENANT='sn9m-aat6-200c',META='/api:meta/workspace/1';
const FIX=require('./fixtures.json');
const LIMITS=Object.freeze({requests:1000,concurrent:5,writer_concurrent:4,bytes:4_000_000,timeout_ms:30_000,lease_ms:120_000});
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const canonical=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
const norm=v=>v.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').trim();
function read(p){assert.ok(typeof p==='string' && !path.isAbsolute(p) && !p.split(/[\\/]/).includes('..'));return fs.readFileSync(path.join(ROOT,p),'utf8');}
function activation(){
 const a=JSON.parse(read('backend/milestone1/execution-v3/activation.json'));
 if(a.status!=='VERIFIED' || a.execution_enabled!==true)return {ready:false,blockers:a.missing};
 assert.equal(a.tenant,TENANT);assert.equal(a.workspace_id,1);assert.equal(a.branch,'v1');
 const e={};
 for(const k of ['access','inventory','writers','import_readback']){
  const ref=a.required_evidence[k];assert.match(ref?.sha256||'',/^[a-f0-9]{64}$/);
  const bytes=read(ref.path);assert.equal(hash(bytes),ref.sha256,'Evidence hash drift: '+k);
  e[k]=JSON.parse(bytes);assert.equal(e[k].status,'VERIFIED');
 }
 assert.equal(e.access.name,'zippy-m1-sandbox');
 assert.notEqual(e.access.token_keyid,'36891865-93ff-40a0-9e76-7d27768cf48d','Existing broad token forbidden');
 assert.ok(Date.parse(e.access.expires_at)-Date.parse(e.access.created_at)<=7*86400000);
 assert.ok(Date.parse(e.access.expires_at)>Date.now());
 for(const permission of ['live_data','deploy','release','secrets','rbac','impersonation','backup_restore','cluster_admin','delete'])
  assert.equal(e.access.effective_permissions[permission],'DENY',permission+' must be denied');
 assert.equal(e.access.account_or_role_changed,false);
 assert.ok(e.inventory.support_reference && e.inventory.decision_text_sha256);
 assert.deepEqual(e.inventory.retained_diagnostics,['mvpw1_56','mvpw1_57']);
 assert.equal(e.writers.enforced,true);
 assert.ok(e.writers.mechanism && e.writers.negative_probe_evidence?.length);
 assert.equal(e.writers.unprotected_assignment_paths?.length,0);
 assert.equal(e.import_readback.native_validation,'PASS_THIS_REVISION');
 assert.equal(e.import_readback.backfill_source_sha256,'95780bb95456e4aadc4b2331f4808fe1004d420e73de32413774c91067e862af');
 for(const k of ['sandbox_source_sha256','live_source_sha256'])assert.match(e.import_readback[k]||'',/^[a-f0-9]{64}$/);
 const manifest=JSON.parse(read('backend/milestone1/execution-v3/manifest.json'));
 for(const f of manifest.files)assert.equal(hash(read(f.path)),f.sha256,'Preparation drift: '+f.path);
 assert.equal(e.import_readback.bundle_sha256,manifest.bundle_sha256);
 return {ready:true,e};
}
function resultValue(raw){
 assert.equal(raw?.result?.status,'ok','Native function transport/application failure');
 let v=raw.result.result;if(typeof v==='string')v=JSON.parse(v);
 assert.ok(v && typeof v==='object' && !Array.isArray(v));return v;
}
function indexes(catalog,metadata){
 const defs=[['active_assignment_reservations',['reservation_id']],['active_assignment_reservations',['platform_id','resource_kind','resource_id']],['active_assignment_reservations',['platform_id','trip_assignment_id','resource_kind']],['idempotency_records',['platform_id','operation_scope','idempotency_key']]];
 return defs.map(([name,columns])=>{
  const ts=metadata.filter(t=>t.name===name);assert.equal(ts.length,1);
  const matches=catalog.indexes.filter(i=>i.tablename==='mvpw1_'+ts[0].id && canonical(i.columns)===canonical(columns) && i.indisunique===true && i.indisvalid===true && i.indisready===true && i.predicate===null && i.not_null?.every(n=>n===true));
  assert.equal(matches.length,1,'Real valid unique index required: '+name+':'+columns);
  return {table:name,columns,indexname:matches[0].indexname};
 });
}
function validateInput(name,input){
 assert.ok(input && typeof input==='object' && !Array.isArray(input));
 const keys=Object.keys(input).sort();
 if(['snapshot','catalog','contention_waits','expire_positive_a'].includes(name)){assert.deepEqual(keys,[]);return;}
 assert.ok(['seed','fixture_readback','inspect','invoke'].includes(name),'Function not allowed');
 assert.ok(Object.hasOwn(FIX.cases,input.case_id));
 if(['seed','fixture_readback'].includes(name)){assert.deepEqual(keys,['case_id']);if(name==='seed')assert.equal(FIX.cases[input.case_id].seed,input.case_id);return;}
 assert.deepEqual(keys,name==='invoke'?['case_id','index','recover']:['case_id','index']);
 assert.ok(Number.isInteger(input.index) && input.index>=0 && input.index<FIX.cases[input.case_id].requests.length);
 if(name==='invoke'){assert.equal(typeof input.recover,'boolean');if(input.recover)assert.match(input.case_id,/^(database|application)-after_(order|assignment)$/);}
}
function createNativeAdapter({token=process.env.XANO_SANDBOX_METADATA_TOKEN}={}){
 let calls=0,active=0,lease=0,readback=null,proof=null,liveHash=null;
 const receipts=new WeakSet();
 const freeze=v=>{if(v && typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 async function request(route,{sandbox=false,body,denial=false}={}){
  assert.ok(typeof token==='string' && token.length>20 && !/[\r\n]/.test(token),'Restricted token required');
  if(++calls>LIMITS.requests || active>=LIMITS.concurrent || (active>=LIMITS.writer_concurrent && body?.name!=='M1Execution/contention_waits')){lease=0;throw Error('Request bounds exceeded');}
  active++;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),LIMITS.timeout_ms);
  try{
   const r=await fetch(ORIGIN+route,{method:body?'POST':'GET',redirect:'error',signal:controller.signal,
    headers:{Authorization:'Bearer '+token,Accept:'application/json',...(sandbox?{'X-Tenant':TENANT}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   if(denial){await r.body?.cancel();return {http_status:r.status,denied:r.status===403};}
   if(!r.ok)throw Error('Native HTTP '+r.status);
   let size=0;const chunks=[];for await(const c of r.body){size+=c.byteLength;if(size>LIMITS.bytes)throw Error('Response size bound exceeded');chunks.push(c);}
   const text=Buffer.concat(chunks).toString('utf8');
   return route.includes('/multidoc?')?text:JSON.parse(text);
  }catch(e){lease=0;throw Error(/^Native HTTP \d+$/.test(e.message)?e.message:'Native transport/response failure; no automatic retry');}
  finally{clearTimeout(timer);active--;}
 }
 const source=sandbox=>request((sandbox?'/api:meta/sandbox':META)+'/multidoc?branch=v1&env=false&records=false');
 const runRaw=(name,input)=>request(META+'/function/run',{sandbox:true,body:{name,branch:'v1',input}});
 const adapter={
  execution_scope:'xano_native',
  async preflight(){
   assert.equal(active,0);lease=0;
   const state=activation();if(!state.ready)return state;
   const e=state.e,auth=await request('/api:meta/auth/me');
   assert.equal(auth.extras?.access_token?.keyid,e.access.token_keyid);
   assert.equal(hash(canonical(auth.extras.access_token.scope)),e.access.native_scope_sha256,'Effective scopes changed');
   assert.equal(Date.parse(auth.extras.expires_at),Date.parse(e.access.expires_at));
   const workspace=await request(META);
   assert.equal(workspace.id,1);assert.equal(workspace.name,'Zippy Synthetic Prototype');assert.equal(workspace.branch,'v1');assert.equal(workspace.allow_push,false);
   const denied=await request(META+'/table/1/content?page=1&per_page=1',{denial:true});
   assert.equal(denied.denied,true,'Actual authorization denial required; 401/404/network failure is insufficient');
   const live=await source(false),sandbox=await source(true);
   assert.equal(hash(live),e.import_readback.live_source_sha256);
   assert.equal(hash(sandbox),e.import_readback.sandbox_source_sha256);
   // Hash the entire reviewed native export before invoking even a read-only probe.
   const catalog=resultValue(await runRaw('M1Execution/catalog',{}));
   assert.equal(catalog.database,TENANT);
   const metadata=[];let page=1;
   while(page){assert.ok(page<=5);const r=await request(META+'/table?page='+page+'&per_page=100',{sandbox:true});assert.equal(r.curPage,page);assert.ok(Array.isArray(r.items));metadata.push(...r.items);assert.ok(r.nextPage===null || (Number.isInteger(r.nextPage)&&r.nextPage>page));page=r.nextPage;}
   const mapped=metadata.map(t=>({id:t.id,name:t.name,guid:t.guid})).sort((a,b)=>a.id-b.id);
   assert.equal(hash(canonical(mapped)),e.inventory.metadata_mapping_sha256);
   assert.deepEqual([...catalog.tables].sort(),[...e.inventory.physical_tables].sort());
   const idx=indexes(catalog,metadata);
   const admin=resultValue(await runRaw('Milestone1/admin_inventory_probe',{}));
   assert.equal(admin.database,TENANT);assert.equal(hash(canonical(admin.diagnostics)),e.inventory.diagnostics_sha256);
   assert.equal(hash(canonical(admin.diagnostic_dependencies)),e.inventory.diagnostic_dependencies_sha256);
   assert.equal(admin.active_vehicle_duplicate_groups,0);assert.equal(admin.active_driver_duplicate_groups,0);assert.equal(admin.active_assignment_null_keys,0);
   assert.equal(hash(await source(true)),hash(sandbox),'Source changed during checks');
   assert.equal(hash(await source(false)),hash(live),'Live source changed during checks');
   liveHash=hash(live);readback=e.import_readback;lease=Math.min(Date.now()+LIMITS.lease_ms,Date.parse(e.access.expires_at));
   return {ready:true,checked_at:new Date().toISOString(),live_read_denial:denied,indexes:idx,sandbox_source_sha256:hash(sandbox),bundle_sha256:e.import_readback.bundle_sha256};
  },
  async invoke(name,input={}){
   validateInput(name,input);assert.ok(lease>Date.now(),'Fresh passing native preflight required');
   if(name==='invoke' && !input.case_id.startsWith('proof-'))assert.ok(proof?.passed===true,'Separate native uniqueness proof required');
   if(name==='seed' && !input.case_id.startsWith('proof-'))assert.ok(proof?.passed===true,'Separate native uniqueness proof required before 31-case fixtures');
   const started_ms=Date.now();let raw;
   try{raw=await runRaw('M1Execution/'+name,input);}catch(e){lease=0;throw e;}
   const finished_ms=Date.now(),value=resultValue(raw);
   const receipt=freeze({value,logs:raw.logs||[],started_ms,finished_ms,source_hash_verified:!!readback,bundle_sha256:readback?.bundle_sha256});
   receipts.add(receipt);return receipt;
  },
  acceptContention(evidence){
   // Independent evaluator; a caller boolean is never an execution capability.
   assert.ok(lease>Date.now(),'Fresh preflight required');
   for(const c of evidence.cohorts||[])for(const r of [c.before,c.after,...c.outcomes,...c.inspections,...c.observations])assert.ok(receipts.has(r),'Unrecognized native receipt');
   require('./contention.cjs').evaluate(evidence);
   assert.equal(evidence.bundle_sha256,readback?.bundle_sha256);
   proof={passed:true,evidence_sha256:hash(canonical(evidence))};
   return {...proof};
  },
  async preservation(){const h=hash(await source(false));if(h!==liveHash)lease=0;assert.equal(h,liveHash);return {live_source_sha256:h,unchanged:true};},
  invalidate(){lease=0;proof=null;}
 };
 return Object.freeze(adapter);
}
module.exports={createNativeAdapter,activation,indexes,validateInput,resultValue,canonical,hash,LIMITS};
