import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGateway} from './gateway.mjs';
const now=Date.parse('2026-10-28T11:00:00Z');
const env={XANO_AUTH_BASE_URL:'https://xano.example/api:auth',XANO_LOGISTICS_BASE_URL:'https://xano.example/api:reads',XANO_AUTH_RELEASE:'verified',XANO_BOOKING_READS_RELEASE:'verified',VERCEL_ENV:'preview',XANO_PREVIEW_TENANT:'test-only-1234',XANO_PREVIEW_EXPIRES_AT:'2026-10-28T13:00:00Z'};
test('Preview routes only to its server-selected test environment',async()=>{
  const calls=[];
  const handle=createGateway({env,now:()=>now,fetchImpl:async(url,init)=>{calls.push({url,headers:new Headers(init.headers)});return new Response(JSON.stringify({id:7,name:'Test',email:'test@example.invalid',system_role:'customer_member',status:'active',active_organization_id:1}));}});
  const r=await handle({url:'/api/auth/me',headers:new Headers({Authorization:'Bearer synthetic','X-Tenant':'attacker'})});
  assert.equal(r.status,200);assert.equal(calls.length,1);assert.equal(calls[0].headers.get('X-Tenant'),'test-only-1234');
  assert.equal(calls[0].headers.get('Authorization'),'Bearer synthetic');
});
test('test connection fails closed in production, when expired, or when malformed',async()=>{
  for(const override of [{VERCEL_ENV:'production'},{XANO_PREVIEW_EXPIRES_AT:'2026-10-28T10:00:00Z'},{XANO_PREVIEW_EXPIRES_AT:''},{XANO_PREVIEW_TENANT:'bad\r\nheader'},{XANO_PREVIEW_TENANT:''}]){
    let calls=0;const handle=createGateway({env:{...env,...override},now:()=>now,fetchImpl:async()=>{calls++;throw Error('must not fetch');}});
    const status=await handle({url:'/api/status'});assert.equal(status.data.authenticationAvailable,false);assert.equal(status.data.bookingReadsAvailable,false);
    const r=await handle({url:'/api/auth/me',headers:new Headers({Authorization:'Bearer synthetic'})});assert.equal(r.status,503);assert.equal(calls,0);
  }
});
test('live configuration does not send a test routing header',async()=>{
  let headers;const handle=createGateway({env:{...env,VERCEL_ENV:'production',XANO_PREVIEW_TENANT:undefined,XANO_PREVIEW_EXPIRES_AT:undefined},fetchImpl:async(url,init)=>{headers=new Headers(init.headers);return new Response('{}',{status:401});}});
  assert.equal((await handle({url:'/api/auth/me',headers:new Headers({Authorization:'Bearer synthetic','X-Tenant':'attacker'})})).status,401);
  assert.equal(headers.has('X-Tenant'),false);
});
