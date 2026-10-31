'use strict';
// Read-only Metadata API discovery. Never loads or requests application records.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=__dirname,origin='https://xynd-fnea-khtp.n7e.xano.io';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const save=(p,x)=>fs.writeFileSync(path.join(root,p),JSON.stringify(x,null,2)+'\n',{flag:'wx'});
async function main(){
 fs.writeFileSync(path.join(root,'discovery.once'),new Date().toISOString(),{flag:'wx'});
 const response=await fetch(origin+'/apispec:meta?type=json',{redirect:'error',signal:AbortSignal.timeout(30000)}),text=await response.text();assert.equal(response.status,200);
 const spec=JSON.parse(text);save('metadata-openapi.json',spec);save('spec-receipt.json',{url:origin+'/apispec:meta?type=json',status:response.status,sha256:hash(text),at:new Date().toISOString()});
 const wanted=Object.entries(spec.paths).filter(([p])=>/^\/auth\/|^\/workspace$|^\/workspace\/\{workspace_id\}$|^\/workspace\/\{workspace_id\}\/(branch|datasource|apigroup|table|function|workflow_test|task|middleware|agent|tenant|multidoc)(\/[^/]+)?$/.test(p));
 console.log(JSON.stringify(wanted.map(([p,ops])=>({path:p,gets:ops.get?{summary:ops.get.summary,parameters:ops.get.parameters}:null})).filter(x=>x.gets),null,2));
 const yaml=require('C:/Users/ashok/AppData/Roaming/npm/node_modules/@xano/cli/node_modules/js-yaml');
 const cfg=yaml.load(fs.readFileSync(process.env.XANO_CONFIG||'C:/Users/ashok/.xano/credentials.yaml','utf8')),p=cfg.profiles[cfg.default];assert.equal(p.instance_origin.replace(/\/$/,''),origin);assert.equal(p.workspace,3);assert.ok(p.access_token);
 const token=p.access_token;
 function clean(v,key=''){
  if(/email|first_name|last_name|full_name|avatar|photo/i.test(key))return '[REDACTED_IDENTITY_PII]';
  if(/token|secret|password|credential|cookie|authorization/i.test(key)&&!/(scope|expir|permission|type)/i.test(key))return '[REDACTED]';
  if(typeof v==='string')return v.split(token).join('[REDACTED]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[REDACTED_EMAIL]').replace(/https?:\/\/\S*(?:impersonat|_ti=)\S*/gi,'[REDACTED_URL]');
  return Array.isArray(v)?v.map(x=>clean(x)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,clean(x,k)])):v;
 }
 for(const [label,route]of [['identity','/auth/me'],['workspaces','/workspace']]){
  assert.ok(spec.paths[route]?.get);const url=origin+'/api:meta'+route;
  const r=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)}),raw=await r.text();let data;try{data=JSON.parse(raw);}catch{data={non_json:true};}
  const safe=clean(data);save(label+'.json',{method:'GET',url,status:r.status,at:new Date().toISOString(),body:safe});
  console.log(JSON.stringify({label,status:r.status,keys:Object.keys(data||{}),body:label==='workspaces'?safe:undefined},null,2));if(r.status!==200)break;
 }
}
main().catch(e=>{console.error(JSON.stringify({error:e.name,code:e.cause?.code||null,message:'READ_ONLY_DISCOVERY_STOPPED'}));process.exitCode=1;});
