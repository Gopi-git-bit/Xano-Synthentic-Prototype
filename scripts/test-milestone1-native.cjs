'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createNativeAdapter,documents,resultValue,indexEvidence,inventory,validateInput,LIMITS}=require('../backend/milestone1/native-adapter.cjs');
const manifest=require('../backend/milestone1/manifest.json');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.xs')?[path.join(dir,e.name)]:[]);
const baseline=walk(path.join(root,'backend/xano')).map(p=>fs.readFileSync(p,'utf8')).join('\n---\n');
function nativeFixture({imported=false}={}) {
  const tableDocs=documents(baseline).filter(d=>/^table /m.test(d));
  const tables=tableDocs.map((d,i)=>({
    id:i+1,name:d.match(/^table (\w+)/m)[1],guid:d.match(/^\s*guid = "([^"]+)"/m)[1],schema:[{name:'id'}]
  }));
  const physical=tables.map(t=>({name:'mvpw1_'+t.id}));
  const columns=tables.map(t=>({table_name:'mvpw1_'+t.id,column_name:'id'}));
  const indexes=[
    ['idempotency_records','platform_id, operation_scope, idempotency_key',''],
    ['trip_assignments','platform_id, vehicle_id',' WHERE (released_at IS NULL)'],
    ['trip_assignments','platform_id, driver_profile_id',' WHERE (released_at IS NULL)']
  ].map(([name,c,p],i)=>{const table='mvpw1_'+tables.find(t=>t.name===name).id;
    return {tablename:table,indexname:'idx'+i,indexdef:'CREATE UNIQUE INDEX idx'+i+' ON public.'+table+' USING btree ('+c+')'+p};
  });
  let sandbox=baseline;
  if(imported) {
    for(const c of manifest.candidates.filter(c=>c.baseline_path)) sandbox=sandbox.replace(read(c.baseline_path),read(c.path));
    sandbox+='\n---\n'+manifest.candidates.filter(c=>!c.baseline_path).map(c=>read(c.path)).join('\n---\n');
  }
  return {tables,inspection:{database:'sn9m-aat6-200c',tables:physical,indexes,columns},sandbox};
}
const wrap=v=>({result:{status:'ok',result:v}});
const input=()=>({site:'a',claimed_site:'a',resource_site:'a',asset:2,driver_asset:2,key:'m1-unit-test',
 action:'inspect',weight:20,body_type:'closed',fault:'none',hold_seconds:0,expect_failure:false,variant:''});
async function mockNative(options,fn) {
  const fixture=nativeFixture(options),calls=[],original=global.fetch;
  let sandboxReads=0;
  global.fetch=async(url,init)=>{
    calls.push({url,init});
    const u=new URL(url),p=u.pathname;
    if(options.transportError) throw Error('Bearer SECRET_RAW_REMOTE_MESSAGE');
    if(options.redirect) return new Response('',{status:302,headers:{Location:'https://elsewhere.invalid'}});
    const json=v=>new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json'}});
    if(p==='/api:meta/auth/me') return json({id:7,extras:{expires_at:'2099-01-01T00:00:00Z',
      access_token:{scope:{'workspace:datasource:live':options.broad?15:0}}}});
    if(p==='/api:meta/workspace/1') return json({id:1,name:'Zippy Synthetic Prototype',branch:'v1'});
    if(p==='/api:meta/workspace/1/multidoc') return new Response('live fixed source');
    if(p==='/api:meta/sandbox/multidoc') {
      sandboxReads++;let s=fixture.sandbox;
      if(options.probeDrift) s=s.replace('SELECT current_database() AS database','SELECT 1 AS database');
      if(options.changed && sandboxReads>1) s+='\n// unexpected drift';
      if(options.missingDependency) s=documents(s).filter(d=>!d.includes('function "Logistics/validate_order"')).join('\n---\n');
      return new Response(s);
    }
    if(p==='/api:meta/workspace/1/table') return json({curPage:1,nextPage:options.badPage?1:null,items:fixture.tables});
    if(p==='/api:meta/workspace/1/table/1/content') return new Response('NEVER_RETAIN_LIVE_RECORD',{status:options.liveAllowed?200:403});
    if(p==='/api:meta/workspace/1/function/run') {
      const b=JSON.parse(init.body);
      if(b.name==='Slice1/isolation_probe') return json(wrap({database:options.wrongDb?'live':'sn9m-aat6-200c',
        physical_table_count:options.orphans?53:51,advisory_lock_available:true}));
      if(b.name==='Prototype/inspect_database') {
        const i=structuredClone(fixture.inspection);
        if(options.orphans)i.tables.push({name:'mvpw1_56'},{name:'mvpw1_57'});
        if(options.missingIndexes)i.indexes=i.indexes.slice(0,1);
        return json(wrap(JSON.stringify(i)));
      }
      return json(wrap({code:'INSPECT'}));
    }
    throw Error('Unexpected endpoint '+p);
  };
  try {await fn(createNativeAdapter({token:'TEST_TOKEN_NOT_REAL'}),calls,fixture);}
  finally {global.fetch=original;}
}
test('required credential and no arbitrary function/tenant inputs',()=>{
  assert.throws(()=>createNativeAdapter({token:''}));
  assert.throws(()=>createNativeAdapter({token:'x\nheader'}));
  assert.throws(()=>validateInput('Prototype/native_bootstrap',{}));
  assert.throws(()=>validateInput('Slice1/acceptance',{...input(),tenant:'live'}));
  assert.throws(()=>validateInput('Slice1/acceptance',{...input(),hold_seconds:3}));
  assert.throws(()=>validateInput('Slice1/acceptance',{...input(),asset:12}));
  validateInput('Slice1/acceptance',input());
});
test('nested native JSON result accepted; errors and malformed payloads rejected',()=>{
  assert.deepEqual(resultValue(wrap('{"database":"sandbox"}')),{database:'sandbox'});
  for(const v of [{result:{status:'error',result:{}}},wrap('bad'),wrap(null)])assert.throws(()=>resultValue(v));
});
test('index check rejects wrong table, non-unique and wrong predicate',()=>{
  const f=nativeFixture();assert.equal(indexEvidence(f.inspection,f.tables).every(i=>i.catalog_definition_observed),true);
  for(const edit of [i=>i.indexes[1].tablename='other',i=>i.indexes[1].indexdef=i.indexes[1].indexdef.replace('UNIQUE ',''),
    i=>i.indexes[1].indexdef=i.indexes[1].indexdef.replace('IS NULL','IS NOT NULL')]) {
    const i=structuredClone(f.inspection);edit(i);assert.equal(indexEvidence(i,f.tables)[1].catalog_definition_observed,false);
  }
});
test('table mapping requires GUIDs and observed columns, not just count',()=>{
  const f=nativeFixture();assert.equal(inventory(f.inspection,f.tables,documents(f.sandbox)).verified,true);
  f.tables[0].guid='wrong';assert.equal(inventory(f.inspection,f.tables,documents(f.sandbox)).verified,false);
});
test('unimported candidates, broad access, orphans and missing indexes block all invocations',async()=>{
  await mockNative({broad:true,orphans:true,missingIndexes:true},async(a,calls)=>{
    const p=await a.preflight();
    assert.equal(p.ready,false);assert.equal(p.physical_table_count,53);
    assert.deepEqual(p.inventory.unmapped_tables,['mvpw1_56','mvpw1_57']);
    assert.equal(p.blockers.length,4);assert.equal(p.access.live_denial_probe.attempted,false);
    const n=calls.length;await assert.rejects(()=>a.invoke('Slice1/acceptance',input()),/preflight required/);
    assert.equal(calls.length,n);
    assert.ok(!JSON.stringify(p).includes('TEST_TOKEN'));
  });
});
test('passing mocked preflight pins target headers, does not retry and allows bounded runner reads',async()=>{
  await mockNative({imported:true},async(a,calls)=>{
    const p=await a.preflight();assert.deepEqual(p.blockers,[]);assert.equal(p.ready,true);
    await a.invoke('Slice1/acceptance',input());
    const runs=calls.filter(c=>c.url.endsWith('/function/run'));
    for(const c of runs) {
      assert.equal(new URL(c.url).origin,'https://xynd-fnea-khtp.n7e.xano.io');
      assert.equal(c.init.headers['X-Tenant'],'sn9m-aat6-200c');
      assert.equal(JSON.parse(c.init.body).branch,'v1');assert.equal(c.init.redirect,'error');
      assert.equal(c.init.headers.Authorization,'Bearer TEST_TOKEN_NOT_REAL');
    }
    assert.equal((await a.preservation()).matches_preflight,true);
    assert.equal(p.access.live_denial_probe.http_status,403);
    assert.ok(!JSON.stringify(p).includes('NEVER_RETAIN_LIVE_RECORD'));
  });
});
for(const [name,options] of [
  ['source drift during preflight',{changed:true}],['missing dependent function',{missingDependency:true}],
  ['scope claims deny but live request succeeds',{liveAllowed:true}]
]) test(name+' leaves execution locked',async()=>mockNative({imported:true,...options},async(a)=>{
  const p=await a.preflight();assert.equal(p.ready,false);
  await assert.rejects(()=>a.invoke('Milestone1/snapshot',{}));
}));
test('modified read-only probe stops before any function execution',async()=>mockNative({probeDrift:true},async(a,calls)=>{
  await assert.rejects(()=>a.preflight(),/probe source drift/);
  assert.equal(calls.filter(c=>c.url.endsWith('/function/run')).length,0);
}));
test('wrong database stops before physical inspection',async()=>mockNative({wrongDb:true},async(a,calls)=>{
  await assert.rejects(()=>a.preflight(),/isolation failed/);
  assert.equal(calls.filter(c=>c.url.endsWith('/function/run')).length,1);
}));
test('pagination loops fail closed',async()=>mockNative({badPage:true},async(a)=>{
  await assert.rejects(()=>a.preflight(),/next table page/);
}));
test('transport failures redact remote messages and never retry',async()=>mockNative({transportError:true},async(a,calls)=>{
  await assert.rejects(()=>a.preflight(),e=>!e.message.includes('SECRET')&&e.message.includes('no automatic retry'));
  assert.equal(calls.length,1);
}));
test('redirect responses cannot count as authentication',async()=>mockNative({redirect:true},async(a,calls)=>{
  await assert.rejects(()=>a.preflight(),/HTTP 302/);assert.equal(calls.length,1);
}));
test('request body byte ceiling stops oversized exports',async()=>{
  const original=global.fetch;
  global.fetch=async()=>new Response('x'.repeat(LIMITS.bytes+1));
  try {await assert.rejects(()=>createNativeAdapter({token:'TEST'}).preservation(),/too large/);}
  finally {global.fetch=original;}
});
