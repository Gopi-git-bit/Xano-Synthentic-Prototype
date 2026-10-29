'use strict';
// Targeted GET-only capability discovery. No impersonation, secrets or record routes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const [credentials,yamlModule,out]=process.argv.slice(2);assert.ok(out,'Supply credentials path, js-yaml module and new receipt path');
const origin='https://xynd-fnea-khtp.n7e.xano.io';
const cfg=require(path.resolve(yamlModule)).load(fs.readFileSync(credentials,'utf8')),profile=cfg.profiles[cfg.default];
assert.equal(profile.instance_origin,origin);assert.equal(profile.workspace,3);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
 const ledger=[];
 async function get(route,auth=true){
  const url=origin+(auth?'/api:meta':'')+route;
  const r=await fetch(url,{method:'GET',headers:auth?{Authorization:'Bearer '+profile.access_token}:{},redirect:'error',signal:AbortSignal.timeout(20000)});
  const text=await r.text();ledger.push({method:'GET',route,status:r.status,sha256:hash(text),at:new Date().toISOString()});assert.equal(r.status,200);return JSON.parse(text);
 }
 const spec=await get('/apispec:meta?type=json',false);
 const paths=['/workspace/{workspace_id}/ephemeral','/workspace/{workspace_id}/tenant/{tenant_name}','/workspace/{workspace_id}/tenant/{tenant_name}/multidoc','/workspace/{workspace_id}/tenant/{tenant_name}/multidoc/dry-run','/workspace/{workspace_id}/tenant/{tenant_name}/impersonate'];
 const capabilities=Object.fromEntries(paths.map(p=>[p,Object.fromEntries(Object.entries(spec.paths[p]||{}).filter(([k])=>['get','post','put','patch','delete'].includes(k)).map(([method,v])=>[method,{summary:v.summary,parameters:v.parameters,request_schema:v.requestBody?.content?.['application/json']?.schema}]))]));
 const identity=await get('/auth/me'),workspace=await get('/workspace/3'),branches=await get('/workspace/3/branch'),datasources=await get('/workspace/3/datasource');
 const tenants=await get('/workspace/3/tenant?page=1&per_page=100'),ephemerals=await get('/workspace/3/ephemeral?page=1&per_page=100');
 assert.equal(workspace.id,3);assert.equal(workspace.branch,'v1');
 const list=x=>({curPage:x.curPage,nextPage:x.nextPage,items:x.items.map(t=>({name:t.name,state:t.state,ephemeral:t.ephemeral,expires_at:t.ephemeral_expires_at}))});
 const report={at:new Date().toISOString(),workspace:{id:3,name:workspace.name,branch:workspace.branch},branches:branches.map(({label,live})=>({label,live})),datasources:datasources.map(({label})=>({label})),identity:{role:identity.extras?.instance?.membership?.role,expires_at:identity.extras?.expires_at,live_datasource_scope:identity.extras?.access_token?.scope?.['workspace:datasource:live']},tenants:list(tenants),ephemerals:list(ephemerals),capabilities,ledger,metadata_writes:0,record_reads:0,credential_minting:0,application_requests:0,status:'PROVISIONING_NOT_APPROVED'};
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({workspace:report.workspace,branches:report.branches,datasources:report.datasources,identity:report.identity,tenant_count:tenants.items.length,ephemeral_count:ephemerals.items.length,requests:ledger.length,mutations:0}));
}
main().catch(e=>{console.error('READ_ONLY_DISCOVERY_STOPPED '+e.name);process.exitCode=1;});
