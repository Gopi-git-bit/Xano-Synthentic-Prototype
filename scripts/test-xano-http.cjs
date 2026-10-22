'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {checkConnection}=require('./check-xano-http.cjs');
const doc='function "Slice1/isolation_probe" {\n  response = null\n}';
const sourceHash=crypto.createHash('sha256').update(doc).digest('hex');
const credential='synthetic-test-token-do-not-store';
async function execute({app='',override}={}){
 const calls=[];
 const fake=async(url,options)=>{
  calls.push({url,options});
  if(override){const response=override(url,options);if(response)return response;}
  if(!url.startsWith('https://xynd-fnea-khtp.n7e.xano.io'))return new Response('{}',{status:url.endsWith('/health')?200:401});
  if(!options.headers.Authorization)return new Response('{"sensitive":"server-error"}',{status:401});
  if(url.endsWith('/x2/mcp/meta/mcp/stream')){const body=JSON.parse(options.body);if(body.method==='initialize')return Response.json({jsonrpc:'2.0',id:1,result:{protocolVersion:'2024-11-05'}},{headers:{'Mcp-Session-Id':'synthetic-session-do-not-store'}});if(body.method==='notifications/initialized')return new Response(null,{status:202});return new Response('event: message\ndata: '+JSON.stringify({jsonrpc:'2.0',id:2,result:{tools:[{name:'readonly_docs'}]}})+'\n\n',{headers:{'Content-Type':'text/event-stream'}});}
  if(url.endsWith('/auth/me'))return Response.json({extras:{access_token:{keyid:'private',scope:{'workspace:datasource:live':15}},password:credential}});
  if(url.includes('/sandbox/multidoc'))return new Response(doc);
  if(url.endsWith('/function/run'))return Response.json({result:{status:'ok',result:{database:'sn9m-aat6-200c',physical_table_count:51}},logs:[credential]});
  return Response.json({id:1,name:'Zippy Synthetic Prototype',branch:'v1',preferences:{allow_push:false}});
 };
 return {report:await checkConnection({token:credential,sourceHash,fetchImpl:fake,applicationBaseUrl:app}),calls};
}
(async()=>{
 const missing=await checkConnection({token:'',sourceHash,fetchImpl:()=>{throw Error('Unexpected network');}});assert.equal(missing.checks[0].status,'FAIL');
 const base=await execute();assert.equal(base.report.status,'PASS_METADATA_ONLY');assert.equal(base.report.ready,false);assert.equal(base.report.checks.at(-1).status,'NOT_VERIFIED');assert.ok(!JSON.stringify(base.report).includes(credential));assert.equal(base.calls.filter(c=>c.options.method==='POST').length,4);
 const app=await execute({app:'https://synthetic-test.xano.io/api:proof'});assert.equal(app.report.status,'PASS_METADATA_ONLY');assert.ok(app.calls.filter(c=>c.url.includes('synthetic-test.xano.io')).every(c=>!c.options.headers.Authorization));
 const wrong=await execute({override:url=>url.endsWith('/function/run')?Response.json({result:{status:'ok',result:{database:'live',physical_table_count:51}}}):null});assert.equal(wrong.report.checks.at(-1).code,'DATABASE_IDENTITY_NOT_PROVED');
 const residue=await execute({override:url=>url.endsWith('/function/run')?Response.json({result:{status:'ok',result:{database:'sn9m-aat6-200c',physical_table_count:53}}}):null});
 assert.equal(residue.report.ready,false);assert.equal(residue.report.checks.find(c=>c.name==='sandbox_database_identity').status,'PASS');
 assert.deepEqual(residue.report.checks.at(-1),{name:'sandbox_physical_inventory',status:'FAIL',code:'UNEXPECTED_PHYSICAL_TABLE_COUNT',expected_physical_tables:51,observed_physical_tables:53});
 assert.ok(!residue.calls.some(c=>c.url.includes('/mcp/stream')));
 const drift=await execute({override:url=>url.includes('/sandbox/multidoc')?new Response(doc+'\n// unreviewed change'):null});assert.equal(drift.report.checks.at(-1).code,'SOURCE_DRIFT');assert.equal(drift.calls.filter(c=>c.options.method==='POST').length,0);
 const publicMetadata=await execute({override:(url,o)=>!o.headers.Authorization?Response.json({password:credential}):null});assert.equal(publicMetadata.report.checks[0].status,'FAIL');assert.equal(publicMetadata.calls.length,1);
 console.log('PASS: missing credential, safe connection, redaction, admin-token separation, database mismatch, source drift, and unauthenticated denial checks.');
})().catch(e=>{console.error(e);process.exitCode=1});
