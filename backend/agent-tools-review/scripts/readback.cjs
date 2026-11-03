'use strict';
const c=require('./tenant-lib.cjs');
const assert=require('node:assert/strict');
async function main(){
  const isolation=await c.verify();
  const tools=await c.list('tool','&include_draft=true&include_xanoscript=true');
  const functions=await c.list('function','&include_draft=true&include_xanoscript=true');
  const tables=await c.list('table');
  const servers=await c.list('mcp_server','&include_xanoscript=true');
  const groups=await c.list('apigroup');
  const checks=tools.map(t=>({id:t.id,name:t.name,guid:t.guid,description:!!t.description,instructions:!!t.instructions,tags:t.tag,input_count:t.input?.length,output_schema:t.output_schema,xanoscript_status:t.xanoscript?.status}));
  assert.equal(tools.length,7);
  for(const t of tools){
    assert.ok(t.name.startsWith('zippy_'));assert.ok(t.description);assert.ok(t.instructions);
    assert.ok(t.tag.length>=4);assert.ok(t.input.length>0);assert.equal(t.xanoscript.status,'ok');
    assert.ok(t.output_schema);
    assert.ok(t.xanoscript.value.includes('execution_enabled: false'));
    assert.ok(t.xanoscript.value.includes('$auth.id'));
  }
  assert.equal(servers.length,1);
  assert.equal((servers[0].xanoscript.value.match(/auth: "user"/g)||[]).length,7);
  c.save('created-tools',tools.map(t=>({id:t.id,name:t.name,guid:t.guid})));
  c.save('bindings',{toolset_id:servers[0].id});
  c.save('readback',{at:new Date().toISOString(),isolation,checks,functions:functions.map(f=>({id:f.id,name:f.name,guid:f.guid})),tables:tables.length,servers:servers.map(s=>({id:s.id,name:s.name,tools:s.tools})),receipts:c.receipts});
  console.log(JSON.stringify({isolation,tools:tools.map(t=>({id:t.id,name:t.name})),verified:true},null,2));
}
main().catch(()=>{console.error('Readback verification failed.');process.exitCode=1;});
