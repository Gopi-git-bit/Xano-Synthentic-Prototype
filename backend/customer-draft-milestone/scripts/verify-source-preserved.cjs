'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
assert.ok(process.argv[2],'Supply the local original inspection directory');
const original=path.resolve(process.argv[2]),base=path.resolve(__dirname,'..');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function manifest(dir){return Object.fromEntries(walk(dir).sort().map(file=>[path.relative(dir,file).replaceAll('\\','/'),hash(fs.readFileSync(file))]));}
const checks=[];
for(const kind of ['published','drafts']){
  const before=manifest(path.join(original,'baseline-'+kind)),after=manifest(path.join(base,'.sandbox/source-'+kind));
  assert.deepEqual(after,before,'Source '+kind+' changed');
  checks.push({kind,unchanged:true,files:Object.keys(before).length,sha256:hash(JSON.stringify(before))});
}
fs.writeFileSync(path.join(base,'evidence/source-preservation-20261103.json'),JSON.stringify({at:new Date().toISOString(),checks},null,2)+'\n');
console.log(JSON.stringify(checks,null,2));
