'use strict';
// Public official-document GETs only. No credentials, instance calls or actions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sources=[
 ['D01','xano-cli/ephemeral.md'],
 ['D02','team-collaboration/role-based-access-control-rbac.md'],
 ['D03','xano-features/metadata-api.md'],
 ['D04','xano-features/metadata-api/token-scopes-reference.md'],
 ['D05','enterprise/enterprise-features/tenant-center.md'],
 ['D06','enterprise/enterprise-features/security-policy.md'],
 ['D07','xano-features/instance-settings/security-policy.md'],
 ['D08','xano-features/instance-settings/direct-database-connector.md'],
 ['D09','xano-cli/sandbox.md'],
 ['D10','xano-cli/tenants.md'],
 ['D11','xanoscript/function-reference/security.md'],
 ['D12','building-backend-features/user-authentication-and-user-data.md'],
 ['D13','security/best-practices.md'],
 ['D14','xano-features/metadata-api/accountapi.md'],
 ['D15','troubleshooting-and-support/plan-comparison-refactor.md'],
 ['D16','https://www.xano.com/pricing/'],
 ['D17','xano-features/instance-settings/static-ip-outgoing.md']
];
async function capture([id,route]){
 const url=route.startsWith('https:')?route:'https://docs.xano.com/'+route,at=new Date().toISOString();
 try{
  const response=await fetch(url,{method:'GET',headers:{Accept:route.endsWith('.md')?'text/markdown,text/plain':'text/html'},redirect:'manual',signal:AbortSignal.timeout(30000)});
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>3000000)throw Error('RESPONSE_LIMIT');
  const file='documents/'+id+(response.headers.get('content-type')?.includes('text/html')?'.html':'.md');
  fs.mkdirSync(path.join(root,'documents'),{recursive:true});fs.writeFileSync(path.join(root,file),bytes,{flag:'wx'});
  return {id,url,accessed_at:at,method:'GET',http_status:response.status,location:response.headers.get('location'),content_type:response.headers.get('content-type'),file,bytes:bytes.length,sha256:hash(bytes),status:response.status===200?'VERIFIED_DOCUMENTATION':'BLOCKED'};
 }catch(e){return {id,url,accessed_at:at,status:'BLOCKED',error_type:e.name,code:e.cause?.code||null};}
}
(async()=>{const results=await Promise.all(sources.map(capture));const receipt={scope:'PUBLIC_OFFICIAL_DOCUMENTATION',as_of:new Date().toISOString(),results,authenticated_instance_requests:0,mutations:0,note:'HTML/redirect/failed responses are preserved as such; they are not plan entitlement or runtime proof.'};fs.writeFileSync(path.join(root,'documentation-receipts.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt,null,2));})().catch(()=>{console.error('PUBLIC_CAPTURE_FAILED');process.exitCode=1;});
