'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
async function main(){
 const yaml=require('C:/Users/ashok/AppData/Roaming/npm/node_modules/@xano/cli/node_modules/js-yaml');
 const c=yaml.load(fs.readFileSync('C:/Users/ashok/.xano/credentials.yaml','utf8')),p=c.profiles[c.default];
 assert.equal(p.instance_origin,'https://xynd-fnea-khtp.n7e.xano.io');assert.equal(p.workspace,3);
 const url=p.instance_origin+'/api:meta/workspace/3/datasource';
 const r=await fetch(url,{headers:{Authorization:'Bearer '+p.access_token},redirect:'error',signal:AbortSignal.timeout(20000)}),text=await r.text();assert.equal(r.status,200);
 const body=JSON.parse(text).map(({label,color})=>({label,color}));
 const receipt={method:'GET',url,status:r.status,at:new Date().toISOString(),raw_sha256:crypto.createHash('sha256').update(text).digest('hex'),body};
 fs.writeFileSync(__dirname+'/data-sources-corrected.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
}
main().catch(e=>{console.error(e.name);process.exitCode=1;});
