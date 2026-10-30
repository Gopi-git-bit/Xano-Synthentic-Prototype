'use strict';
// Public documentation only; never forwards instance credentials to account APIs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
(async()=>{
 const url='https://docs.xano.com/xano-features/metadata-api/account_api/get-instance.md',accessed_at=new Date().toISOString();
 const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(30000)}),b=Buffer.from(await r.arrayBuffer());
 const file='documents/D18.md';fs.writeFileSync(path.join(__dirname,file),b,{flag:'wx'});
 const receipt={id:'D18',url,accessed_at,method:'GET',http_status:r.status,file,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex'),status:r.status===200?'VERIFIED_DOCUMENTATION':'BLOCKED',authenticated_instance_requests:0};
 fs.writeFileSync(path.join(__dirname,'account-documentation-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt,null,2));
})().catch(e=>{console.error(e.name);process.exitCode=1;});
