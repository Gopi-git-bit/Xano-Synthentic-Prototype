'use strict';
// P0 only: explicit profile/workspace, fixed GET allowlist, no records or secrets.
// Writes new, unsealed receipts; never invokes impersonation, preview or import.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const argv=process.argv.slice(2),args={};
for(let i=0;i<argv.length;i+=2){assert.ok(/^--[a-z-]+$/.test(argv[i])&&argv[i+1]);assert.ok(!Object.hasOwn(args,argv[i]));args[argv[i]]=argv[i+1];}
assert.deepEqual(Object.keys(args).sort(),['--branch','--cli-root','--credentials','--out','--profile','--workspace'].sort());
assert.equal(args['--workspace'],'3');assert.equal(args['--branch'],'v1');
const root=path.resolve(__dirname,'..'),out=path.resolve(args['--out']),origin='https://xynd-fnea-khtp.n7e.xano.io';
assert.ok(!fs.existsSync(out),'NEW_OUTPUT_REQUIRED');fs.mkdirSync(out,{recursive:true});
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const yaml=require(path.join(path.resolve(args['--cli-root']),'node_modules/js-yaml'));
const cfg=yaml.load(fs.readFileSync(args['--credentials'],'utf8')),profile=cfg.profiles[args['--profile']];
assert.equal(profile?.instance_origin,origin);assert.equal(profile.workspace,3);assert.ok(!profile.insecure);assert.ok(profile.access_token);
const token=profile.access_token;
const ledger=[],report={started_at:new Date().toISOString(),scope:'READ_ONLY_P0',status:'BLOCKED',approval:'NOT_APPROVED',profile:args['--profile'],workspace:3,source_branch:'v1',instance:origin,tenant:null,database_identity:null,parent_database_identity:null,ledger,metadata_writes:0,record_reads:0,environment_value_reads:0,credential_minting:0,application_requests:0};
function save(name,value){const text=JSON.stringify(value,null,2)+'\n';assert.ok(!text.includes(token));fs.writeFileSync(path.join(out,name),text,{flag:'wx'});}
const routes=new Set(['/apispec:meta?type=json','/api:meta/auth/me','/api:meta/workspace/3','/api:meta/workspace/3/branch','/api:meta/workspace/3/datasource','/api:meta/workspace/3/tenant?page=1&per_page=100','/api:meta/workspace/3/ephemeral?page=1&per_page=100',...['false','true'].map(x=>'/api:meta/workspace/3/multidoc?branch=v1&env=false&records=false&include_draft='+x),...['task','table/trigger','agent/trigger'].map(x=>'/api:meta/workspace/3/'+x+'?branch=v1&page=1&per_page=100')]);
async function get(route){
 assert.ok(routes.has(route));const start=new Date().toISOString();
 const response=await fetch(origin+route,{method:'GET',headers:route.startsWith('/api:meta/')?{Authorization:'Bearer '+token,Accept:'application/json'}:{},redirect:'error',signal:AbortSignal.timeout(30000)});
 const reader=response.body.getReader();let size=0;const chunks=[];
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;assert.ok(size<=12000000,'RESPONSE_TOO_LARGE');chunks.push(Buffer.from(value));}
 const text=Buffer.concat(chunks).toString('utf8');ledger.push({method:'GET',route,status:response.status,started_at:start,finished_at:new Date().toISOString(),bytes:size,response_sha256:hash(text)});assert.equal(response.status,200,'METADATA_GET_FAILED');return text;
}
const json=async route=>JSON.parse(await get(route));
function inventory(text){
 const documents=text.replace(/\r\n/g,'\n').split('\n---\n').filter(x=>x.trim()).map(x=>{
  const source=x.trim(),m=source.match(/^(\w+)\s+(?:"([^"]+)"|([^\s{]+))([^\n]*)/m);assert.ok(m);
  const type=m[1],name=m[2]||m[3],verb=m[4].match(/verb=(\w+)/)?.[1],group=source.match(/^\s*api_group\s*=\s*"([^"]+)"/m)?.[1];
  return {key:[type,name,...(verb?[verb,group]:[])].join(':'),type,name,verb,group,guid:source.match(/^\s*guid\s*=\s*"([^"]+)"/m)?.[1],sha256:hash(source)};
 }).sort((a,b)=>a.key.localeCompare(b.key));
 return {count:documents.length,counts:documents.reduce((a,d)=>(a[d.type]=(a[d.type]||0)+1,a),{}),inventory_sha256:hash(documents.map(d=>d.key+'\t'+d.sha256).join('\n')),documents};
}
function list(value){const items=Array.isArray(value)?value:value.items;assert.ok(Array.isArray(items));assert.ok(!value.nextPage,'INCOMPLETE_INVENTORY');return {count:items.length,nextPage:value.nextPage??null,items:items.map(x=>({id:x.id,name:x.name,state:x.state,ephemeral:x.ephemeral,expires_at:x.ephemeral_expires_at}))};}
function numericMap(value){return Object.fromEntries(Object.entries(value||{}).filter(([,v])=>typeof v==='number'||typeof v==='boolean'));}
async function main(){
 const spec=await json('/apispec:meta?type=json');
 const relevant=Object.entries(spec.paths).filter(([p])=>/\/ephemeral|\/tenant(?:\/|$)|\/role|\/permission|\/instance|\/auth\/me/.test(p));
 save('metadata-capabilities.json',{paths:relevant.map(([route,methods])=>({route,operations:Object.fromEntries(Object.entries(methods).filter(([m])=>['get','post','put','patch','delete'].includes(m)).map(([m,v])=>[m,{summary:v.summary,description:v.description,parameters:v.parameters,request_schema:v.requestBody?.content?.['application/json']?.schema,response_schema:v.responses?.['200']?.content?.['application/json']?.schema}]))})),note:'Specification presence is not plan entitlement. Impersonation GETs mint credentials and were not called.'});
 const identity=await json('/api:meta/auth/me'),instance=identity.extras?.instance;
 report.identity={principal_id:identity.id,instance_id:instance?.id,role:instance?.membership?.role,role_permissions:numericMap(instance?.membership?.rolePermissions),effective_scope:numericMap(identity.extras?.access_token?.scope),expires_at:identity.extras?.expires_at};
 // Field names expose capability discovery opportunities without retaining account data.
 report.identity_metadata_fields={extras:Object.keys(identity.extras||{}),instance:Object.keys(instance||{}),membership:Object.keys(instance?.membership||{})};
 const workspace=await json('/api:meta/workspace/3');assert.equal(workspace.id,3);assert.equal(workspace.name,'Zippy Synthetic Prototype_1');assert.equal(workspace.branch,'v1');assert.equal(instance?.id,9940);
 report.workspace_metadata={id:workspace.id,name:workspace.name,branch:workspace.branch,field_names:Object.keys(workspace)};
 report.branches=(await json('/api:meta/workspace/3/branch')).map(({label,live})=>({label,live}));
 report.datasources=(await json('/api:meta/workspace/3/datasource')).map(({id,label,name,type})=>({id,label,name,type}));
 report.tenants=list(await json('/api:meta/workspace/3/tenant?page=1&per_page=100'));
 report.ephemerals=list(await json('/api:meta/workspace/3/ephemeral?page=1&per_page=100'));
 const inventories={};
 for(const [mode,draft] of [['published',false],['draft',true]]){
  const text=await get('/api:meta/workspace/3/multidoc?branch=v1&env=false&records=false&include_draft='+draft);
  inventories[mode]=inventory(text);save(mode+'-inventory.json',inventories[mode]);
  const previous=JSON.parse(fs.readFileSync(path.join(root,'backend/reconciliation-20261029/evidence',mode+'-inventory.json')));
  report[mode]={count:inventories[mode].count,counts:inventories[mode].counts,inventory_sha256:inventories[mode].inventory_sha256,unchanged_from_reconciliation:inventories[mode].inventory_sha256===previous.inventory_sha256};
  if(mode==='published')report.published_application_token_ttl_seconds=Number(text.split('\n---\n').find(d=>/^query "auth\/login"/m.test(d))?.match(/expiration\s*=\s*(\d+)/)?.[1])||null;
 }
 const a=new Map(inventories.published.documents.map(d=>[d.key,d]));
 save('published-draft-diff.json',{changed:inventories.draft.documents.filter(d=>a.get(d.key)?.sha256!==d.sha256).map(d=>({key:d.key,published_sha256:a.get(d.key)?.sha256||null,draft_sha256:d.sha256})),missing_in_draft:inventories.published.documents.filter(d=>!inventories.draft.documents.some(x=>x.key===d.key)).map(d=>d.key)});
 for(const type of ['task','table/trigger','agent/trigger'])report[type]=list(await json('/api:meta/workspace/3/'+type+'?branch=v1&page=1&per_page=100'));
 report.discovery_status='VERIFIED';
}
main().catch(e=>{report.discovery_status='FAILED';report.stop={code:/^[A-Z_]+$/.test(e.code||'')?e.code:'READ_ONLY_DISCOVERY_STOPPED',error_type:e.name};process.exitCode=1;}).finally(()=>{report.finished_at=new Date().toISOString();save('discovery.json',report);console.log(JSON.stringify(report,null,2));});
