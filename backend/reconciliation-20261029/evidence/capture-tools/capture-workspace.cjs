'use strict';
// GET-only schema/code inspection. No records, environment values, SQL or hosted runs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=__dirname,origin='https://xynd-fnea-khtp.n7e.xano.io',base=origin+'/api:meta',spec=JSON.parse(fs.readFileSync(path.join(root,'metadata-openapi.json'),'utf8'));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const save=(p,x)=>{const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(x,null,2)+'\n',{flag:'wx'});};
const yaml=require('C:/Users/ashok/AppData/Roaming/npm/node_modules/@xano/cli/node_modules/js-yaml');
const cfg=yaml.load(fs.readFileSync(process.env.XANO_CONFIG||'C:/Users/ashok/.xano/credentials.yaml','utf8')),profile=cfg.profiles[cfg.default];
assert.equal(profile.instance_origin.replace(/\/$/,''),origin);assert.equal(profile.workspace,3);const token=profile.access_token;
const reads=[];
function clean(v,k=''){
 if(/password|secret|credential|access_token|authToken|cookie|authorization|private_key|api_key/i.test(k)&&typeof v!=='number')return '[REDACTED]';
 if(typeof v==='string')return v.split(token).join('[REDACTED]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[REDACTED_EMAIL]').replace(/https?:\/\/\S*(?:impersonat|_ti=)\S*/gi,'[REDACTED_URL]');
 return Array.isArray(v)?v.map(x=>clean(x)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([key,x])=>[key,clean(x,key)])):v;
}
async function get(label,route,project){
 assert.ok(!/\/content|\/env|\/sandbox|\/run|impersonat|\/log(?:\/|\?)/.test(route));
 const start=new Date().toISOString(),r=await fetch(base+route,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)}),text=await r.text();
 let data;try{data=JSON.parse(text);}catch{data=null;}
 const receipt={label,method:'GET',url:base+route,status:r.status,started_at:start,finished_at:new Date().toISOString(),raw_sha256:hash(text)};reads.push(receipt);
 if(label.endsWith('-export')&&r.status===200){
  assert.ok(text.includes('workspace '));assert.ok(!text.includes(token));assert.ok(!/\beyJ[A-Za-z0-9_.-]{40,}|\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}/.test(text),'SOURCE_SECRET_PATTERN');
  fs.writeFileSync(path.join(root,label+'.xs'),text,{flag:'wx'});save(label+'.json',receipt);
 }else save(label+'.json',{...receipt,body:clean(project?project(data):data)});
 console.log(JSON.stringify({label,status:r.status,keys:data&&typeof data==='object'?Object.keys(data):[],bytes:text.length}));
 return {data,status:r.status,text};
}
async function main(){
 fs.writeFileSync(path.join(root,'capture.once'),new Date().toISOString(),{flag:'wx'});
 await get('effective-identity','/auth/me',d=>({id:d.id,instance_id:d.extras?.instance?.id,instance_name:d.extras?.instance?.name,role:d.extras?.instance?.membership?.role,role_permissions:d.extras?.instance?.membership?.rolePermissions,token_metadata:typeof d.extras?.access_token==='object'?d.extras.access_token:{shape:typeof d.extras?.access_token},expires_at:d.extras?.expires_at}));
 const w=await get('workspace-3','/workspace/3');assert.equal(w.status,200);assert.equal(w.data.id,3);assert.equal(w.data.name,'Zippy Synthetic Prototype_1');
 await get('branches','/workspace/3/branch');await get('data-sources','/workspace/3/datasource',d=>Array.isArray(d)?d.map(x=>({id:x.id,name:x.name,type:x.type,branch:x.branch,enabled:x.enabled,field_names:Object.keys(x)})):d);
 await get('tenants','/workspace/3/tenant?page=1&per_page=100');await get('ephemerals','/workspace/3/ephemeral?page=1&per_page=100');
 for(const draft of [false,true])await get(draft?'draft-export':'published-export','/workspace/3/multidoc?branch=v1&env=false&records=false&include_draft='+draft);
 const tables=await get('tables','/workspace/3/table?page=1&per_page=100&sort=name&order=asc');assert.equal(tables.status,200);
 const groups=await get('api-groups','/workspace/3/apigroup?branch=v1&page=1&per_page=100');assert.equal(groups.status,200);
 const items=Array.isArray(groups.data)?groups.data:groups.data.items;assert.ok(Array.isArray(items));assert.ok(!groups.data.nextPage);
 for(const g of items){assert.ok(Number.isSafeInteger(g.id));await get('group-'+g.id+'-openapi','/workspace/3/apigroup/'+g.id+'/openapi');}
 for(const type of ['function','workflow_test','task','middleware','agent','table/trigger','agent/trigger']){
  const operation=spec.paths['/workspace/{workspace_id}/'+type]?.get;assert.ok(operation);
  const params=new URLSearchParams({branch:'v1',page:'1',per_page:'100'});if(operation.parameters.some(p=>p.name==='include_draft'))params.set('include_draft','true');
  await get(type.replace('/','-')+'-inventory','/workspace/3/'+type+'?'+params);
 }
 save('capture-ledger.json',{at:new Date().toISOString(),workspace:3,branch:'v1',reads,metadata_writes:0,record_reads:0,application_requests:0,hosted_runs:0});
}
main().catch(e=>{save('capture-stop.json',{at:new Date().toISOString(),name:e.name,code:e.cause?.code||null,reads,message:'READ_ONLY_CAPTURE_STOPPED; no raw error/body retained'});console.error('READ_ONLY_CAPTURE_STOPPED '+e.name);process.exitCode=1;});
