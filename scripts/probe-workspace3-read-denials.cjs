'use strict';
// Deliberately has no credential/config loader. Only GETs with absent or invalid auth.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const origin='https://xynd-fnea-khtp.n7e.xano.io';
async function main(){
 const [snapshot,out]=process.argv.slice(2);assert.ok(snapshot&&out,'Usage: node scripts/probe-workspace3-read-denials.cjs <captured-source-root> <new-receipt.json>');
 const inventory=JSON.parse(fs.readFileSync(path.join(snapshot,'published-inventory.json')));
 const sources=['query:auth/me:GET:Authentication','query:bookings:GET:Zippy_V1','query:bookings/{booking_id}:GET:Zippy_V1'].map(key=>{
  const d=inventory.documents.find(x=>x.key===key);assert.ok(d);
  const s=fs.readFileSync(path.join(snapshot,d.file),'utf8');assert.match(s,/auth = "user"/);assert.doesNotMatch(s,/db\.(add|edit|delete)|api\.request/);
  assert.equal(crypto.createHash('sha256').update(s.trim()).digest('hex'),d.sha256);return {key,sha256:d.sha256};
 });
 const receipt={at:new Date().toISOString(),workspace:3,branch:'v1',data_source:'live',scope:'Unauthenticated read denial only; no synthetic account or hosted acceptance',sources,requests:[]};
 const fd=fs.openSync(out,'wx');
 try{
  for(const route of ['/api:pofBqnrY/auth/me','/api:zippy-v1/bookings','/api:zippy-v1/bookings/1','/api:zippy-v1/bookings?page=2&per_page=1&status=draft']){
   for(const mode of ['anonymous','malformed_bearer']){
    const r=await fetch(origin+route,{method:'GET',headers:mode==='anonymous'?{Accept:'application/json'}:{Accept:'application/json',Authorization:'Bearer invalid-synthetic-not-a-jwt'},redirect:'error',signal:AbortSignal.timeout(15000)});
    // Never retain arbitrary response content or record values, even if the denial fails.
    let body;try{body=await r.json();}catch{body=null;}
    const shape=body===null?'null':Array.isArray(body)?'array':typeof body;
    const allowedKeys=['code','message','payload'];
    const keys=shape==='object'?Object.keys(body):[];
    const item={route,mode,status:r.status,shape,keys:keys.map(k=>allowedKeys.includes(k)?k:'[UNEXPECTED_KEY]'),code:typeof body?.code==='string'&&/^ERROR_CODE_[A-Z_]+$/.test(body.code)?body.code:null,message_type:typeof body?.message,at:new Date().toISOString()};
    item.passed=[401,403].includes(r.status)&&shape==='object'&&keys.every(k=>allowedKeys.includes(k))&&typeof body.message==='string';
    receipt.requests.push(item);console.log(JSON.stringify(item));
    if(!item.passed)throw Error('DENIAL_NOT_ESTABLISHED');
   }
  }
  receipt.result='VERIFIED';
 }catch(e){receipt.result='FAILED';receipt.error=e.name;process.exitCode=1;}
 finally{fs.writeFileSync(fd,JSON.stringify(receipt,null,2)+'\n');fs.closeSync(fd);}
}
main().catch(e=>{console.error(e.name);process.exitCode=1;});
