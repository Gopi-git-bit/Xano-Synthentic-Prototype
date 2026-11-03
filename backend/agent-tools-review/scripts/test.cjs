'use strict';
const c=require('./tenant-lib.cjs');
const f=c.load('fixtures');
const tools=c.load('created-tools');
const {toolset_id}=c.load('bindings');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const ids=Object.fromEntries(tools.map(t=>[t.name,t.id]));
const tokens={};
const tests=[];
function canonical(v){return Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;}
async function snapshot(){
  const result={};
  for(const [name,id]of Object.entries(f.tables)){
    const rows=await c.ok('/table/'+id+'/content?per_page=100');
    assert.ok(!rows.nextPage,'Unexpected fixture pagination');
    const items=(rows.items||rows).sort((a,b)=>a.id-b.id);
    result[name]={count:items.length,sha256:crypto.createHash('sha256').update(JSON.stringify(canonical(items))).digest('hex')};
  }
  return result;
}
async function call(label,name,actor,input,expectation){
  const token=actor==='tampered'?'not-a-valid-token':tokens[actor]||'';
  const r=await c.request('/tool/'+ids[name]+'/debug','POST',{input,toolset_id,token});
  const result=r.data?.result;
  const output=result?.result;
  // Stack logs and authentication tokens are deliberately excluded from evidence.
  const entry={label,tool:name,actor,http_status:r.status,execution_status:result?.status,
    error_code:result?.exception?.error_type||r.data?.code,passed:false};
  try{
    if(expectation==='denied'){
      assert.ok(r.status===401||r.status===403||result?.status==='exception','Expected authorization failure');
      assert.ok(['ERROR_CODE_ACCESS_DENIED','ERROR_CODE_UNAUTHORIZED'].includes(result?.exception?.error_type||r.data?.code),'Failure must be an authorization rejection');
    }else if(expectation==='input'){
      assert.ok(r.status===400||result?.status==='exception','Expected typed input rejection');
      assert.equal(result?.exception?.error_type||r.data?.code,'ERROR_CODE_INPUT_ERROR');
    }else{
      assert.equal(r.status,200);
      assert.equal(result?.status,'ok');
      assert.equal(output.ok,true);assert.equal(output.tool,name);assert.equal(output.mode,'read_only');assert.equal(output.execution_enabled,false);
      assert.ok(output.data&&typeof output.data==='object');
      assert.ok(!/MUST-NOT-LEAK|gateway_signature|gateway_response|otp_code|password|claim_token|private_storage_key|signature_image_url|document_image_url/.test(JSON.stringify(output)),'Sensitive data leaked');
      expectation(output.data);
    }
    entry.passed=true;
  }catch{entry.assertion='Runtime assertion failed';}
  for(const token of Object.values(tokens))assert.ok(!JSON.stringify(entry).includes(token));
  tests.push(entry);
}
async function main(){
  const isolation=await c.verify();assert.equal(f.tenant,c.tenant);
  for(const [name,user]of Object.entries(f.users)){
    const row=await c.ok('/table/'+f.tables.user+'/content/'+user.id);
    assert.equal(row.email,user.email);assert.ok(user.email.endsWith('@example.invalid'));
    const password=crypto.randomBytes(24).toString('hex')+'Aa1!';
    await c.ok('/table/'+f.tables.user+'/content/'+user.id,'PUT',{password,status:'active'});
    const login=await c.ok('/api:zippy-review-auth/login','POST',{email:user.email,password},{runtime:true});
    assert.ok(login.authToken);tokens[name]=login.authToken;
  }
  await c.ok('/table/'+f.tables.user+'/content/'+f.users.suspended.id,'PUT',{status:'suspended'});
  await c.ok('/table/'+f.tables.user+'/content/'+f.users.unverified.id,'PUT',{status:'pending_verification'});
  const before=await snapshot();
  const booking={booking_id:f.bookings.a};
  const candidate={...booking,vehicle_id:f.vehicles.good,driver_id:f.drivers.good};
  const refund={payment_transaction_id:f.payments.captured,requested_amount_minor:5000,currency:'INR',reason_code:'service_issue'};
  const inputs={zippy_get_booking:booking,zippy_validate_order:booking,zippy_check_vehicle_eligibility:candidate,zippy_propose_assignment:candidate,zippy_review_pod:{pod_id:f.pods.good},zippy_get_payment_summary:booking,zippy_prescreen_refund:refund};
  await call('owned booking','zippy_get_booking','alice',booking,d=>assert.equal(d.booking.id,f.bookings.a));
  await call('owned booking via quote UUID','zippy_get_booking','alice',{booking_quote:f.quotes.a},d=>assert.equal(d.booking.id,f.bookings.a));
  await call('quote pair mismatch','zippy_get_booking','alice',{booking_id:f.bookings.delivered,booking_quote:f.quotes.a},'input');
  await call('missing booking identifier','zippy_get_booking','alice',{},'input');
  await call('valid stored order','zippy_validate_order','alice',booking,d=>assert.equal(d.valid,true));
  await call('invalid order and active hold','zippy_validate_order','alice',{booking_id:f.bookings.invalid},d=>{assert.equal(d.valid,false);assert.ok(d.reason_codes.includes('CARGO_MISSING'));assert.ok(d.reason_codes.includes('ACTIVE_HOLD'));});
  await call('eligible fleet candidate','zippy_check_vehicle_eligibility','operator',candidate,d=>{assert.equal(d.eligible_for_review,true);assert.equal(d.requires_human_review,true);});
  await call('non-binding assignment proposal','zippy_propose_assignment','operator',candidate,d=>{assert.equal(d.proposal_eligible,true);assert.equal(d.persisted,false);assert.equal(d.assignment_executed,false);});
  await call('capacity compliance and reservation conflicts','zippy_check_vehicle_eligibility','operator',{...candidate,vehicle_id:f.vehicles.bad,driver_id:f.drivers.bad},d=>{assert.equal(d.eligible_for_review,false);for(const reason of ['PAYLOAD_CAPACITY','VOLUME_CAPACITY','VEHICLE_UNAVAILABLE','ASSIGNMENT_CONFLICT','COMPLIANCE_INSURANCE'])assert.ok(d.fleet.reason_codes.includes(reason));});
  await call('cross-carrier driver assignment rejected','zippy_propose_assignment','operator',{...candidate,driver_id:f.drivers.foreign},'denied');
  await call('complete POD evidence','zippy_review_pod','alice',{pod_id:f.pods.good},d=>{assert.equal(d.evidence_complete,true);assert.equal(d.approval_performed,false);assert.equal(d.settlement_enabled,false);});
  await call('invalid POD relationships and missing evidence','zippy_review_pod','alice',{pod_id:f.pods.invalid},d=>{assert.equal(d.evidence_complete,false);assert.ok(d.reason_codes.includes('POD_RELATIONSHIP_MISMATCH'));assert.ok(d.reason_codes.includes('RECIPIENT_VERIFICATION_MISSING'));});
  await call('payment minor-unit summary','zippy_get_payment_summary','alice',booking,d=>{assert.equal(d.captured_transaction_minor,10000);assert.equal(d.authorized_transaction_minor,5000);assert.equal(d.payment_execution_enabled,false);});
  await call('bounded refund prescreen','zippy_prescreen_refund','alice',refund,d=>{assert.equal(d.eligible_for_human_review,true);assert.equal(d.available_for_prescreen_minor,8000);assert.equal(d.refund_approved,false);assert.equal(d.refund_request_created,false);assert.equal(d.refund_executed,false);});
  await call('refund exceeds unclaimed captured amount','zippy_prescreen_refund','alice',{...refund,requested_amount_minor:9000},d=>{assert.equal(d.eligible_for_human_review,false);assert.ok(d.reason_codes.includes('AMOUNT_EXCEEDS_UNCLAIMED_PAYMENT'));});
  await call('uncaptured payment refund rejected','zippy_prescreen_refund','alice',{...refund,payment_transaction_id:f.payments.authorized},d=>{assert.equal(d.eligible_for_human_review,false);assert.ok(d.reason_codes.includes('PAYMENT_NOT_CAPTURED'));});
  await call('refund reason inconsistent with booking','zippy_prescreen_refund','alice',{...refund,reason_code:'cancelled_booking'},d=>{assert.equal(d.eligible_for_human_review,false);assert.ok(d.reason_codes.includes('CANCELLATION_REASON_NOT_SUPPORTED_BY_BOOKING'));});
  await call('negative refund input','zippy_prescreen_refund','alice',{...refund,requested_amount_minor:-1},'input');
  await call('unsupported currency input','zippy_prescreen_refund','alice',{...refund,currency:'USD'},'input');
  await call('corrupt payment ownership','zippy_get_payment_summary','alice',{booking_id:f.bookings.corrupt},'denied');
  await call('corrupt refund payment ownership','zippy_prescreen_refund','alice',{...refund,payment_transaction_id:f.payments.corrupt},'denied');
  for(const [name,input]of Object.entries(inputs)){
    await call('anonymous '+name,name,'anonymous',input,'denied');
    await call('tampered token '+name,name,'tampered',input,'denied');
    await call('suspended account '+name,name,'suspended',input,'denied');
  }
  for(const name of ['zippy_get_booking','zippy_validate_order','zippy_review_pod','zippy_get_payment_summary','zippy_prescreen_refund']){
    await call('cross-customer ownership '+name,name,'bob',inputs[name],'denied');
    await call('driver role '+name,name,'driver',inputs[name],'denied');
  }
  for(const name of ['zippy_check_vehicle_eligibility','zippy_propose_assignment']){
    await call('customer cannot dispatch '+name,name,'alice',inputs[name],'denied');
    await call('vendor cannot inspect unassigned customer freight '+name,name,'vendor',inputs[name],'denied');
  }
  for(const name of ['zippy_get_payment_summary','zippy_prescreen_refund','zippy_review_pod'])await call('member lacks privileged role '+name,name,'member',inputs[name],'denied');
  await call('inactive membership','zippy_get_booking','inactive_member',booking,'denied');
  await call('pending verification account','zippy_get_booking','unverified',booking,'denied');
  await call('forged role input does not elevate member','zippy_get_payment_summary','member',{...booking,role:'super_admin',user_id:f.users.operator.id,organization_id:f.organizations.b},'denied');
  await call('operator does not bypass customer read contract','zippy_get_booking','operator',booking,'denied');
  const after=await snapshot();
  let unchanged=true;try{assert.deepEqual(after,before);}catch{unchanged=false;}
  tests.push({label:'all 34 domain tables unchanged by tool calls',passed:unchanged});
  tests.push({label:'no external-message or approval outbox records',passed:after.event_outbox.count===0&&after.durable_tasks.count===0&&after.approval_request.count===0});
  const report={at:new Date().toISOString(),isolation,passed:tests.filter(t=>t.passed).length,total:tests.length,tests,before,after};
  c.save('runtime-tests',report);
  console.log(JSON.stringify({passed:report.passed,total:report.total,unchanged,failures:tests.filter(t=>!t.passed)},null,2));
  if(report.passed!==report.total)process.exitCode=1;
}
main().catch(()=>{c.save('runtime-test-blocker',{tests});console.error('Runtime suite blocked; inspect target configuration and synthetic fixture state.');process.exitCode=1;});
