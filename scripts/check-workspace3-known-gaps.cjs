'use strict';
// Intentionally RED source-readiness assertions. No database/runtime simulation.
// Run explicitly; these are open implementation gates, not normal regression tests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.argv[2]||path.resolve(__dirname,'../backend/reconciliation-20261029/evidence');
const source=p=>fs.readFileSync(path.join(root,'draft',p+'.xs'),'utf8').replace(/\/\/[^\n]*/g,'');
const create=source('function/booking/create_draft'),pricing=source('function/pricing/calculate_quote'),command=source('function/security/validate_command');
const checks=[
 ['distance has no invented 480-km fallback',()=>assert.doesNotMatch(create+pricing,/\b480\b/)],
 ['all cargo weight validation precedes booking insert',()=>{const weight=create.indexOf('precondition ($c.weight_kg');assert.ok(weight>=0&&weight<create.indexOf('db.add customer_booking'));}],
 ['booking reference uses collision-resistant identity',()=>assert.match(create,/security\.create_uuid/)],
 ['create booking and cargo declare transaction boundary',()=>assert.match(create,/db\.transaction/)],
 ['confirmation and outbox declare transaction boundary',()=>assert.match(source('function/booking/confirm_booking'),/db\.transaction/)],
 ['idempotency is mandatory',()=>assert.doesNotMatch(command,/text\? idempotency_key/)],
 ['idempotency expiry is checked',()=>assert.match(command,/\$[\w]+\.expires_at\s*[<>]=?\s*now/)],
 ['reservation unique constraints cover vehicle and driver',()=>{const s=source('table/active_assignment_reservations');for(const field of ['vehicle_id','driver_id'])assert.match(s,new RegExp('type\\s*:\\s*"btree\\|unique"\\s*,?\\s*field\\s*:\\s*\\[\\{name:\\s*"'+field+'"'));}],
 ['durable worker schema has explicit fencing generation',()=>assert.match(source('table/durable_tasks'),/\b(?:fencing_token|lease_generation)\b/)],
 ['consent challenge is not a fixed numeric literal',()=>assert.doesNotMatch(source('function/booking/create_consent_attempt'),/"\d{6}"\s*\|sha256/)],
 ['OTP decision validates before consuming challenge',()=>{const s=source('function/booking/record_consent_decision');assert.ok(s.indexOf('precondition ($input.decision')<s.indexOf('db.edit otp_challenges'));}]
];
const results=checks.map(([name,run])=>{try{run();return {name,status:'VERIFIED',scope:'source only'};}catch{return {name,status:'FAILED',scope:'source only'};}});
console.log(JSON.stringify({scope:'Known source gaps; a passing pattern is not hosted acceptance',results},null,2));
if(results.some(x=>x.status==='FAILED'))process.exitCode=1;
