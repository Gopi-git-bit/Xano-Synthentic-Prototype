'use strict';
// Fixed-target native M1 race adapter. Tokens stay in memory; no import API is exposed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const manifest = require('./manifest.json');
const {TABLES} = require('./assertions.cjs');
const ROOT = path.resolve(__dirname, '../..');
const ORIGIN = 'https://xynd-fnea-khtp.n7e.xano.io';
const TENANT = 'sn9m-aat6-200c';
const META = '/api:meta/workspace/1';
const LIMITS = Object.freeze({requests:96, concurrent:4, bytes:2_000_000, timeout_ms:30_000, lease_ms:120_000});
const digest = x => crypto.createHash('sha256').update(x).digest('hex');
const normalize = x => x.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').trim();
const read = p => fs.readFileSync(path.join(ROOT,p),'utf8');
function documents(source) {
  if(typeof source !== 'string') throw Error('Invalid source export');
  return source.split(/^\s*---\s*$/m).map(normalize).filter(Boolean);
}
function named(docs, kind, name) {
  const entries = docs.filter(d => {
    const m = d.match(new RegExp('^'+kind+' (?:"([^"]+)"|([A-Za-z0-9_]+))\\s*\\{','m'));
    return (m?.[1] || m?.[2]) === name;
  });
  if(entries.length !== 1) throw Error('Missing or duplicate native definition: '+kind+'/'+name);
  return entries[0];
}
function resultValue(response) {
  if(response?.result?.status !== 'ok') throw Error('Native function/run did not succeed');
  let v = response.result.result;
  if(typeof v === 'string') {
    try { v = JSON.parse(v); } catch { throw Error('Malformed native inspection result'); }
  }
  if(!v || typeof v !== 'object' || Array.isArray(v)) throw Error('Invalid native result shape');
  return v;
}
function indexEvidence(inspection, tables) {
  const expected = [
    ['idempotency_records', ['platform_id','operation_scope','idempotency_key'], false],
    ['trip_assignments', ['platform_id','vehicle_id'], true],
    ['trip_assignments', ['platform_id','driver_profile_id'], true]
  ];
  return expected.map(([name,columns,partial]) => {
    const t = tables.find(t=>t.name===name);
    const physical = t ? 'mvpw1_'+t.id : null;
    const suffix = ' on public.'+physical+' using btree ('+columns.join(', ')+')'+(partial?' where (released_at is null)':'');
    const matches = (inspection.indexes||[]).filter(i =>
      i.tablename===physical && /^create unique index \S+ on /i.test(i.indexdef) &&
      i.indexdef.toLowerCase().endsWith(suffix));
    return {table:name, physical_table:physical, columns, predicate:partial?'released_at IS NULL':null,
      catalog_definition_observed:matches.length===1, index_name:matches.length===1?matches[0].indexname:null};
  });
}
function inventory(inspection,tables,docs) {
  const physical = new Set((inspection.tables||[]).map(t=>t.name));
  const mapped = new Set(), names = new Set(), guids = new Set();
  const issues = [];
  for(const t of tables) {
    if(names.has(t.name) || guids.has(t.guid)) issues.push('DUPLICATE_TABLE_IDENTITY');
    names.add(t.name);guids.add(t.guid);
    if(!Number.isInteger(t.id) || t.id<=0) {issues.push('INVALID_TABLE_ID');continue;}
    const physicalName = 'mvpw1_'+t.id;
    if(mapped.has(physicalName)) issues.push('DUPLICATE_MAPPING:'+physicalName);
    mapped.add(physicalName);
    if(!physical.has(physicalName)) issues.push('MISSING_PHYSICAL:'+physicalName);
    try {
      const source = named(docs,'table',t.name);
      const guid = source.match(/^\s*guid = "([^"]+)"/m)?.[1];
      if(!guid || guid!==t.guid) issues.push('TABLE_GUID_MISMATCH:'+t.name);
      const actual = new Set((inspection.columns||[]).filter(c=>c.table_name===physicalName).map(c=>c.column_name));
      for(const col of t.schema||[]) if(!actual.has(col.name)) issues.push('MISSING_COLUMN:'+t.name+'.'+col.name);
    } catch { issues.push('MISSING_TABLE_SOURCE:'+t.name); }
  }
  for(const d of docs) {
    const name=d.match(/^table (\w+)\s*\{/m)?.[1];
    if(name && !names.has(name)) issues.push('MISSING_METADATA_TABLE:'+name);
  }
  const unmapped = [...physical].filter(t=>!mapped.has(t)).sort();
  return {declared_table_count:tables.length,physical_table_count:physical.size,unmapped_tables:unmapped,
    issues,verified:tables.length===51 && physical.size===51 && !unmapped.length && !issues.length};
}
function checkSources(docs) {
  const hashes = {};
  const candidate_status = [];
  for(const c of manifest.candidates) {
    const local = read(c.path);
    if(digest(local)!==c.candidate_sha256) throw Error('Local candidate hash drift: '+c.path);
    const present = docs.filter(d=>d===normalize(local)).length===1;
    candidate_status.push({path:c.target_path,canonical_source_match:present});
    // This is a manifest content hash, bound by normalized native source equality.
    // The separate export hash is the actual returned native byte hash.
    if(present) hashes[c.target_path]=c.candidate_sha256;
  }
  const known = new Set(), missing = [];
  const replaced = new Map(manifest.candidates.filter(c=>c.baseline_path).map(c=>[c.baseline_path,c.path]));
  for(const f of walk(path.join(ROOT,'backend/xano'))) {
    const baseline = normalize(fs.readFileSync(f,'utf8'));
    known.add(baseline);
    const relative = path.relative(ROOT,f).split(path.sep).join('/');
    const replacement = replaced.get(relative);
    if(!docs.includes(baseline) && !(replacement && docs.includes(normalize(read(replacement))))) missing.push(relative);
  }
  for(const c of manifest.candidates) known.add(normalize(read(c.path)));
  return {source_hashes:hashes,candidates:candidate_status,missing_baseline_resources:missing,
    unexpected_documents:docs.filter(d=>!known.has(d)).map(d=>digest(d))};
}
function walk(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e =>
    e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.xs')?[path.join(dir,e.name)]:[]);
}
function validateInput(name,input) {
  if(!input || typeof input!=='object' || Array.isArray(input)) throw Error('Invalid input');
  if(name==='Milestone1/snapshot' && Object.keys(input).length===0) return;
  if(name!=='Slice1/acceptance') throw Error('Function not allowed by race adapter');
  const keys=['site','claimed_site','resource_site','asset','driver_asset','key','action','weight','body_type','fault','hold_seconds','expect_failure','variant'].sort();
  if(JSON.stringify(Object.keys(input).sort())!==JSON.stringify(keys)) throw Error('Unexpected acceptance input fields');
  if(!['site','claimed_site','resource_site'].every(k=>input[k]==='a') ||
     !['asset','driver_asset'].every(k=>Number.isInteger(input[k])&&input[k]>=0&&input[k]<=11) ||
     typeof input.key!=='string' || !/^m1-[A-Za-z0-9_-]{1,100}$/.test(input.key) ||
     !['execute','inspect'].includes(input.action) || input.weight!==20 ||
     input.body_type!=='closed' || input.fault!=='none' || input.expect_failure!==false ||
     input.variant!=='' || input.hold_seconds!==(input.action==='inspect'?0:2))
    throw Error('Acceptance input exceeds bounded race contract');
}
function createNativeAdapter({token=process.env.XANO_METADATA_TOKEN}={}) {
  if(typeof token!=='string' || !token.trim() || /[\r\n]/.test(token)) throw Error('XANO_METADATA_TOKEN is required');
  let calls=0,active=0,lease=null,lastLiveHash=null,runningPreflight=false;
  async function request(route,{method='GET',body,sandbox=false,allowDenied=false}={}) {
    if(++calls>LIMITS.requests || active>=LIMITS.concurrent) throw Error('Native request budget exceeded');
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),LIMITS.timeout_ms);
    active++;
    let response;
    try {
      response=await fetch(ORIGIN+route,{
        method,redirect:'error',signal:controller.signal,
        headers:{Authorization:'Bearer '+token,Accept:'application/json',
          ...(sandbox?{'X-Tenant':TENANT}:{}),...(body?{'Content-Type':'application/json'}:{})},
        ...(body?{body:JSON.stringify(body)}:{})
      });
      // Do not read or retain any live records. A scope-denial probe needs only status.
      if(allowDenied) {
        await response.body?.cancel();
        return {denied:[401,403].includes(response.status),http_status:response.status};
      }
      if(!response.ok) throw Error('Native HTTP '+response.status);
      const chunks=[];let size=0;
      for await(const chunk of response.body) {
        size+=chunk.byteLength;
        if(size>LIMITS.bytes) {controller.abort();throw Error('Native response too large');}
        chunks.push(chunk);
      }
      const text=Buffer.concat(chunks).toString('utf8');
      if(route.includes('/multidoc?')) return text;
      try{return JSON.parse(text);}catch{throw Error('Malformed native JSON');}
    } catch(error) {
      lease=null;
      // Never echo a response, Authorization header, request body or remote error.
      const safe=/^Native (HTTP \d+|response too large|request budget exceeded)$/.test(error.message);
      throw Error(safe?error.message:'Native transport or response failure; no automatic retry');
    } finally {clearTimeout(timer);active--;}
  }
  async function source(sandbox) {
    return request((sandbox?'/api:meta/sandbox':META)+'/multidoc?branch=v1&env=false&records=false');
  }
  async function run(name,input) {return request(META+'/function/run',{method:'POST',sandbox:true,body:{name,branch:'v1',input}});}
  async function tables() {
    const out=[];let page=1;
    while(page) {
      if(page>5) throw Error('Table pagination limit exceeded');
      const d=await request(META+'/table?page='+page+'&per_page=100',{sandbox:true});
      if(!Array.isArray(d.items) || d.curPage!==page) throw Error('Invalid table page');
      out.push(...d.items);
      if(d.nextPage!==null && (!Number.isInteger(d.nextPage) || d.nextPage<=page)) throw Error('Invalid next table page');
      page=d.nextPage;
    }
    return out;
  }
  return Object.freeze({
    execution_scope:'xano_native',
    async preflight() {
      if(runningPreflight || active) throw Error('Preflight must run alone');
      lease=null;runningPreflight=true;
      try {
        const auth=await request('/api:meta/auth/me');
        if(!Number.isInteger(auth.id) || !auth.extras?.access_token?.scope) throw Error('Invalid authenticated identity');
        const workspace=await request(META);
        if(workspace.id!==1 || workspace.name!=='Zippy Synthetic Prototype' || workspace.branch!=='v1')
          throw Error('Workspace identity mismatch');
        const liveBefore=await source(false), sandboxBefore=await source(true), docs=documents(sandboxBefore);
        // Verify inspected SELECT-only definitions against the pinned repository before POST /run.
        for(const [name,file] of [
          ['Slice1/isolation_probe','backend/xano/function/slice_1/isolation_probe.xs'],
          ['Prototype/inspect_database','backend/xano/function/prototype/inspect_database.xs']
        ]) if(named(docs,'function',name)!==normalize(read(file))) throw Error('Read-only probe source drift: '+name);
        const sourceChecks=checkSources(docs);
        const isolation=resultValue(await run('Slice1/isolation_probe',{}));
        if(isolation.database!==TENANT) throw Error('Sandbox isolation failed');
        const inspection=resultValue(await run('Prototype/inspect_database',{}));
        if(inspection.database!==TENANT) throw Error('Inspection database mismatch');
        const metadata=await tables();
        const mapping=inventory(inspection,metadata,docs),indexes=indexEvidence(inspection,metadata);
        const scope=auth.extras.access_token.scope;
        const expires=Date.parse(auth.extras.expires_at);
        const liveMask=scope['workspace:datasource:live'];
        // Accept only explicit zero. Unrecognized masks/permission models require review.
        const prohibited=Object.entries(scope).filter(([k,v])=>
          (k.startsWith('tenant_center')||k.startsWith('tenant_cluster')||k==='release') && v!==0);
        const scopeRestricted=liveMask===0 && !prohibited.length && Number.isFinite(expires) && expires>Date.now();
        let denial={denied:false,http_status:null,attempted:false};
        if(scopeRestricted) {
          // Existing live starter table 1; discard body even if permissions are unexpectedly broad.
          denial={...await request(META+'/table/1/content?page=1&per_page=1',{allowDenied:true}),attempted:true};
        }
        const sandboxAfter=await source(true),liveAfter=await source(false);
        const stable=sandboxBefore===sandboxAfter && liveBefore===liveAfter;
        lastLiveHash=digest(liveBefore);
        const blockers=[];
        if(!stable) blockers.push('SOURCE_CHANGED_DURING_PREFLIGHT');
        if(!mapping.verified || isolation.physical_table_count!==mapping.physical_table_count) blockers.push('PHYSICAL_INVENTORY_UNRECONCILED');
        if(indexes.some(i=>!i.catalog_definition_observed)) blockers.push('REQUIRED_INDEX_DEFINITIONS_MISSING');
        if(!scopeRestricted || !denial.denied) blockers.push('RESTRICTED_ACCESS_UNVERIFIED');
        if(sourceChecks.candidates.some(c=>!c.canonical_source_match)) blockers.push('CANDIDATES_NOT_IMPORTED_OR_SOURCE_DRIFT');
        if(sourceChecks.unexpected_documents.length || sourceChecks.missing_baseline_resources.length) blockers.push('UNREVIEWED_SANDBOX_SOURCE');
        if(isolation.advisory_lock_available!==true) blockers.push('ADVISORY_LOCK_UNAVAILABLE');
        const report={execution_scope:'xano_native',checked_at:new Date().toISOString(),authenticated:true,
          workspace_id:workspace.id,workspace_name:workspace.name,branch:workspace.branch,database:isolation.database,
          isolation_verified:stable && isolation.database===TENANT && inspection.database===TENANT,
          physical_table_count:mapping.physical_table_count,physical_table_mapping_verified:mapping.verified,
          physical_indexes_verified:indexes.every(i=>i.catalog_definition_observed),
          restricted_access_verified:scopeRestricted && denial.denied,live_source_hash_before:lastLiveHash,
          live_source_hash_after:digest(liveAfter),sandbox_source_hash_before:digest(sandboxBefore),
          sandbox_source_hash_after:digest(sandboxAfter),source_preserved:stable,...sourceChecks,
          inventory:mapping,index_definitions:indexes,
          access:{live_data_scope_mask:liveMask,expiry_verified:Number.isFinite(expires)&&expires>Date.now(),
            expires_at:Number.isFinite(expires)?new Date(expires).toISOString():null,
            prohibited_admin_scopes:prohibited.map(([k])=>k),live_denial_probe:denial},
          blockers,ready:blockers.length===0};
        if(report.ready) lease={until:Math.min(Date.now()+LIMITS.lease_ms,expires)};
        return report;
      } finally {runningPreflight=false;}
    },
    async invoke(name,input) {
      validateInput(name,input);
      if(!lease || Date.now()>=lease.until || runningPreflight) throw Error('Fresh passing native preflight required');
      return run(name,input);
    },
    async preservation() {
      const live=await source(false);
      const result={live_source_hash_after:digest(live),matches_preflight:lastLiveHash===digest(live)};
      if(!result.matches_preflight) lease=null;
      return result;
    }
  });
}
module.exports={createNativeAdapter,documents,resultValue,indexEvidence,inventory,validateInput,LIMITS};
