'use strict';
const c=require('./client.cjs');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const tests=[];
const auth='/api:zippy-customer-draft-auth';
const api='/api:zippy-customer-drafts';
const run=crypto.randomUUID();
const secrets=[];
let tables;
const request=(route,method='GET',body,token)=>c.request(route,method,body,{runtime:true,token});
function clean(value){const text=JSON.stringify(value);for(const secret of secrets)assert.ok(!text.includes(secret),'Sensitive output');assert.ok(!/"(?:password|password_reset|gateway_response|otp_code|claim_token|private_storage_key)"\s*:/.test(text));}
async function test(label,fn){
  try{await fn();tests.push({label,passed:true});}
  catch(e){tests.push({label,passed:false,assertion:e.code||'ASSERTION_FAILED'});console.error('FAIL: '+label+' ('+(e.code||e.name)+')');}
}
async function rows(name){const r=await c.ok('/table/'+tables[name]+'/content?per_page=100');assert.ok(!r.nextPage,'Fixture suite exceeds one page');return Array.isArray(r)?r:r.items;}
async function snapshot(){const result={};for(const name of Object.keys(tables).sort()){const data=(await rows(name)).sort((a,b)=>a.id-b.id);result[name]={count:data.length,sha256:crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')};}return result;}
async function edit(name,id,data){return c.ok('/table/'+tables[name]+'/content/'+id,'PUT',data);}
function registration(label){const password=crypto.randomBytes(24).toString('hex')+'Ab1!';secrets.push(password);return {name:'Synthetic '+label,email:'customer-'+run+'-'+label+'@example.invalid',password,organization_name:'Synthetic org '+label};}
async function register(input){const r=await request(auth+'/auth/register','POST',input);assert.equal(r.status,200,'Registration must succeed');clean(r.data);return r.data;}
async function login(input){const r=await request(auth+'/auth/login','POST',{email:input.email,password:input.password});assert.equal(r.status,200,'Login must succeed');assert.ok(r.data.authToken);secrets.push(r.data.authToken);return r.data.authToken;}
function draft(){const day=86400000,now=Date.now();return {request_id:crypto.randomUUID(),pickup_city:'Synthetic Origin',pickup_street:'Synthetic pickup',delivery_city:'Synthetic Destination',delivery_street:'Synthetic dropoff',pickup_window_start:now+day,pickup_window_end:now+day+3600000,delivery_window_start:now+2*day,delivery_window_end:now+2*day+3600000};}
function denied(r,code=403){assert.equal(r.status,code);assert.ok(r.data.code);clean(r.data);}
async function main(){
  const isolation=await c.verify();
  tables=Object.fromEntries((await c.list('table')).map(t=>[t.name,t.id]));
  const groups=await c.list('apigroup','&include_xanoscript=true');
  const endpoints=[];
  for(const g of groups){
    const list=await c.list('apigroup/'+g.id+'/api','&include_xanoscript=true');
    for(const q of list)endpoints.push({id:q.id,group_id:g.id,name:q.name,verb:q.verb,auth:q.auth,xanoscript:q.xanoscript});
  }
  await test('readback: 34 schemas, two groups, seven concrete HTTP endpoints, two guards',async()=>{
    assert.equal(Object.keys(tables).length,34);assert.equal(groups.length,2);assert.equal(endpoints.length,7);
    assert.equal((await c.list('function')).length,2);
    for(const g of groups)assert.match(g.xanoscript.value,/history = 0/);
    for(const q of endpoints){assert.equal(q.xanoscript.status,'ok');if(!['auth/register','auth/login'].includes(q.name))assert.match(q.xanoscript.value,/auth = "user"/);}
    for(const kind of ['tool','agent','task'])assert.equal((await c.list(kind)).length,0);
  });
  const aInput=registration('a'),bInput=registration('b');
  const start=await snapshot();
  const a=await register(aInput),b=await register(bInput);
  const aToken=await login(aInput),bToken=await login(bInput);
  await test('registration: exact contract, no token, new customer org and owner membership',async()=>{
    assert.deepEqual(Object.keys(a).sort(),['user_id','organization_id','system_role','status','booking_scope','approval_request_id','verification_state'].sort());
    assert.equal(a.system_role,'customer_admin');assert.equal(a.status,'active');assert.equal(a.booking_scope,'draft_only');assert.equal(a.verification_state,'pending_human_review');
    const users=await rows('user'),orgs=await rows('organization'),members=await rows('organization_member'),reviews=await rows('approval_request');
    const user=users.find(u=>u.id===a.user_id),org=orgs.find(o=>o.id===a.organization_id),member=members.find(m=>m.user_id===a.user_id);
    assert.equal(user.active_organization_id,org.id);assert.equal(user.role,'member');assert.notEqual(user.password,aInput.password);
    assert.equal(org.type,'customer');assert.equal(org.kyb_verified,false);assert.equal(member.organization_id,org.id);assert.equal(member.member_role,'owner');assert.equal(member.is_active,true);
    const review=reviews.find(r=>r.id===a.approval_request_id);assert.equal(review.request_type,'customer_onboarding');assert.equal(review.status,'pending');
    const after=await snapshot();for(const table of ['user','organization','organization_member','approval_request','audit_log'])assert.equal(after[table].count,start[table].count+2);
  });
  await test('duplicate normalized email rolls back previously inserted organization',async()=>{
    const before=await snapshot();const r=await request(auth+'/auth/register','POST',{...aInput,email:aInput.email.toUpperCase()});denied(r);
    assert.equal(r.data.message,'Registration could not be completed.');assert.deepEqual(await snapshot(),before);
  });
  await test('concurrent registration: exactly one identity/org/membership/review/audit',async()=>{
    const input=registration('race'),before=await snapshot();
    const results=await Promise.all([1,2,3].map(()=>request(auth+'/auth/register','POST',input)));
    assert.equal(results.filter(r=>r.status===200).length,1);assert.ok(results.every(r=>[200,403].includes(r.status)));
    const after=await snapshot();for(const table of ['user','organization','organization_member','approval_request','audit_log'])assert.equal(after[table].count,before[table].count+1);
  });
  for(const [label,change,status]of [
    ['requested platform role',{requested_system_role:'super_admin'},403],
    ['forged organization membership',{organization_id:b.organization_id},400],
    ['forged system role',{system_role:'super_admin'},400],
    ['blank name',{name:'   '},400],['invalid email',{email:'not-email'},400],['short password',{password:'a1'},400],['missing organization name',{organization_name:null},400]
  ])await test('registration rejects '+label,async()=>{const before=await snapshot();const r=await request(auth+'/auth/register','POST',{...registration('bad'),...change});denied(r,status);assert.deepEqual(await snapshot(),before);});
  await test('database password policy failure rolls back organization',async()=>{const before=await snapshot();const r=await request(auth+'/auth/register','POST',{...registration('weak'),password:'abcdefghijk'});denied(r);assert.deepEqual(await snapshot(),before);});
  await test('login wrong password and unknown account use equivalent denial',async()=>{
    const wrong=await request(auth+'/auth/login','POST',{email:aInput.email,password:'wrong-secret-1'}),missing=await request(auth+'/auth/login','POST',{email:'absent-'+run+'@example.invalid',password:'wrong-secret-1'});
    denied(wrong,401);denied(missing,401);assert.deepEqual(wrong.data,missing.data);
  });
  await test('auth/me has gateway identity fields and no private profile data',async()=>{const r=await request(auth+'/auth/me','GET',undefined,aToken);assert.equal(r.status,200);clean(r.data);assert.deepEqual(Object.keys(r.data).sort(),['id','name','email','system_role','status','active_organization_id'].sort());assert.equal(r.data.active_organization_id,a.organization_id);});
  await test('membership is server-owned and review pending does not grant KYB',async()=>{const r=await request(auth+'/organization/membership','GET',undefined,aToken);assert.equal(r.status,200);assert.equal(r.data.membership.user_id,a.user_id);assert.equal(r.data.membership.member_role,'owner');assert.equal(r.data.organization.kyb_verified,false);clean(r.data);});
  await test('foreign organization selector denied on membership and booking list',async()=>{for(const route of [auth+'/organization/membership?requested_org_id='+b.organization_id,api+'/bookings?requested_org_id='+b.organization_id])denied(await request(route,'GET',undefined,aToken));});
  const aDraft=draft(),bDraft=draft();
  const created=await request(api+'/bookings','POST',aDraft,aToken);assert.equal(created.status,200,'Draft must succeed');
  const foreign=await request(api+'/bookings','POST',bDraft,bToken);assert.equal(foreign.status,200);
  const id=created.data.booking.id;
  await test('draft creation: immutable server identity, draft state, zero amounts, no active quote',async()=>{
    clean(created.data);assert.equal(created.data.draft_only,true);assert.equal(created.data.execution_enabled,false);
    const row=(await rows('customer_booking')).find(r=>r.id===id);
    assert.equal(row.customer_organization_id,a.organization_id);assert.equal(row.booked_by_user_id,a.user_id);assert.equal(row.status,'draft');assert.equal(row.version,1);assert.equal(row.payment_status,'pending');assert.equal(row.matching_status,'unmatched');assert.equal(row.total_amount,0);assert.equal(row.quote_amount,0);assert.equal(row.active_quote_id,null);
    assert.equal((await rows('audit_log')).filter(r=>r.entity_type==='customer_booking'&&r.entity_id===id&&r.action==='customer_draft_created').length,1);
  });
  await test('idempotent replay returns exact stored result with no writes',async()=>{const before=await snapshot();const r=await request(api+'/bookings','POST',aDraft,aToken);assert.equal(r.status,200);assert.deepEqual(r.data,created.data);assert.deepEqual(await snapshot(),before);});
  await test('changed payload with reused request_id rejected without writes',async()=>{const before=await snapshot();denied(await request(api+'/bookings','POST',{...aDraft,pickup_city:'Different'},aToken),400);assert.deepEqual(await snapshot(),before);});
  await test('concurrent draft retries produce one booking, one audit and one completed claim',async()=>{
    const input=draft(),before=await snapshot();const results=await Promise.all([1,2,3,4].map(()=>request(api+'/bookings','POST',input,aToken)));
    assert.ok(results.some(r=>r.status===200));assert.ok(results.every(r=>[200,400].includes(r.status)));
    const replay=await request(api+'/bookings','POST',input,aToken);assert.equal(replay.status,200);
    for(const r of results.filter(r=>r.status===200))assert.deepEqual(r.data,replay.data);
    const after=await snapshot();for(const table of ['customer_booking','audit_log','idempotency_key'])assert.equal(after[table].count,before[table].count+1);
  });
  await test('same request UUID in another organization creates its own draft',async()=>{const r=await request(api+'/bookings','POST',aDraft,bToken);assert.equal(r.status,200);assert.notEqual(r.data.booking.id,id);assert.equal(r.data.booking.customer_organization_id,b.organization_id);});
  for(const [label,change]of [
    ['foreign owner',{customer_organization_id:b.organization_id}],['forged actor',{booked_by_user_id:b.user_id}],['confirmed state',{status:'booked'}],['financial state',{payment_status:'paid_escrow',total_amount:100}],['active quote',{active_quote_id:crypto.randomUUID()}],['invalid windows',{pickup_window_end:aDraft.pickup_window_start-1}],['past pickup',{pickup_window_start:1}],['invalid request UUID',{request_id:'bad'}],['blank city',{pickup_city:' '}]
  ])await test('draft rejects '+label,async()=>{const before=await snapshot();denied(await request(api+'/bookings','POST',{...draft(),...change},aToken),400);assert.deepEqual(await snapshot(),before);});
  const readBefore=await snapshot();
  await test('paginated reads: stable ordering and tenant isolation',async()=>{
    const first=await request(api+'/bookings?page=1&per_page=1&status=draft','GET',undefined,aToken),second=await request(api+'/bookings?page=2&per_page=1&status=draft','GET',undefined,aToken);
    assert.equal(first.status,200);assert.equal(second.status,200);assert.equal(first.data.curPage,1);assert.equal(first.data.nextPage,2);assert.equal(second.data.curPage,2);assert.equal(second.data.nextPage,null);
    const repeat=await request(api+'/bookings?page=1&per_page=1&status=draft','GET',undefined,aToken);assert.deepEqual(repeat.data,first.data);
    assert.notEqual(first.data.items[0].id,second.data.items[0].id);for(const row of [...first.data.items,...second.data.items])assert.equal(row.customer_organization_id,a.organization_id);clean(first.data);
  });
  await test('detail has PR8 envelope and only nine booking fields',async()=>{const r=await request(api+'/bookings/'+id,'GET',undefined,aToken);assert.equal(r.status,200);assert.deepEqual(Object.keys(r.data.booking).sort(),['id','booking_reference','customer_organization_id','status','payment_status','payment_mode','pickup_city','delivery_city','version'].sort());assert.deepEqual(r.data.allowed_actions,[]);for(const field of ['cargo','active_holds','blocking_reasons'])assert.ok(Array.isArray(r.data[field]));clean(r.data);});
  await test('missing and foreign detail IDs have identical 404 bodies',async()=>{const a=await request(api+'/bookings/'+foreign.data.booking.id,'GET',undefined,aToken),b=await request(api+'/bookings/2147483647','GET',undefined,aToken);denied(a,404);denied(b,404);assert.deepEqual(a.data,b.data);});
  await test('bad pagination and unknown state rejected',async()=>{for(const query of ['page=0','per_page=101','status=confirmed'])denied(await request(api+'/bookings?'+query,'GET',undefined,aToken),400);});
  for(const [label,token]of [['anonymous',undefined],['tampered','invalid-token']])await test(label+' cannot access identity, membership or booking APIs',async()=>{for(const route of [auth+'/auth/me',auth+'/organization/membership',api+'/bookings',api+'/bookings/'+id])denied(await request(route,'GET',undefined,token),401);denied(await request(api+'/bookings','POST',draft(),token),401);});
  await test('read and rejected-call phase leaves all 34 domain tables unchanged',async()=>assert.deepEqual(await snapshot(),readBefore));
  const membership=(await rows('organization_member')).find(m=>m.user_id===a.user_id);
  await edit('organization_member',membership.id,{is_active:false});
  await test('revoked membership invalidates existing token and idempotent replay',async()=>{for(const route of [auth+'/auth/me',auth+'/organization/membership',api+'/bookings',api+'/bookings/'+id])denied(await request(route,'GET',undefined,aToken));denied(await request(api+'/bookings','POST',aDraft,aToken));});
  await edit('organization_member',membership.id,{is_active:true});
  await edit('organization',a.organization_id,{status:'suspended'});
  await test('suspended organization denied with existing token',async()=>{denied(await request(api+'/bookings','GET',undefined,aToken));denied(await request(api+'/bookings','POST',draft(),aToken));});
  await edit('organization',a.organization_id,{status:'active'});
  for(const status of ['suspended','pending_verification']){
    await edit('user',a.user_id,{status});
    await test(status+' account rejected on login, read and creation',async()=>{denied(await request(auth+'/auth/login','POST',{email:aInput.email,password:aInput.password}),401);denied(await request(api+'/bookings','GET',undefined,aToken));denied(await request(api+'/bookings','POST',draft(),aToken));});
  }
  await edit('user',a.user_id,{status:'active'});
  for(const role of ['vendor_admin','driver','autonomous_agent','operations_admin','super_admin']){
    await edit('user',a.user_id,{system_role:role});
    await test(role+' cannot read customer bookings or create drafts',async()=>{denied(await request(api+'/bookings','GET',undefined,aToken));denied(await request(api+'/bookings','POST',draft(),aToken));});
  }
  await edit('user',a.user_id,{system_role:'customer_admin'});
  await edit('organization_member',membership.id,{member_role:'billing'});
  await test('billing membership can read but cannot create drafts',async()=>{assert.equal((await request(api+'/bookings','GET',undefined,aToken)).status,200);denied(await request(api+'/bookings','POST',draft(),aToken));});
  await edit('organization_member',membership.id,{member_role:'owner'});
  await test('no operational routes, models or financial/messaging records created',async()=>{
    for(const route of [api+'/bookings/'+id+'/confirm',api+'/bookings/'+id+'/cancel',api+'/payments',api+'/refunds',api+'/assignments'])assert.ok((await request(route,'POST',{},aToken)).status>=400);
    for(const table of ['payment_transaction','refund_request','settlement','trip','active_assignment_reservations','event_outbox','durable_tasks','agent_execution','agent_decision'])assert.equal((await rows(table)).length,0);
  });
  const report={at:new Date().toISOString(),target:isolation,method:'Real tenant HTTP endpoints with application Bearer tokens; metadata only for inspection/negative fixtures',passed:tests.filter(t=>t.passed).length,total:tests.length,tests,
    created:{groups:groups.map(g=>({id:g.id,name:g.name,canonical:g.canonical})),endpoints:endpoints.map(q=>({id:q.id,group_id:q.group_id,name:q.name,verb:q.verb})),synthetic_registration:{user_id:a.user_id,organization_id:a.organization_id,approval_request_id:a.approval_request_id},draft_booking_id:id},
    baseline_counts:Object.fromEntries(Object.entries(start).map(([k,v])=>[k,v.count])),final_counts:Object.fromEntries(Object.entries(await snapshot()).map(([k,v])=>[k,v.count]))};
  c.save('runtime',report);console.log(JSON.stringify({passed:report.passed,total:report.total,created:report.created,failures:tests.filter(t=>!t.passed)},null,2));
  if(report.passed!==report.total)process.exitCode=1;
}
main().catch(e=>{c.save('blocker',{tests,code:e.code||e.name});console.error('Suite blocked: '+e.message);process.exitCode=1;});
