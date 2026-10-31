'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir='backend/reconciliation-20261029',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const file=path.join(root,dir,'manifest.json');
const scripts=['check-workspace3-known-gaps.cjs','package-workspace3-evidence.cjs','probe-workspace3-read-denials.cjs','run-workspace3-offline-checks.cjs','test-workspace3-mutation-refusal.cjs','validate-committed-five-agent-package.cjs','verify-workspace3-evidence.cjs','record-workspace3-final-checks.cjs','audit-workspace3-review.cjs'];
function walk(p){return fs.readdirSync(path.join(root,p),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);}
if(process.argv.includes('--seal')){
 assert.ok(!fs.existsSync(file),'Keep the original seal; do not overwrite');
 const paths=[...walk(dir).filter(p=>!p.endsWith('/manifest.json')),...scripts.map(p=>'scripts/'+p)].sort();
 const files=paths.map(p=>{const b=fs.readFileSync(path.join(root,p));return {path:p,bytes:b.length,sha256:hash(b)};});
 fs.writeFileSync(file,JSON.stringify({created_at:new Date().toISOString(),base_git_commit:'ed62038f571c02f339972ad7ec5d7cd1a9cffe18',workspace:3,branch:'v1',data_source:'live',synthetic_environment:null,hosted_candidate_runs:0,files},null,2)+'\n',{flag:'wx'});
}
const manifest=JSON.parse(fs.readFileSync(file));
for(const f of manifest.files){const b=fs.readFileSync(path.join(root,f.path));assert.equal(b.length,f.bytes,f.path);assert.equal(hash(b),f.sha256,f.path);}
for(const mode of ['published','draft']){
 const inventory=JSON.parse(fs.readFileSync(path.join(root,dir,'evidence',mode+'-inventory.json')));
 for(const d of inventory.documents)assert.equal(hash(fs.readFileSync(path.join(root,dir,'evidence',d.file),'utf8').trim()),d.sha256,d.key);
 assert.equal(hash(inventory.documents.map(d=>d.key+'\t'+d.sha256).join('\n')),inventory.inventory_sha256);
}
console.log('VERIFIED '+manifest.files.length+' review artifacts and both 84-definition inventories (offline byte integrity only).');
