'use strict';
// Explicit allowlist: original reports stay local, only assertions and hashes enter Git.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const source=path.resolve(process.argv[2]);
const root=path.resolve(__dirname,'..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(source,relative),'utf8'));
const runtime=read('evidence/runtime-tests.json');
const final=read('evidence/final-report.json');
const validation=read('local-validation.json');
assert.equal(runtime.passed,65); assert.equal(runtime.total,65);
assert.equal(validation.results.length,48); assert.ok(validation.results.every(r=>r.valid));
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const manifest=walk(path.join(root,'candidate')).sort().map(file=>{
  const relative=path.relative(path.join(root,'candidate'),file);
  const bytes=fs.readFileSync(file);
  assert.deepEqual(bytes,fs.readFileSync(path.join(source,'candidate',relative)),relative+' differs from verified candidate');
  return {file:relative.replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
});
const report={
  at:runtime.at, evidence_kind:'historical actual isolated execution',
  tenant:{id:final.target.tenant_id,name:final.target.name,workspace_id:final.target.workspace_id,expires_at:final.target.expires_at},
  tools:final.created_tools.map(t=>({name:t.name,id:t.id,guid:t.guid,metadata_verified:t.metadata_verified})),
  helpers:final.created_functions.map(f=>({name:f.name,id:f.id,guid:f.guid})),
  validation:{version:validation.version.version,passed:48,total:48},
  runtime:{passed:65,total:65,method:final.validation.method,
    tests:runtime.tests.map(t=>({label:t.label,tool:t.tool,actor:t.actor,http_status:t.http_status,execution_status:t.execution_status,passed:t.passed}))},
  domain_tables_unchanged:JSON.stringify(runtime.before)===JSON.stringify(runtime.after),
  table_count:Object.keys(runtime.before).length,
  source_preservation:final.preservation,
  mcp_transport:{verified:false,attempt_status:404},
  candidate_sha256:manifest,
  limitations:final.limitations
};
fs.writeFileSync(path.join(root,'evidence/verified-20261103.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({candidate_files:manifest.length,tests:report.runtime.total,raw_responses_preserved:false}));
